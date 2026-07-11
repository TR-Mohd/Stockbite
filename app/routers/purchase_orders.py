from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Optional

from ..database import get_db
from ..auth import role_required
from ..models import User, RoleEnum, PurchaseOrder, Supplier, Ingredient, POStatusEnum, AuditLog
from ..schemas import PurchaseOrderResponse, ReceivePORequest, CancelPORequest
from sqlalchemy.orm.exc import StaleDataError
from ..services import update_ingredient_stock
router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])

def format_po(po, supplier, ingredient):
    return {
        "id": po.id,
        "supplier_id": po.supplier_id,
        "ingredient_id": po.ingredient_id,
        "supplier_name": supplier.name if supplier else None,
        "ingredient_name": ingredient.name if ingredient else None,
        "unit": ingredient.unit if ingredient else None,
        "unit_cost": ingredient.unit_cost if ingredient else None,
        "current_stock": po.current_stock,
        "reorder_point": po.reorder_point,
        "suggested_quantity": po.suggested_quantity,
        "date": po.date,
        "status": po.status,
        "notes": po.notes,
        "created_by_id": po.created_by_id,
        "sent_by_id": po.sent_by_id,
        "cancelled_reason": po.cancelled_reason
    }

@router.get("/", response_model=List[PurchaseOrderResponse])
async def get_purchase_orders(
    supplier_id: Optional[str] = None,
    status: Optional[POStatusEnum] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    query = select(PurchaseOrder, Supplier, Ingredient).outerjoin(
        Supplier, PurchaseOrder.supplier_id == Supplier.id
    ).outerjoin(
        Ingredient, PurchaseOrder.ingredient_id == Ingredient.id
    )
    
    if supplier_id:
        query = query.where(PurchaseOrder.supplier_id == supplier_id)
    if status:
        query = query.where(PurchaseOrder.status == status)
        
    query = query.order_by(PurchaseOrder.date.desc())
    result = await db.execute(query)
    
    formatted_orders = []
    for po, supplier, ingredient in result.all():
        formatted_orders.append(format_po(po, supplier, ingredient))
        
    return formatted_orders

@router.get("/{id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    query = select(PurchaseOrder, Supplier, Ingredient).outerjoin(
        Supplier, PurchaseOrder.supplier_id == Supplier.id
    ).outerjoin(
        Ingredient, PurchaseOrder.ingredient_id == Ingredient.id
    ).where(PurchaseOrder.id == id)
    
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    po, supplier, ingredient = row
    return format_po(po, supplier, ingredient)

@router.post("/{id}/send", response_model=PurchaseOrderResponse)
async def send_purchase_order(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    query = select(PurchaseOrder, Supplier, Ingredient).outerjoin(
        Supplier, PurchaseOrder.supplier_id == Supplier.id
    ).outerjoin(
        Ingredient, PurchaseOrder.ingredient_id == Ingredient.id
    ).where(PurchaseOrder.id == id)
    
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    po, supplier, ingredient = row
    
    if po.status != POStatusEnum.Draft:
        raise HTTPException(status_code=400, detail="Only Draft POs can be sent")
        
    po.status = POStatusEnum.Sent
    po.sent_by_id = current_user.id
    
    audit = AuditLog(
        user_id=current_user.id,
        action="Send PO",
        resource=f"PO:{po.id}",
        outcome="Success",
        details={"status_from": "Draft", "status_to": "Sent"}
    )
    db.add(audit)
    
    await db.commit()
    return format_po(po, supplier, ingredient)

@router.post("/{id}/receive", response_model=PurchaseOrderResponse)
async def receive_purchase_order(
    id: str,
    request: ReceivePORequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    query = select(PurchaseOrder, Supplier, Ingredient).outerjoin(
        Supplier, PurchaseOrder.supplier_id == Supplier.id
    ).outerjoin(
        Ingredient, PurchaseOrder.ingredient_id == Ingredient.id
    ).where(PurchaseOrder.id == id)
    
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    po, supplier, ingredient = row
    
    if po.status != POStatusEnum.Sent:
        raise HTTPException(status_code=400, detail="Only Sent POs can be received")
        
    if not ingredient:
        raise HTTPException(status_code=400, detail="Ingredient not found for this PO")
        
    po.actual_received_quantity = request.actual_quantity
    if request.actual_quantity < po.suggested_quantity:
        po.status = POStatusEnum.Partially_Received
    elif request.actual_quantity > po.suggested_quantity:
        po.status = POStatusEnum.Over_Received
    else:
        po.status = POStatusEnum.Received
    
    update_ingredient_stock(
        db=db,
        ingredient=ingredient,
        amount=request.actual_quantity,
        user_id=current_user.id,
        action="Receive PO",
        reason=f"PO Received (ID: {po.id})"
    )
    
    try:
        await db.commit()
    except StaleDataError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Concurrent inventory update detected. Please retry.")
        
    return format_po(po, supplier, ingredient)

@router.post("/{id}/undo-receive", response_model=PurchaseOrderResponse)
async def undo_receive_purchase_order(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    query = select(PurchaseOrder, Supplier, Ingredient).outerjoin(
        Supplier, PurchaseOrder.supplier_id == Supplier.id
    ).outerjoin(
        Ingredient, PurchaseOrder.ingredient_id == Ingredient.id
    ).where(PurchaseOrder.id == id)
    
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    po, supplier, ingredient = row
    
    if po.status not in [POStatusEnum.Received, POStatusEnum.Partially_Received, POStatusEnum.Over_Received]:
        raise HTTPException(status_code=400, detail="Only received POs can be undone")
        
    # Check 24 hour limit
    from datetime import datetime, timedelta
    if po.date < datetime.utcnow() - timedelta(hours=24):
        raise HTTPException(status_code=400, detail="Cannot undo receipt after 24 hours. Please create a Stock Adjustment instead.")
        
    if not ingredient:
        raise HTTPException(status_code=400, detail="Ingredient not found for this PO")
        
    if po.actual_received_quantity is None:
        raise HTTPException(status_code=400, detail="Cannot determine actual received quantity to undo")
        
    if ingredient.stock_level < po.actual_received_quantity:
        raise HTTPException(status_code=400, detail="Cannot undo — some of this stock has already been used.")
        
    po.status = POStatusEnum.Sent
    
    update_ingredient_stock(
        db=db,
        ingredient=ingredient,
        amount=-po.actual_received_quantity,
        user_id=current_user.id,
        action="Undo Receive PO",
        reason=f"PO Receipt Undone (ID: {po.id})"
    )
    
    po.actual_received_quantity = None
    
    try:
        await db.commit()
    except StaleDataError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Concurrent inventory update detected. Please retry.")
        
    return format_po(po, supplier, ingredient)

@router.post("/{id}/cancel", response_model=PurchaseOrderResponse)
async def cancel_purchase_order(
    id: str,
    request: CancelPORequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    query = select(PurchaseOrder, Supplier, Ingredient).outerjoin(
        Supplier, PurchaseOrder.supplier_id == Supplier.id
    ).outerjoin(
        Ingredient, PurchaseOrder.ingredient_id == Ingredient.id
    ).where(PurchaseOrder.id == id)
    
    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase Order not found")
        
    po, supplier, ingredient = row
    
    if po.status not in [POStatusEnum.Draft, POStatusEnum.Sent]:
        raise HTTPException(status_code=400, detail="Only Draft or Sent POs can be cancelled")
        
    po.status = POStatusEnum.Cancelled
    po.cancelled_reason = request.reason
    
    audit = AuditLog(
        user_id=current_user.id,
        action="Cancel PO",
        resource=f"PO:{po.id}",
        outcome="Success",
        details={"reason": request.reason}
    )
    db.add(audit)
    
    await db.commit()
    return format_po(po, supplier, ingredient)
