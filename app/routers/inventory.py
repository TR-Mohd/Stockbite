from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..database import get_db
from ..auth import role_required
from ..models import User, RoleEnum, Ingredient, AuditLog
from ..schemas import IngredientResponse, BulkReceiveRequest

router = APIRouter(prefix="/inventory", tags=["Inventory"])

@router.get("/", response_model=List[IngredientResponse])
async def get_inventory(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    result = await db.execute(select(Ingredient))
    return result.scalars().all()

@router.get("/alerts", response_model=List[IngredientResponse])
async def get_low_stock_alerts(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    result = await db.execute(select(Ingredient).where(Ingredient.stock_level <= Ingredient.reorder_point))
    return result.scalars().all()

@router.post("/{ingredient_id}/adjust", response_model=IngredientResponse)
async def adjust_stock(
    ingredient_id: str,
    amount: float,
    reason: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Warehouse, RoleEnum.Manager]))
):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ingredient = result.scalars().first()
    
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
    
    ingredient.stock_level = max(0.0, ingredient.stock_level + amount)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="Stock Adjustment",
        resource=f"Ingredient:{ingredient.name}",
        outcome="Success"
    )
    db.add(audit)
    
    await db.commit()
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
            ingredient.stock_level += item.quantity
            updates.append(ingredient)
            
            audit = AuditLog(
                user_id=current_user.id,
                action="Bulk Receive",
                resource=f"Ingredient:{ingredient.name}",
                outcome="Success"
            )
            db.add(audit)
            
    await db.commit()
    return {"message": f"Successfully updated {len(updates)} ingredients."}
