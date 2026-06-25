from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm.exc import StaleDataError
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..auth import get_current_user, role_required
from typing import List
from ..models import User, RoleEnum, Transaction, TransactionItem, MenuItem, Ingredient, Recipe, AuditLog
from ..schemas import TransactionCreate, TransactionResponse, MenuItemResponse

router = APIRouter(prefix="/pos", tags=["POS"])

@router.get("/menu", response_model=List[MenuItemResponse])
async def get_menu(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(MenuItem).where(MenuItem.is_active == True))
    return result.scalars().all()

@router.post("/checkout", response_model=TransactionResponse)
async def checkout(
    order: TransactionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Cashier]))
):
    # Retrieve all menu items in the cart
    menu_item_ids = [item.menu_item_id for item in order.items]
    result = await db.execute(select(MenuItem).options(selectinload(MenuItem.recipes)).where(MenuItem.id.in_(menu_item_ids)))
    menu_items = {mi.id: mi for mi in result.scalars().all()}

    total_amount = 0.0
    ingredient_deductions = {}

    # Calculate total and required ingredients
    for item in order.items:
        if item.menu_item_id not in menu_items:
            raise HTTPException(status_code=400, detail=f"Menu item {item.menu_item_id} not found")
        mi = menu_items[item.menu_item_id]
        if not mi.is_active:
            raise HTTPException(status_code=400, detail=f"Menu item {mi.name} is inactive")
        
        total_amount += mi.price * item.quantity

        for recipe in mi.recipes:
            if recipe.ingredient_id not in ingredient_deductions:
                ingredient_deductions[recipe.ingredient_id] = 0.0
            ingredient_deductions[recipe.ingredient_id] += recipe.quantity * item.quantity

    # Fetch required ingredients to verify stock
    ing_result = await db.execute(select(Ingredient).where(Ingredient.id.in_(ingredient_deductions.keys())))
    ingredients = {ing.id: ing for ing in ing_result.scalars().all()}

    for ing_id, required_qty in ingredient_deductions.items():
        if ing_id not in ingredients:
            raise HTTPException(status_code=400, detail=f"Ingredient {ing_id} not found")
        ing = ingredients[ing_id]
        if ing.stock_level < required_qty:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {ing.name}")
        
        # Deduct stock (will trigger Optimistic Locking version_id bump on commit)
        ing.stock_level -= required_qty

    # Calculate change
    change = 0.0
    if order.payment_method == "Cash" and order.amount_tendered is not None:
        if order.amount_tendered < total_amount:
            raise HTTPException(status_code=400, detail="Insufficient amount tendered")
        change = order.amount_tendered - total_amount

    # Create Transaction
    db_txn = Transaction(
        total_amount=total_amount,
        payment_method=order.payment_method,
        amount_tendered=order.amount_tendered,
        change=change,
        customer_contact=order.customer_contact,
        cashier_id=current_user.id
    )
    db.add(db_txn)

    for item in order.items:
        mi = menu_items[item.menu_item_id]
        db_txn_item = TransactionItem(
            transaction=db_txn,
            menu_item_id=mi.id,
            quantity=item.quantity,
            notes=item.notes,
            price_at_time=mi.price
        )
        db.add(db_txn_item)

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
        raise HTTPException(status_code=500, detail=str(e))
    
    await db.refresh(db_txn)
    return db_txn
