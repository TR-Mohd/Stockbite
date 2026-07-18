import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm.exc import StaleDataError
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..auth import get_current_user, role_required
from typing import List
from ..models import User, RoleEnum, Transaction, TransactionItem, MenuItem, Ingredient, Recipe, AuditLog, OrderTypeEnum, ItemModifierGroup, ItemModifier, TransactionItemModifier
from ..schemas import TransactionCreate, TransactionResponse, MenuItemResponse
from decimal import Decimal

router = APIRouter(prefix="/pos", tags=["POS"])
logger = logging.getLogger(__name__)

@router.get("/menu", response_model=List[MenuItemResponse])
async def get_menu(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    result = await db.execute(
        select(MenuItem)
        .options(
            selectinload(MenuItem.modifier_groups).selectinload(ItemModifierGroup.modifiers),
            selectinload(MenuItem.recipes).selectinload(Recipe.ingredient)
        )
        .where(MenuItem.is_active == True)
    )
    items = result.scalars().all()
    for item in items:
        try:
            item.is_available = True
            for recipe in item.recipes:
                if recipe.ingredient and recipe.ingredient.stock_level <= 0:
                    item.is_available = False
                    break
        except Exception as e:
            logger.error(f"Error checking stock for item {item.id}: {e}")
            item.is_available = True
            
    return items

@router.post("/checkout", response_model=TransactionResponse)
async def checkout(
    order: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Cashier]))
):
    if order.order_type == OrderTypeEnum.DineIn and not order.routing_number:
        raise HTTPException(status_code=400, detail="Table number is required for Dine-In orders")

    if not order.items:
        raise HTTPException(status_code=400, detail="Cannot process an empty transaction")

    # Retrieve all menu items in the cart
    menu_item_ids = [item.menu_item_id for item in order.items]
    result = await db.execute(select(MenuItem).options(selectinload(MenuItem.recipes)).where(MenuItem.id.in_(menu_item_ids)))
    menu_items = {mi.id: mi for mi in result.scalars().all()}
    
    # Retrieve all selected modifiers
    modifier_ids_nested = [m_id for item in order.items for m_id in item.modifier_ids]
    modifiers = {}
    if modifier_ids_nested:
        result_mods = await db.execute(
            select(ItemModifier)
            .options(selectinload(ItemModifier.modifier_recipes))
            .where(ItemModifier.id.in_(modifier_ids_nested))
        )
        modifiers = {m.id: m for m in result_mods.scalars().all()}

    subtotal = Decimal("0.0")
    ingredient_deductions = {}

    # Calculate total and required ingredients
    for item in order.items:
        if item.quantity <= 0:
            raise HTTPException(status_code=400, detail="Item quantity must be positive")
            
        if item.menu_item_id not in menu_items:
            raise HTTPException(status_code=400, detail=f"Menu item {item.menu_item_id} not found")
        mi = menu_items[item.menu_item_id]
        if not mi.is_active:
            raise HTTPException(status_code=400, detail=f"Menu item {mi.name} is inactive")
        
        item_price = Decimal(str(mi.price))
        
        # Process modifiers
        for m_id in item.modifier_ids:
            if m_id not in modifiers:
                raise HTTPException(status_code=400, detail=f"Modifier {m_id} not found")
            item_price += Decimal(str(modifiers[m_id].price_adjustment))
            
            for m_recipe in modifiers[m_id].modifier_recipes:
                if m_recipe.ingredient_id not in ingredient_deductions:
                    ingredient_deductions[m_recipe.ingredient_id] = Decimal("0.0")
                ingredient_deductions[m_recipe.ingredient_id] += m_recipe.quantity * item.quantity
            
        subtotal += item_price * item.quantity

        for recipe in mi.recipes:
            if recipe.ingredient_id not in ingredient_deductions:
                ingredient_deductions[recipe.ingredient_id] = Decimal("0.0")
            ingredient_deductions[recipe.ingredient_id] += recipe.quantity * item.quantity

    # Fetch required ingredients to verify stock with pessimistic lock (SELECT FOR UPDATE)
    ing_result = await db.execute(
        select(Ingredient)
        .where(Ingredient.id.in_(ingredient_deductions.keys()))
        .order_by(Ingredient.id.asc())
        .with_for_update()
    )
    ingredients = {ing.id: ing for ing in ing_result.scalars().all()}

    for ing_id, required_qty in ingredient_deductions.items():
        if ing_id not in ingredients:
            raise HTTPException(status_code=400, detail=f"Ingredient {ing_id} not found")
        ing = ingredients[ing_id]
        if ing.stock_level < required_qty:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {ing.name}")
        
        # Deduct stock (will trigger Optimistic Locking version_id bump on commit)
        ing.stock_level -= required_qty

    # Calculate tax and round early for IDR precision
    from decimal import ROUND_HALF_UP
    tax = (subtotal * Decimal("0.11")).quantize(Decimal("1"), rounding=ROUND_HALF_UP)
    total_amount = subtotal + tax

    # Calculate change
    change = Decimal("0.0")
    if order.payment_method == "Cash":
        if order.amount_tendered is None:
            raise HTTPException(status_code=400, detail="Amount tendered is required for Cash payments")
        amount_tendered = Decimal(str(order.amount_tendered))
        if amount_tendered < total_amount:
            raise HTTPException(status_code=400, detail="Insufficient amount tendered")
        change = amount_tendered - total_amount

    # Create Transaction
    db_txn = Transaction(
        subtotal=subtotal,
        tax=tax,
        total_amount=total_amount,
        payment_method=order.payment_method,
        amount_tendered=order.amount_tendered,
        change=change,
        whatsapp=order.whatsapp,
        email=order.email,
        cashier_id=current_user.id,
        order_type=order.order_type,
        routing_number=order.routing_number
    )
    db.add(db_txn)

    for item in order.items:
        mi = menu_items[item.menu_item_id]
        
        item_cogs = sum(
            recipe.quantity * ingredients[recipe.ingredient_id].unit_cost 
            for recipe in mi.recipes
        )
        
        db_txn_item = TransactionItem(
            transaction=db_txn,
            menu_item_id=mi.id,
            quantity=item.quantity,
            notes=item.notes,
            price_at_time=mi.price,
            cogs_per_unit=item_cogs
        )
        db.add(db_txn_item)
        
        # Add modifier records
        for m_id in item.modifier_ids:
            mod = modifiers[m_id]
            
            mod_cogs = sum(
                m_recipe.quantity * ingredients[m_recipe.ingredient_id].unit_cost 
                for m_recipe in mod.modifier_recipes
            )
            
            txn_mod = TransactionItemModifier(
                transaction_item=db_txn_item,
                modifier_id=m_id,
                price_at_time=mod.price_adjustment,
                cogs_per_unit=mod_cogs
            )
            db.add(txn_mod)

    # Audit log
    audit = AuditLog(
        user_id=current_user.id,
        action="Transaction Checkout",
        resource="POS",
        outcome="Success"
    )
    db.add(audit)

    try:
        await db.commit()
    except StaleDataError:
        await db.rollback()
        raise HTTPException(
            status_code=409, 
            detail="Transaction failed due to concurrent inventory update. Please retry."
        )
    except Exception as e:
        await db.rollback()
        logger.error(f"Transaction checkout failed: {str(e)}")
        raise HTTPException(status_code=500, detail="An internal server error occurred")
    
    await db.refresh(db_txn)
    return db_txn
