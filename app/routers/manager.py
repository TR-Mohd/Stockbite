from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from ..database import get_db
from ..auth import role_required
from ..models import User, RoleEnum, Transaction, TransactionItem, StatusEnum

from typing import List
from ..schemas import StaffResponse

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
        # Find latest transaction as proxy for last active
        last_active = None
        if u.role == RoleEnum.Cashier:
            res = await db.execute(
                select(func.max(Transaction.timestamp)).where(Transaction.cashier_id == u.id)
            )
            last_active = res.scalar()
        
        staff_list.append({
            "id": u.id,
            "name": u.name,
            "role": u.role.value,
            "last_active": last_active,
            "status": "Active" # Mock status for now
        })
    return staff_list

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
