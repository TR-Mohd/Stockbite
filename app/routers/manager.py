from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..auth import role_required, get_password_hash
from ..models import User, RoleEnum, Transaction, TransactionItem, StatusEnum, AuditLog, MenuItem

from sqlalchemy.orm import aliased
from datetime import datetime, timedelta
from typing import List
from ..schemas import (
    StaffResponse, UserCreate, UserUpdate, 
    RevenueTrendItem, BestSellerItem, HeatmapDataPoint, BasketAnalysisItem
)

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
            "role": u.role.value,
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
    res = await db.execute(select(User).where(User.name == staff.name))
    if res.scalars().first():
        raise HTTPException(status_code=400, detail="Username already exists")

    user_data = {
        "name": staff.name,
        "role": staff.role,
        "hashed_password": get_password_hash(staff.password),
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
        "role": new_user.role.value,
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

    # If changing name, check if taken by another user
    if user.name != staff.name:
        exist_res = await db.execute(select(User).where(User.name == staff.name))
        if exist_res.scalars().first():
            raise HTTPException(status_code=400, detail="Username already exists")

    user.name = staff.name
    user.role = staff.role
    if staff.password:
        user.hashed_password = get_password_hash(staff.password)
    await db.commit()

    return {
        "id": user.id,
        "name": user.name,
        "role": user.role.value,
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
    if current_user.name != "mohammed":
        raise HTTPException(status_code=403, detail="Only Mohammed can delete employees")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")

    res = await db.execute(select(User).where(User.id == user_id))
    user = res.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    try:
        await db.delete(user)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete staff with transaction history. Please deactivate instead.")
        
    return {"message": "Employee deleted"}

@router.get("/dashboard/kpis")
async def get_kpis(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    # Calculate Gross Revenue from Completed Transactions
    result = await db.execute(
        select(func.sum(Transaction.total_amount))
        .where(Transaction.status == StatusEnum.Completed)
    )
    gross_revenue = result.scalar() or 0.0

    # For an MVP, we can simulate COGS as a percentage or compute from ingredient costs if available
    # Assuming 35% COGS for prototype
    cogs = gross_revenue * 0.35
    net_revenue = gross_revenue - cogs
    profit_margin = (net_revenue / gross_revenue * 100) if gross_revenue > 0 else 0.0

    return {
        "gross_revenue": round(gross_revenue, 2),
        "cogs": round(cogs, 2),
        "net_revenue": round(net_revenue, 2),
        "profit_margin_percent": round(profit_margin, 2)
    }

@router.get("/analytics/revenue-trend", response_model=List[RevenueTrendItem])
async def get_revenue_trend(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    stmt = (
        select(
            func.date_trunc('day', Transaction.timestamp).label("date"),
            func.sum(Transaction.total_amount).label("revenue")
        )
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= seven_days_ago)
        .group_by(text("date"))
        .order_by(text("date"))
    )
    result = await db.execute(stmt)
    
    trend = []
    for row in result.all():
        trend.append({
            "date": row.date.strftime("%Y-%m-%d") if row.date else "",
            "revenue": float(row.revenue or 0)
        })
    return trend

@router.get("/analytics/best-sellers", response_model=List[BestSellerItem])
async def get_best_sellers(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    stmt = (
        select(
            MenuItem.name,
            func.sum(TransactionItem.quantity).label("total_sold")
        )
        .join(TransactionItem, TransactionItem.menu_item_id == MenuItem.id)
        .join(Transaction, TransactionItem.transaction_id == Transaction.id)
        .where(Transaction.status == StatusEnum.Completed)
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    stmt = (
        select(
            func.extract('dow', Transaction.timestamp).label('dow'),
            func.extract('hour', Transaction.timestamp).label('hour'),
            func.count(Transaction.id).label('count')
        )
        .where(Transaction.status == StatusEnum.Completed)
        .group_by(
            func.extract('dow', Transaction.timestamp),
            func.extract('hour', Transaction.timestamp)
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
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    ti1 = aliased(TransactionItem)
    ti2 = aliased(TransactionItem)
    mi1 = aliased(MenuItem)
    mi2 = aliased(MenuItem)
    
    stmt = (
        select(
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
        .where(ti1.menu_item_id < ti2.menu_item_id)
        .group_by(mi1.id, mi2.id)
        .order_by(func.count().desc())
        .limit(3)
    )
    result = await db.execute(stmt)
    
    return [
        {
            "item1_name": row.item1_name,
            "item2_name": row.item2_name,
            "frequency": int(row.frequency)
        }
        for row in result.all()
    ]

