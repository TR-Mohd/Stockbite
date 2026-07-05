from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..auth import role_required, get_password_hash
from ..models import User, RoleEnum, Transaction, TransactionItem, StatusEnum, AuditLog, MenuItem, TransactionItemModifier

from sqlalchemy.orm import aliased
from datetime import datetime, timedelta
from typing import List, Optional
from datetime import date
from sqlalchemy.orm import joinedload
from zoneinfo import ZoneInfo
from sqlalchemy import and_

def get_timeframe_boundaries(timeframe: str):
    tz = ZoneInfo("Asia/Jakarta")
    now = datetime.now(tz)
    
    if timeframe == "today":
        start_local = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end_local = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif timeframe == "yesterday":
        yesterday = now - timedelta(days=1)
        start_local = yesterday.replace(hour=0, minute=0, second=0, microsecond=0)
        end_local = yesterday.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif timeframe == "this_month":
        start_local = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        end_local = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    elif timeframe == "last_30_days":
        start_local = (now - timedelta(days=29)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_local = now.replace(hour=23, minute=59, second=59, microsecond=999999)
    else: # default to last_7_days
        start_local = (now - timedelta(days=6)).replace(hour=0, minute=0, second=0, microsecond=0)
        end_local = now.replace(hour=23, minute=59, second=59, microsecond=999999)
        
    start_utc = start_local.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
    end_utc = end_local.astimezone(ZoneInfo("UTC")).replace(tzinfo=None)
    return start_utc, end_utc, start_local, end_local
from ..schemas import (
    StaffResponse, UserCreate, UserUpdate, 
    RevenueTrendItem, BestSellerItem, HeatmapDataPoint, BasketAnalysisItem,
    PaginatedOrderHistory, OrderHistoryItem
)
from ..models import OrderTypeEnum

router = APIRouter(prefix="/manager", tags=["Manager BI"])

@router.get("/staff", response_model=List[StaffResponse])
async def get_staff(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    staff_list = []
    for u in users:
        # Find latest transaction as proxy for last active (for cashiers)
        last_transaction = None
        if u.role == RoleEnum.Cashier:
            res_tx = await db.execute(
                select(func.max(Transaction.timestamp)).where(Transaction.cashier_id == u.id)
            )
            last_transaction = res_tx.scalar()

        # Find latest audit log (e.g. login)
        res_audit = await db.execute(
            select(func.max(AuditLog.timestamp)).where(AuditLog.user_id == u.id)
        )
        last_audit = res_audit.scalar()

        # True last active is the most recent of the two
        timestamps = [t for t in (last_transaction, last_audit) if t is not None]
        last_active = max(timestamps) if timestamps else None
        
        has_transactions = last_transaction is not None
        
        staff_list.append({
            "id": u.id,
            "name": u.name,
            "username": u.username,
            "role": u.role.value,
            "phone_number": u.phone_number,
            "email": u.email,
            "last_active": last_active,
            "status": "Active" if u.is_active else "Inactive",
            "has_transactions": has_transactions
        })
    return staff_list

@router.post("/staff", response_model=StaffResponse)
async def create_staff(
    staff: UserCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    # Check if username exists
    res = await db.execute(select(User).where(User.username == staff.username))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="Username already exists")

    user_data = {
        "name": staff.name,
        "username": staff.username,
        "role": staff.role,
        "hashed_password": get_password_hash(staff.password),
        "phone_number": staff.phone_number,
        "email": staff.email,
        "is_active": True
    }
    if staff.id is not None:
        user_data["id"] = staff.id
        
    new_user = User(**user_data)
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    return {
        "id": new_user.id,
        "name": new_user.name,
        "username": new_user.username,
        "role": new_user.role.value,
        "phone_number": new_user.phone_number,
        "email": new_user.email,
        "last_active": None,
        "status": "Active",
        "has_transactions": False
    }

@router.put("/staff/{user_id}", response_model=StaffResponse)
async def update_staff(
    user_id: str,
    staff: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # If changing username, check if taken by another user
    if user.username != staff.username:
        exist_res = await db.execute(select(User).where(User.username == staff.username))
        if exist_res.scalars().first():
            raise HTTPException(status_code=400, detail="Username already exists")

    user.name = staff.name
    user.username = staff.username
    user.role = staff.role
    user.phone_number = staff.phone_number
    user.email = staff.email
    if staff.password:
        user.hashed_password = get_password_hash(staff.password)
    await db.commit()

    return {
        "id": user.id,
        "name": user.name,
        "username": user.username,
        "role": user.role.value,
        "phone_number": user.phone_number,
        "email": user.email,
        "last_active": None, # For simplicity, omitting full computation here. The frontend will likely refetch the list.
        "status": "Active" if user.is_active else "Inactive",
        "has_transactions": False
    }

@router.put("/staff/{user_id}/toggle-status")
async def toggle_staff_status(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot deactivate yourself")

    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.is_active = not user.is_active
    await db.commit()
    return {"message": "Status updated", "status": "Active" if user.is_active else "Inactive"}

@router.delete("/staff/{user_id}")
async def delete_staff(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    if user_id == current_user.id:
        raise HTTPException(status_code=403, detail="Cannot delete yourself")

    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.role == RoleEnum.Manager and current_user.name != "mohammed":
        raise HTTPException(status_code=403, detail="Only Mohammed can delete managers")

    try:
        await db.delete(user)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete staff with transaction history. Please deactivate instead.")
        
    return {"message": "Employee deleted"}

@router.get("/dashboard/kpis")
async def get_kpis(
    timeframe: str = "last_7_days",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    start_utc, end_utc, _, _ = get_timeframe_boundaries(timeframe)

    # Calculate Gross Revenue from Completed Transactions
    result = await db.execute(
        select(func.sum(Transaction.total_amount))
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
    )
    gross_revenue = result.scalar() or 0.0

    tax_result = await db.execute(
        select(func.sum(Transaction.tax))
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
    )
    tax_collected = tax_result.scalar() or 0.0

    # Calculate base COGS from TransactionItems
    cogs_items_res = await db.execute(
        select(func.sum(TransactionItem.quantity * TransactionItem.cogs_per_unit))
        .select_from(TransactionItem)
        .join(Transaction)
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
    )
    cogs_items = cogs_items_res.scalar() or 0.0

    # Calculate modifier COGS from TransactionItemModifiers
    cogs_mods_res = await db.execute(
        select(func.sum(TransactionItem.quantity * TransactionItemModifier.cogs_per_unit))
        .select_from(TransactionItemModifier)
        .join(TransactionItem)
        .join(Transaction)
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
    )
    cogs_mods = cogs_mods_res.scalar() or 0.0

    cogs = cogs_items + cogs_mods
    net_revenue = gross_revenue - cogs
    profit_margin = (net_revenue / gross_revenue * 100) if gross_revenue > 0 else 0.0

    # Calculate Total Orders and Subtotal for ATS
    orders_result = await db.execute(
        select(
            func.count(Transaction.id),
            func.sum(Transaction.subtotal)
        )
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
    )
    orders_row = orders_result.first()
    total_orders = orders_row[0] or 0
    total_subtotal = orders_row[1] or 0.0
    average_ticket_size = (total_subtotal / total_orders) if total_orders > 0 else 0.0

    return {
        "gross_revenue": round(gross_revenue, 2),
        "tax_collected": round(tax_collected, 2),
        "cogs": round(cogs, 2),
        "net_revenue": round(net_revenue, 2),
        "profit_margin_percent": round(profit_margin, 2),
        "average_ticket_size": round(average_ticket_size, 2),
        "total_orders": total_orders
    }

@router.get("/analytics/revenue-trend", response_model=List[RevenueTrendItem])
async def get_revenue_trend(
    timeframe: str = "last_7_days",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    start_utc, end_utc, start_local, end_local = get_timeframe_boundaries(timeframe)
    hourly = timeframe in ["today", "yesterday"]
    interval_td = timedelta(hours=1) if hourly else timedelta(days=1)
    
    series = select(
        func.generate_series(
            start_local.replace(tzinfo=None),
            end_local.replace(tzinfo=None),
            interval_td
        ).label("ts")
    ).subquery("series_ts")
    
    local_tx_ts = Transaction.timestamp.op('AT TIME ZONE')('UTC').op('AT TIME ZONE')('Asia/Jakarta')
    trunc_tx_ts = func.date_trunc('hour' if hourly else 'day', local_tx_ts)
    
    stmt = (
        select(
            series.c.ts.label("date"),
            func.coalesce(func.sum(Transaction.total_amount), 0).label("revenue")
        )
        .select_from(series)
        .outerjoin(
            Transaction,
            and_(
                Transaction.status == StatusEnum.Completed,
                trunc_tx_ts == series.c.ts,
                Transaction.timestamp >= start_utc,
                Transaction.timestamp <= end_utc
            )
        )
        .group_by(series.c.ts)
        .order_by(series.c.ts)
    )
    result = await db.execute(stmt)
    
    trend = []
    for row in result.all():
        trend.append({
            "date": row.date.strftime("%Y-%m-%d %H:%M:%S") if row.date else "",
            "revenue": float(row.revenue or 0)
        })
    return trend

@router.get("/analytics/best-sellers", response_model=List[BestSellerItem])
async def get_best_sellers(
    timeframe: str = "last_7_days",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    start_utc, end_utc, _, _ = get_timeframe_boundaries(timeframe)
    
    stmt = (
        select(
            MenuItem.name,
            func.sum(TransactionItem.quantity).label("total_sold")
        )
        .join(TransactionItem, TransactionItem.menu_item_id == MenuItem.id)
        .join(Transaction, TransactionItem.transaction_id == Transaction.id)
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
        .group_by(MenuItem.id)
        .order_by(func.sum(TransactionItem.quantity).desc())
        .limit(5)
    )
    result = await db.execute(stmt)
    
    return [
        {"menu_item_name": row.name, "total_sold": int(row.total_sold or 0)} 
        for row in result.all()
    ]

@router.get("/analytics/heatmap-data", response_model=List[HeatmapDataPoint])
async def get_heatmap_data(
    timeframe: str = "last_7_days",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    start_utc, end_utc, _, _ = get_timeframe_boundaries(timeframe)
    
    # Convert UTC to local store timezone (e.g. Asia/Jakarta)
    local_timestamp = Transaction.timestamp.op('AT TIME ZONE')('UTC').op('AT TIME ZONE')('Asia/Jakarta')
    
    stmt = (
        select(
            func.extract('dow', local_timestamp).label('dow'),
            func.extract('hour', local_timestamp).label('hour'),
            func.count(Transaction.id).label('count')
        )
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
        .group_by(
            func.extract('dow', local_timestamp),
            func.extract('hour', local_timestamp)
        )
    )
    result = await db.execute(stmt)
    
    return [
        {
            "day_of_week": int(row.dow),
            "hour_of_day": int(row.hour),
            "transaction_count": int(row.count)
        }
        for row in result.all()
    ]

@router.get("/analytics/basket-analysis", response_model=List[BasketAnalysisItem])
async def get_basket_analysis(
    timeframe: str = "last_7_days",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    start_utc, end_utc, _, _ = get_timeframe_boundaries(timeframe)
    
    ti1 = aliased(TransactionItem)
    ti2 = aliased(TransactionItem)
    mi1 = aliased(MenuItem)
    mi2 = aliased(MenuItem)
    
    stmt = (
        select(
            mi1.id.label("item1_id"),
            mi1.name.label("item1_name"),
            mi2.name.label("item2_name"),
            func.count().label("frequency")
        )
        .select_from(Transaction)
        .join(ti1, ti1.transaction_id == Transaction.id)
        .join(ti2, ti2.transaction_id == Transaction.id)
        .join(mi1, ti1.menu_item_id == mi1.id)
        .join(mi2, ti2.menu_item_id == mi2.id)
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
        .where(ti1.menu_item_id < ti2.menu_item_id)
        .group_by(mi1.id, mi2.id)
        .order_by(func.count().desc())
        .limit(3)
    )
    result = await db.execute(stmt)
    
    response = []
    for row in result.all():
        confidence = None
        if row.frequency >= 5:
            # Query total volume for item1 in this timeframe
            item1_vol_stmt = (
                select(func.count(TransactionItem.transaction_id))
                .join(Transaction, TransactionItem.transaction_id == Transaction.id)
                .where(Transaction.status == StatusEnum.Completed)
                .where(Transaction.timestamp >= start_utc)
                .where(Transaction.timestamp <= end_utc)
                .where(TransactionItem.menu_item_id == row.item1_id)
            )
            item1_vol_res = await db.execute(item1_vol_stmt)
            item1_vol = item1_vol_res.scalar() or 0
            if item1_vol > 0:
                confidence = round((row.frequency / item1_vol) * 100, 2)
                
        response.append({
            "item1_name": row.item1_name,
            "item2_name": row.item2_name,
            "frequency": int(row.frequency),
            "confidence": confidence
        })
    return response


@router.get("/orders", response_model=PaginatedOrderHistory)
async def get_order_history(
    page: int = 1,
    size: int = 20,
    order_type: Optional[OrderTypeEnum] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    query = select(Transaction).options(joinedload(Transaction.cashier))
    
    if order_type:
        query = query.where(Transaction.order_type == order_type)
    
    if date_from:
        query = query.where(func.date(Transaction.timestamp) >= date_from)
        
    if date_to:
        query = query.where(func.date(Transaction.timestamp) <= date_to)
        
    # Count total and sum total_revenue
    subq = query.subquery()
    agg_query = select(
        func.count(),
        func.coalesce(func.sum(subq.c.total_amount), 0.0)
    ).select_from(subq)
    
    result = await db.execute(agg_query)
    total, total_revenue = result.first()
    
    # Paginate and sort newest first
    query = query.order_by(Transaction.timestamp.desc())
    query = query.offset((page - 1) * size).limit(size)
    
    result = await db.execute(query)
    transactions = result.unique().scalars().all()
    
    items = []
    for txn in transactions:
        cashier_name = txn.cashier.name if txn.cashier else None
        
        items.append(OrderHistoryItem(
            id=txn.id,
            timestamp=txn.timestamp,
            order_type=txn.order_type,
            routing_number=txn.routing_number,
            payment_method=txn.payment_method,
            subtotal=txn.subtotal,
            tax=txn.tax,
            total_amount=txn.total_amount,
            status=txn.status,
            cashier_name=cashier_name
        ))
        
    return PaginatedOrderHistory(
        items=items,
        total=total or 0,
        total_revenue=total_revenue or 0.0,
        page=page,
        size=size
    )
