from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..database import get_db
from ..auth import role_required
from ..models import User, RoleEnum, Supplier, PurchaseOrder, AuditLog, Ingredient
from ..schemas import SupplierResponse, SupplierCreate, SupplierUpdate

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("/", response_model=List[SupplierResponse])
async def get_suppliers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    result = await db.execute(select(Supplier).order_by(Supplier.name))
    return result.scalars().all()

@router.post("/", response_model=SupplierResponse)
async def create_supplier(
    supplier: SupplierCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    new_supplier = Supplier(**supplier.model_dump(exclude_unset=True))
    db.add(new_supplier)
    await db.commit()
    await db.refresh(new_supplier)
    return new_supplier

@router.put("/{supplier_id}", response_model=SupplierResponse)
async def update_supplier(
    supplier_id: str,
    supplier_update: SupplierUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    result = await db.execute(select(Supplier).filter(Supplier.id == supplier_id))
    supplier = result.scalars().first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    update_data = supplier_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(supplier, key, value)
        
    await db.commit()
    await db.refresh(supplier)
    return supplier

@router.put("/{supplier_id}/toggle-status", response_model=SupplierResponse)
async def toggle_supplier_status(
    supplier_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    result = await db.execute(select(Supplier).filter(Supplier.id == supplier_id))
    supplier = result.scalars().first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    
    supplier.is_active = not supplier.is_active
    await db.commit()
    await db.refresh(supplier)
    return supplier

@router.post("/{supplier_id}/po")
async def create_purchase_order(
    supplier_id: str,
    ingredient_id: str,
    suggested_qty: float,
    notes: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    result = await db.execute(select(Ingredient).where(Ingredient.id == ingredient_id))
    ingredient = result.scalars().first()
    if not ingredient:
        raise HTTPException(status_code=404, detail="Ingredient not found")
        
    po = PurchaseOrder(
        supplier_id=supplier_id,
        ingredient_id=ingredient_id,
        current_stock=ingredient.stock_level,
        reorder_point=ingredient.reorder_point,
        suggested_quantity=suggested_qty,
        notes=notes,
        created_by_id=current_user.id
    )
    db.add(po)
    
    audit = AuditLog(
        user_id=current_user.id,
        action="Draft PO",
        resource=f"PO to {supplier_id}",
        outcome="Success"
    )
    db.add(audit)
    
    await db.commit()
    await db.refresh(po)
    return po
