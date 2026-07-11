from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..database import get_db
from ..auth import role_required
from ..models import User, RoleEnum, Ingredient, AuditLog
from ..schemas import IngredientResponse, BulkReceiveRequest, IngredientCreate, IngredientUpdate, AdjustStockRequest, LogWasteRequest
from sqlalchemy.orm.exc import StaleDataError
from ..services import update_ingredient_stock
router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/", response_model=List[IngredientResponse])
async def get_inventory(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    result = await db.execute(select(Ingredient))
    ingredients = result.scalars().all()
    
    from ..models import PurchaseOrder, POStatusEnum
    po_result = await db.execute(
        select(PurchaseOrder.ingredient_id, PurchaseOrder.status)
        .where(PurchaseOrder.status.in_([POStatusEnum.Draft, POStatusEnum.Sent]))
    )
    po_statuses = {row.ingredient_id: row.status.value for row in po_result}
    
    for ingredient in ingredients:
        ingredient.active_po_status = po_statuses.get(ingredient.id)
        
    return ingredients

@router.post("/", response_model=IngredientResponse, status_code=201)
async def create_ingredient(
    ingredient_in: IngredientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    new_ingredient = Ingredient(**ingredient_in.model_dump())
    db.add(new_ingredient)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="Create Ingredient",
        resource=f"Ingredient:{new_ingredient.name}",
        outcome="Success"
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(new_ingredient)
    return new_ingredient

@router.put("/{ingredient_id}", response_model=IngredientResponse)
async def update_ingredient(
    ingredient_id: str,
    ingredient_in: IngredientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ingredient = result.scalars().first()
    
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    update_data = ingredient_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(ingredient, key, value)
        
    audit = AuditLog(
        user_id=current_user.id,
        action="Update Ingredient",
        resource=f"Ingredient:{ingredient.name}",
        outcome="Success"
    )
    db.add(audit)
    
    try:
        await db.commit()
    except StaleDataError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Concurrent inventory update detected. Please retry.")
        
    await db.refresh(ingredient)
    return ingredient

@router.get("/alerts", response_model=List[IngredientResponse])
async def get_low_stock_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    result = await db.execute(select(Ingredient).where(Ingredient.stock_level <= Ingredient.reorder_point))
    ingredients = result.scalars().all()
    
    from ..models import PurchaseOrder, POStatusEnum
    po_result = await db.execute(
        select(PurchaseOrder.ingredient_id, PurchaseOrder.status)
        .where(PurchaseOrder.status.in_([POStatusEnum.Draft, POStatusEnum.Sent]))
    )
    po_statuses = {row.ingredient_id: row.status.value for row in po_result}
    
    for ingredient in ingredients:
        ingredient.active_po_status = po_statuses.get(ingredient.id)
        
    return ingredients

@router.post("/{ingredient_id}/adjust", response_model=IngredientResponse)
async def adjust_stock(
    ingredient_id: str,
    request: AdjustStockRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Warehouse, RoleEnum.Manager]))
):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ingredient = result.scalars().first()
    
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    # Delta is computed backend-side against the actual database value, avoiding stale frontend state
    amount = request.new_stock_level - ingredient.stock_level
    
    update_ingredient_stock(db, ingredient, amount, current_user.id, "Stock Adjustment", request.reason)
    
    try:
        await db.commit()
    except StaleDataError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Concurrent inventory update detected. Please retry.")
        
    await db.refresh(ingredient)
    return ingredient

@router.post("/{ingredient_id}/log-waste", response_model=IngredientResponse)
async def log_waste(
    ingredient_id: str,
    request: LogWasteRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Warehouse, RoleEnum.Manager]))
):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ingredient = result.scalars().first()
    
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
        
    if ingredient.stock_level < request.amount:
        raise HTTPException(status_code=400, detail="Waste amount cannot exceed current stock")
    
    # Waste uses the user's explicit absolute delta
    update_ingredient_stock(db, ingredient, -request.amount, current_user.id, "Log Waste", request.reason)
    
    try:
        await db.commit()
    except StaleDataError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Concurrent inventory update detected. Please retry.")
        
    await db.refresh(ingredient)
    return ingredient


@router.post("/bulk-receive")
async def bulk_receive(
    request: BulkReceiveRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Warehouse, RoleEnum.Manager]))
):
    updates = []
    for item in request.items:
        result = await db.execute(select(Ingredient).where(Ingredient.id == item.ingredient_id))
        ingredient = result.scalars().first()
        
        if ingredient:
            update_ingredient_stock(db, ingredient, item.quantity, current_user.id, "Bulk Receive")
            updates.append(ingredient)
            
    try:
        await db.commit()
    except StaleDataError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Concurrent inventory update detected. Please retry.")
        
    return {"message": f"Successfully updated {len(updates)} ingredients."}
