from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.exc import StaleDataError
from typing import List, Optional
from datetime import datetime, timedelta
from decimal import Decimal

from ..database import get_db
from ..auth import role_required
from ..models import (
    User,
    RoleEnum,
    PurchaseOrder,
    PurchaseOrderItem,
    Supplier,
    Ingredient,
    POStatusEnum,
    AuditLog,
)
from ..schemas import PurchaseOrderResponse, ReceivePORequest, CancelPORequest
from ..services import update_ingredient_stock, update_ingredient_cost_and_stock

router = APIRouter(prefix="/purchase-orders", tags=["Purchase Orders"])


def format_po(po, supplier):
    formatted_items = []
    if hasattr(po, "items") and po.items:
        for item in po.items:
            ing = getattr(item, "ingredient", None)
            formatted_items.append(
                {
                    "id": item.id,
                    "purchase_order_id": item.purchase_order_id,
                    "ingredient_id": item.ingredient_id,
                    "ingredient_name": ing.name if ing else None,
                    "unit": ing.unit if ing else None,
                    "current_stock": item.current_stock,
                    "reorder_point": item.reorder_point,
                    "suggested_quantity": item.suggested_quantity,
                    "actual_received_quantity": item.actual_received_quantity,
                    "received_at": item.received_at,
                    "unit_cost_at_time": item.unit_cost_at_time,
                    "ingredient_unit_cost_before_receipt": item.ingredient_unit_cost_before_receipt,
                }
            )

    return {
        "id": po.id,
        "supplier_id": po.supplier_id,
        "supplier_name": supplier.name if supplier else None,
        "date": po.date,
        "status": po.status,
        "notes": po.notes,
        "created_by_id": po.created_by_id,
        "sent_by_id": po.sent_by_id,
        "cancelled_reason": po.cancelled_reason,
        "items": formatted_items,
    }


@router.get("/", response_model=List[PurchaseOrderResponse])
async def get_purchase_orders(
    supplier_id: Optional[str] = None,
    status: Optional[POStatusEnum] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse])),
):
    query = (
        select(PurchaseOrder, Supplier)
        .outerjoin(Supplier, PurchaseOrder.supplier_id == Supplier.id)
        .options(
            selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.ingredient)
        )
    )

    if supplier_id:
        query = query.where(PurchaseOrder.supplier_id == supplier_id)
    if status:
        query = query.where(PurchaseOrder.status == status)

    query = query.order_by(PurchaseOrder.date.desc())
    result = await db.execute(query)

    formatted_orders = []
    for po, supplier in result.all():
        formatted_orders.append(format_po(po, supplier))

    return formatted_orders


@router.get("/{id}", response_model=PurchaseOrderResponse)
async def get_purchase_order(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse])),
):
    query = (
        select(PurchaseOrder, Supplier)
        .where(PurchaseOrder.id == id)
        .outerjoin(Supplier, PurchaseOrder.supplier_id == Supplier.id)
        .options(
            selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.ingredient)
        )
    )

    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    po, supplier = row
    return format_po(po, supplier)


@router.post("/{id}/send", response_model=PurchaseOrderResponse)
async def send_purchase_order(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager])),
):
    query = (
        select(PurchaseOrder, Supplier)
        .where(PurchaseOrder.id == id)
        .outerjoin(Supplier, PurchaseOrder.supplier_id == Supplier.id)
        .options(
            selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.ingredient)
        )
    )

    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    po, supplier = row

    if po.status != POStatusEnum.Draft:
        raise HTTPException(status_code=400, detail="Only Draft POs can be sent")

    po.status = POStatusEnum.Sent
    po.sent_by_id = current_user.id

    audit = AuditLog(
        user_id=current_user.id,
        action="Send PO",
        resource=f"PO:{po.id}",
        outcome="Success",
        details={"status_from": "Draft", "status_to": "Sent"},
    )
    db.add(audit)

    await db.commit()
    return format_po(po, supplier)


@router.post("/{id}/receive", response_model=PurchaseOrderResponse)
async def receive_purchase_order(
    id: str,
    request: ReceivePORequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse])),
):
    query = (
        select(PurchaseOrder, Supplier)
        .where(PurchaseOrder.id == id)
        .outerjoin(Supplier, PurchaseOrder.supplier_id == Supplier.id)
        .options(
            selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.ingredient)
        )
    )

    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    po, supplier = row

    if po.status != POStatusEnum.Sent:
        raise HTTPException(status_code=400, detail="Only Sent POs can be received")
    if not po.items:
        raise HTTPException(status_code=400, detail="No line items found for this PO")

    req_item_map = {r.item_id: r for r in request.items}
    if set(req_item_map.keys()) != {item.id for item in po.items}:
        raise HTTPException(
            status_code=400,
            detail="Receive request must include all line items in the PO",
        )

    ingredient_ids = sorted(list({item.ingredient_id for item in po.items}))
    res_ings = await db.execute(
        select(Ingredient)
        .where(Ingredient.id.in_(ingredient_ids))
        .order_by(Ingredient.id.asc())
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    ing_map = {ing.id: ing for ing in res_ings.scalars().all()}
    if len(ing_map) != len(ingredient_ids):
        raise HTTPException(status_code=400, detail="One or more ingredients not found")

    now = datetime.utcnow()
    has_partial = False
    has_over = False

    for item in po.items:
        req = req_item_map[item.id]
        ing = ing_map[item.ingredient_id]

        item.ingredient_unit_cost_before_receipt = ing.unit_cost
        item.received_at = now
        item.actual_received_quantity = req.actual_quantity
        item.unit_cost_at_time = req.actual_unit_cost

        update_ingredient_cost_and_stock(
            db=db,
            ingredient=ing,
            received_qty=req.actual_quantity,
            received_unit_cost=req.actual_unit_cost,
            user_id=current_user.id,
            action="Receive PO",
            reason=f"PO Received (ID: {po.id}, Item: {item.id})",
        )

        suggested = Decimal(str(item.suggested_quantity))
        actual = req.actual_quantity
        if actual < suggested:
            has_partial = True
        elif actual > suggested:
            has_over = True

    if has_partial:
        po.status = POStatusEnum.Partially_Received
    elif has_over:
        po.status = POStatusEnum.Over_Received
    else:
        po.status = POStatusEnum.Received

    try:
        await db.commit()
    except StaleDataError:
        await db.rollback()
        raise HTTPException(
            status_code=409, detail="Concurrent inventory update detected. Please retry."
        )

    return format_po(po, supplier)


@router.post("/{id}/undo-receive", response_model=PurchaseOrderResponse)
async def undo_receive_purchase_order(
    id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse])),
):
    query = (
        select(PurchaseOrder, Supplier)
        .where(PurchaseOrder.id == id)
        .outerjoin(Supplier, PurchaseOrder.supplier_id == Supplier.id)
        .options(
            selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.ingredient)
        )
    )

    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    po, supplier = row

    if po.status not in [
        POStatusEnum.Received,
        POStatusEnum.Partially_Received,
        POStatusEnum.Over_Received,
    ]:
        raise HTTPException(status_code=400, detail="Only received POs can be undone")

    # Check 24 hour limit
    if po.date < datetime.utcnow() - timedelta(hours=24):
        raise HTTPException(
            status_code=400,
            detail="Cannot undo receipt after 24 hours. Please create a Stock Adjustment instead.",
        )

    if not po.items:
        raise HTTPException(status_code=400, detail="No line items found for this PO")

    for item in po.items:
        check_query = select(PurchaseOrderItem).where(
            PurchaseOrderItem.ingredient_id == item.ingredient_id,
            PurchaseOrderItem.received_at > item.received_at,
            PurchaseOrderItem.id != item.id,
        )
        res_later = await db.execute(check_query)
        later_item = res_later.scalars().first()
        if later_item:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot undo receipt: a later receipt exists for ingredient {item.ingredient_id}. Undo must be performed in reverse chronological order.",
            )

    ingredient_ids = sorted(list({item.ingredient_id for item in po.items}))
    res_ings = await db.execute(
        select(Ingredient)
        .where(Ingredient.id.in_(ingredient_ids))
        .order_by(Ingredient.id.asc())
        .with_for_update()
        .execution_options(populate_existing=True)
    )
    ing_map = {ing.id: ing for ing in res_ings.scalars().all()}
    if len(ing_map) != len(ingredient_ids):
        raise HTTPException(status_code=400, detail="One or more ingredients not found")

    for item in po.items:
        ing = ing_map[item.ingredient_id]
        if item.actual_received_quantity is None:
            raise HTTPException(
                status_code=400,
                detail="Cannot determine actual received quantity to undo",
            )
        if ing.stock_level < item.actual_received_quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot undo — some of the stock for ingredient {ing.name} has already been used.",
            )

    for item in po.items:
        ing = ing_map[item.ingredient_id]
        if item.ingredient_unit_cost_before_receipt is not None:
            ing.unit_cost = item.ingredient_unit_cost_before_receipt

        update_ingredient_stock(
            db=db,
            ingredient=ing,
            amount=-Decimal(str(item.actual_received_quantity)),
            user_id=current_user.id,
            action="Undo Receive PO",
            reason=f"PO Receipt Undone (ID: {po.id}, Item: {item.id})",
        )

        item.received_at = None
        item.ingredient_unit_cost_before_receipt = None
        item.actual_received_quantity = None

    po.status = POStatusEnum.Sent

    try:
        await db.commit()
    except StaleDataError:
        await db.rollback()
        raise HTTPException(
            status_code=409, detail="Concurrent inventory update detected. Please retry."
        )

    return format_po(po, supplier)


@router.post("/{id}/cancel", response_model=PurchaseOrderResponse)
async def cancel_purchase_order(
    id: str,
    request: CancelPORequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager])),
):
    query = (
        select(PurchaseOrder, Supplier)
        .where(PurchaseOrder.id == id)
        .outerjoin(Supplier, PurchaseOrder.supplier_id == Supplier.id)
        .options(
            selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.ingredient)
        )
    )

    result = await db.execute(query)
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Purchase Order not found")

    po, supplier = row

    if po.status not in [POStatusEnum.Draft, POStatusEnum.Sent]:
        raise HTTPException(
            status_code=400, detail="Only Draft or Sent POs can be cancelled"
        )

    po.status = POStatusEnum.Cancelled
    po.cancelled_reason = request.reason
    po.notes = request.reason

    audit = AuditLog(
        user_id=current_user.id,
        action="Cancel PO",
        resource=f"PO:{po.id}",
        outcome="Success",
        details={"reason": request.reason},
    )
    db.add(audit)

    await db.commit()
    return format_po(po, supplier)
