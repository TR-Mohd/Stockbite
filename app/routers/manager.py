from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from ..database import get_db
from ..auth import role_required, get_password_hash
from ..models import User, RoleEnum, Transaction, TransactionItem, StatusEnum, AuditLog

from typing import List
from ..schemas import StaffResponse, UserCreate, UserUpdate

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
        
        staff_list.append({
            "id": u.id,
            "name": u.name,
            "role": u.role.value,
            "last_active": last_active,
            "status": "Active" if u.is_active else "Inactive"
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
        "status": "Active"
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
        "status": "Active" if user.is_active else "Inactive"
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

    await db.delete(user)
    await db.commit()
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
