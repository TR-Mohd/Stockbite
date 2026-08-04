from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.exc import IntegrityError
from typing import List

from ..database import get_db
from ..auth import role_required
from ..services import get_next_id_sequence
from ..models import User, RoleEnum, Supplier, PurchaseOrder, PurchaseOrderItem, AuditLog, Ingredient
from ..schemas import SupplierResponse, SupplierCreate, SupplierUpdate, DraftPOCreateRequest, PurchaseOrderResponse
from sqlalchemy.orm import selectinload
from .purchase_orders import format_po

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
    supplier_data = supplier.model_dump(exclude_unset=True)
    if supplier_data.get('id'):
        new_supplier = Supplier(**supplier_data)
        db.add(new_supplier)
        try:
            await db.commit()
            await db.refresh(new_supplier)
            return new_supplier
        except IntegrityError:
            await db.rollback()
            raise HTTPException(status_code=400, detail="Supplier ID already exists")

    from datetime import datetime
    year = str(datetime.utcnow().year)[-2:]
    region = supplier_data.get('region') or 'NAT'
    key = f"SUP-{year}"
    prefix_pattern = f"SUP-%-{year}%"

    max_retries = 3
    for attempt in range(max_retries):
        seq_val = await get_next_id_sequence(
            db=db,
            key=key,
            model=Supplier,
            prefix_pattern=prefix_pattern,
            default_start_val=100,
            extract_seq_fn=lambda mid: int(mid[-3:])
        )
        supplier_data['id'] = f"SUP-{region}-{year}{seq_val:03d}"
        new_supplier = Supplier(**supplier_data)
        db.add(new_supplier)
        try:
            await db.commit()
            await db.refresh(new_supplier)
            return new_supplier
        except IntegrityError:
            await db.rollback()
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=409,
                    detail="Could not generate a unique supplier ID due to concurrent request contention. Please retry."
                )

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

@router.post("/{supplier_id}/po", response_model=PurchaseOrderResponse)
async def create_purchase_order(
    supplier_id: str,
    request: DraftPOCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager, RoleEnum.Warehouse]))
):
    if not request.items:
        raise HTTPException(status_code=400, detail="At least one item is required")

    result_sup = await db.execute(select(Supplier).where(Supplier.id == supplier_id))
    supplier = result_sup.scalars().first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    items_data = []
    for item_req in request.items:
        res_ing = await db.execute(select(Ingredient).where(Ingredient.id == item_req.ingredient_id))
        ing = res_ing.scalars().first()
        if not ing:
            raise HTTPException(status_code=404, detail=f"Ingredient {item_req.ingredient_id} not found")
        if ing.unit and ing.unit.lower() == 'pcs':
            if item_req.ordered_quantity % 1 != 0:
                raise HTTPException(status_code=400, detail="Fractional quantities are not allowed for 'pcs'")
        items_data.append((item_req, ing))

    from datetime import datetime
    now = datetime.utcnow()
    yy = str(now.year)[-2:]
    mm = f"{now.month:02d}"
    key = f"PO-{yy}{mm}"
    prefix_pattern = f"PO-{yy}{mm}-%"

    max_retries = 3
    for attempt in range(max_retries):
        seq_val = await get_next_id_sequence(
            db=db,
            key=key,
            model=PurchaseOrder,
            prefix_pattern=prefix_pattern,
            default_start_val=1,
            extract_seq_fn=lambda mid: int(mid.split('-')[-1])
        )
        po_id = f"PO-{yy}{mm}-{seq_val:03d}"

        po = PurchaseOrder(
            id=po_id,
            supplier_id=supplier_id,
            notes=request.notes,
            created_by_id=current_user.id
        )
        db.add(po)

        for idx, (item_req, ing) in enumerate(items_data):
            poi = PurchaseOrderItem(
                id=f"{po_id}-item-{idx+1}",
                purchase_order_id=po_id,
                ingredient_id=item_req.ingredient_id,
                current_stock=ing.stock_level,
                reorder_point=ing.reorder_point,
                suggested_quantity=item_req.ordered_quantity,
                unit_cost_at_time=item_req.unit_cost
            )
            db.add(poi)

        audit = AuditLog(
            user_id=current_user.id,
            action="Draft PO",
            resource=f"PO to {supplier_id}",
            outcome="Success"
        )
        db.add(audit)

        try:
            await db.commit()
            query = (
                select(PurchaseOrder, Supplier)
                .where(PurchaseOrder.id == po_id)
                .outerjoin(Supplier, PurchaseOrder.supplier_id == Supplier.id)
                .options(
                    selectinload(PurchaseOrder.items).selectinload(PurchaseOrderItem.ingredient)
                )
            )
            result = await db.execute(query)
            po, supplier = result.first()
            return format_po(po, supplier)
        except IntegrityError:
            await db.rollback()
            if attempt == max_retries - 1:
                raise HTTPException(
                    status_code=409,
                    detail="Could not generate a unique purchase order ID due to concurrent request contention. Please retry."
                )
