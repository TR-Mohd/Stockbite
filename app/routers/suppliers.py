from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from ..database import get_db
from ..auth import role_required
from ..models import User, RoleEnum, Supplier, PurchaseOrder, AuditLog
from ..schemas import SupplierResponse

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("/", response_model=List[SupplierResponse])
async def get_suppliers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    result = await db.execute(select(Supplier))
    return result.scalars().all()

@router.post("/{supplier_id}/po")
async def create_purchase_order(
    supplier_id: str,
    ingredient_id: str,
    suggested_qty: float,
    notes: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    # In a real scenario, we would validate ingredient and current stock
    po = PurchaseOrder(
        supplier_id=supplier_id,
        ingredient_id=ingredient_id,
        current_stock=0.0, # Placeholder
        reorder_point=0.0, # Placeholder
        suggested_quantity=suggested_qty,
        notes=notes
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
