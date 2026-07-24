from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import select, func, and_, text, case, delete, update
from sqlalchemy.exc import IntegrityError

from ..database import get_db
from ..auth import role_required, get_password_hash
from ..models import (
    User, RoleEnum, Transaction, TransactionItem, StatusEnum, AuditLog, 
    MenuItem, TransactionItemModifier, Ingredient, Recipe, 
    ItemModifierGroup, ItemModifier, ModifierRecipe
)

from sqlalchemy.orm import aliased, joinedload, selectinload
from datetime import datetime, timedelta
from typing import List, Optional
from datetime import date
from zoneinfo import ZoneInfo

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
    PaginatedOrderHistory, OrderHistoryItem, OrderVelocityDataPoint,
    MenuEngineeringResponse, MenuEngineeringItem,
    KPITransactionItem, PaginatedKPITransactions,
    COGSBreakdownItem, PaginatedCOGSBreakdown,
    MarginTrendItem, ATSBucketItem,
    MenuItemResponse, MenuItemDetailResponse, MenuItemCreate, MenuItemUpdate,
    RecipeEntryInput, RecipeEntryResponse
)
from ..models import OrderTypeEnum

MOD_STATS_CTE = """
        WITH ModStats AS (
            SELECT transaction_item_id,
                   sum(price_at_time) as mod_revenue_per_unit,
                   sum(cogs_per_unit) as mod_cogs_per_unit
            FROM transaction_item_modifiers
            GROUP BY transaction_item_id
        )"""

router = APIRouter(prefix="/manager", tags=["Manager BI"])

@router.get("/staff", response_model=List[StaffResponse])
async def get_staff(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    result = await db.execute(select(User))
    users = result.scalars().all()
    
    tx_result = await db.execute(
        select(Transaction.cashier_id, func.max(Transaction.timestamp))
        .group_by(Transaction.cashier_id)
    )
    tx_map = {row[0]: row[1] for row in tx_result.all()}

    audit_result = await db.execute(
        select(AuditLog.user_id, func.max(AuditLog.timestamp))
        .group_by(AuditLog.user_id)
    )
    audit_map = {row[0]: row[1] for row in audit_result.all()}

    staff_list = []
    for u in users:
        # Find latest transaction as proxy for last active (for cashiers)
        last_transaction = tx_map.get(u.id) if u.role == RoleEnum.Cashier else None

        # Find latest audit log (e.g. login)
        last_audit = audit_map.get(u.id)

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
            "has_transactions": has_transactions,
            "is_super_admin": u.is_super_admin
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

    # Only an existing super admin can create another super admin account
    can_grant_super_admin = current_user.is_super_admin if hasattr(current_user, 'is_super_admin') else False
    is_super_admin = staff.is_super_admin if can_grant_super_admin else False

    user_data = {
        "name": staff.name,
        "username": staff.username,
        "role": staff.role,
        "hashed_password": get_password_hash(staff.password),
        "phone_number": staff.phone_number,
        "email": staff.email,
        "is_active": True,
        "is_super_admin": is_super_admin
    }
    if staff.id is not None:
        user_data["id"] = staff.id
    else:
        from datetime import datetime
        year = str(datetime.utcnow().year)[-2:]
        role_map = {'Manager': 'MGR', 'Cashier': 'CSH', 'Warehouse': 'WHS'}
        role_code = role_map.get(staff.role.value, 'UNK')
        
        res_seq = await db.execute(
            select(User.id)
            .where(User.id.like(f"EMP-%-{year}%"))
            .order_by(User.id.desc())
        )
        max_id = res_seq.scalars().first()
        if max_id:
            try:
                seq = int(max_id[-3:])
                user_data["id"] = f"EMP-{role_code}-{year}{seq + 1:03d}"
            except ValueError:
                user_data["id"] = f"EMP-{role_code}-{year}100"
        else:
            user_data["id"] = f"EMP-{role_code}-{year}100"
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
        "has_transactions": False,
        "is_super_admin": new_user.is_super_admin
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
    if current_user.is_super_admin and staff.is_super_admin is not None:
        user.is_super_admin = staff.is_super_admin

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
        "has_transactions": False,
        "is_super_admin": user.is_super_admin
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

    # Protect last Super-Admin from being deactivated
    if user.is_super_admin and user.is_active:
        res_sa = await db.execute(
            select(func.count(User.id)).where(User.is_super_admin == True, User.is_active == True)
        )
        if (res_sa.scalar() or 0) <= 1:
            raise HTTPException(status_code=400, detail="Cannot deactivate the system's last remaining active Super-Admin.")

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

    if user.role == RoleEnum.Manager and not current_user.is_super_admin:
        raise HTTPException(status_code=403, detail="Only Super-Admins can delete managers")

    if user.is_super_admin:
        res_sa = await db.execute(
            select(func.count(User.id)).where(User.is_super_admin == True, User.is_active == True)
        )
        if (res_sa.scalar() or 0) <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the system's last remaining active Super-Admin.")

    try:
        await db.delete(user)
        await db.commit()
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="Cannot delete staff with transaction history. Please deactivate instead.")
        
    return {"message": "Employee deleted"}

# --- MENU MANAGEMENT HELPERS & ENDPOINTS ---

async def _check_duplicate_menu_name(db: AsyncSession, name: str, exclude_id: Optional[str] = None):
    stmt = select(MenuItem.id).where(
        func.lower(MenuItem.name) == name.strip().lower(),
        MenuItem.is_active == True
    )
    if exclude_id:
        stmt = stmt.where(MenuItem.id != exclude_id)
    result = await db.execute(stmt)
    if result.first():
        raise HTTPException(
            status_code=400,
            detail=f"A menu item named '{name.strip()}' already exists."
        )

async def _validate_ingredient_ids(db: AsyncSession, recipe_inputs: List[RecipeEntryInput]):
    provided_ids = {r.ingredient_id for r in recipe_inputs}
    if not provided_ids:
        return
    result = await db.execute(select(Ingredient.id).where(Ingredient.id.in_(provided_ids)))
    found_ids = {row[0] for row in result.all()}
    missing = provided_ids - found_ids
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Unknown ingredient IDs: {', '.join(sorted(missing))}"
        )

def _format_menu_item_detail(item: MenuItem) -> MenuItemDetailResponse:
    recipe_responses = []
    if item.recipes:
        for r in item.recipes:
            recipe_responses.append(
                RecipeEntryResponse(
                    ingredient_id=r.ingredient_id,
                    ingredient_name=r.ingredient.name if r.ingredient else "",
                    unit=r.ingredient.unit if r.ingredient else "",
                    quantity=float(r.quantity)
                )
            )
    return MenuItemDetailResponse(
        id=item.id,
        name=item.name,
        description=getattr(item, "description", None),
        price=float(item.price),
        category=item.category,
        image=item.image,
        is_active=item.is_active,
        is_available=item.is_available,
        recipes=recipe_responses
    )

@router.get("/menu", response_model=List[MenuItemResponse])
async def get_manager_menu(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    result = await db.execute(
        select(MenuItem)
        .options(
            selectinload(MenuItem.modifier_groups).selectinload(ItemModifierGroup.modifiers)
        )
    )
    items = result.scalars().all()
    return items

@router.get("/menu/{item_id}", response_model=MenuItemDetailResponse)
async def get_manager_menu_detail(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    result = await db.execute(
        select(MenuItem)
        .options(
            selectinload(MenuItem.recipes).selectinload(Recipe.ingredient),
            selectinload(MenuItem.modifier_groups).selectinload(ItemModifierGroup.modifiers)
        )
        .where(MenuItem.id == item_id)
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")
    return _format_menu_item_detail(item)

@router.post("/menu", response_model=MenuItemDetailResponse, status_code=201)
async def create_menu_item(
    item_in: MenuItemCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    current_user_id = current_user.id
    await _check_duplicate_menu_name(db, item_in.name)
    await _validate_ingredient_ids(db, item_in.recipes)

    new_item = MenuItem(
        name=item_in.name.strip(),
        category=item_in.category.strip(),
        price=item_in.price,
        image=item_in.image,
        is_active=item_in.is_active
    )
    db.add(new_item)
    await db.flush()

    for r_in in item_in.recipes:
        recipe = Recipe(
            menu_item_id=new_item.id,
            ingredient_id=r_in.ingredient_id,
            quantity=r_in.quantity
        )
        db.add(recipe)

    audit = AuditLog(
        user_id=current_user_id,
        action="Create Menu Item",
        resource=f"MenuItem:{new_item.name}",
        outcome="Success"
    )
    db.add(audit)

    await db.commit()

    result = await db.execute(
        select(MenuItem)
        .options(
            selectinload(MenuItem.recipes).selectinload(Recipe.ingredient),
            selectinload(MenuItem.modifier_groups)
        )
        .where(MenuItem.id == new_item.id)
    )
    created_item = result.scalars().first()
    return _format_menu_item_detail(created_item)

@router.put("/menu/{item_id}", response_model=MenuItemDetailResponse)
async def update_menu_item(
    item_id: str,
    item_in: MenuItemUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    current_user_id = current_user.id
    result = await db.execute(
        select(MenuItem)
        .options(
            selectinload(MenuItem.recipes),
            selectinload(MenuItem.modifier_groups)
        )
        .where(MenuItem.id == item_id)
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    update_data = item_in.model_dump(exclude_unset=True)

    if "name" in update_data and update_data["name"] is not None:
        new_name = update_data["name"].strip()
        if new_name.lower() != item.name.lower():
            await _check_duplicate_menu_name(db, new_name, exclude_id=item_id)
        item.name = new_name

    if "category" in update_data and update_data["category"] is not None:
        item.category = update_data["category"].strip()

    if "price" in update_data and update_data["price"] is not None:
        item.price = update_data["price"]

    if "image" in update_data:
        item.image = update_data["image"]

    if "is_active" in update_data and update_data["is_active"] is not None:
        item.is_active = update_data["is_active"]

    if item_in.recipes is not None:
        await _validate_ingredient_ids(db, item_in.recipes)
        await db.execute(delete(Recipe).where(Recipe.menu_item_id == item_id))
        for r_in in item_in.recipes:
            db.add(Recipe(
                menu_item_id=item_id,
                ingredient_id=r_in.ingredient_id,
                quantity=r_in.quantity
            ))

    audit = AuditLog(
        user_id=current_user_id,
        action="Update Menu Item",
        resource=f"MenuItem:{item.name}",
        outcome="Success"
    )
    db.add(audit)

    await db.commit()

    res = await db.execute(
        select(MenuItem)
        .options(
            selectinload(MenuItem.recipes).selectinload(Recipe.ingredient),
            selectinload(MenuItem.modifier_groups)
        )
        .where(MenuItem.id == item_id)
        .execution_options(populate_existing=True)
    )
    updated_item = res.scalars().first()
    return _format_menu_item_detail(updated_item)

@router.delete("/menu/{item_id}")
async def delete_menu_item(
    item_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    current_user_id = current_user.id
    result = await db.execute(select(MenuItem).where(MenuItem.id == item_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    item_name = item.name

    # Delete all children explicitly in dependency order
    await db.execute(delete(ModifierRecipe).where(
        ModifierRecipe.modifier_id.in_(
            select(ItemModifier.id).where(
                ItemModifier.group_id.in_(
                    select(ItemModifierGroup.id).where(ItemModifierGroup.menu_item_id == item_id)
                )
            )
        )
    ))
    await db.execute(delete(ItemModifier).where(
        ItemModifier.group_id.in_(
            select(ItemModifierGroup.id).where(ItemModifierGroup.menu_item_id == item_id)
        )
    ))
    await db.execute(delete(ItemModifierGroup).where(ItemModifierGroup.menu_item_id == item_id))
    await db.execute(delete(Recipe).where(Recipe.menu_item_id == item_id))

    await db.delete(item)

    try:
        await db.commit()
        audit = AuditLog(
            user_id=current_user_id,
            action="Delete Menu Item",
            resource=f"MenuItem:{item_name}",
            outcome="Hard Deleted"
        )
        db.add(audit)
        await db.commit()
        return {"status": "deleted"}
    except IntegrityError:
        await db.rollback()
        await db.execute(
            update(MenuItem)
            .where(MenuItem.id == item_id)
            .values(is_active=False)
        )
        audit = AuditLog(
            user_id=current_user_id,
            action="Deactivate Menu Item",
            resource=f"MenuItem:{item_name}",
            outcome="Soft Deactivated (has transactions)"
        )
        db.add(audit)
        await db.commit()
        return {"status": "deactivated"}


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
    gross_revenue = float(result.scalar() or 0.0)

    tax_result = await db.execute(
        select(func.sum(Transaction.tax))
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
    )
    tax_collected = float(tax_result.scalar() or 0.0)

    # Calculate base COGS from TransactionItems
    cogs_items_res = await db.execute(
        select(func.sum(TransactionItem.quantity * TransactionItem.cogs_per_unit))
        .select_from(TransactionItem)
        .join(Transaction)
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
    )
    cogs_items = float(cogs_items_res.scalar() or 0.0)

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
    cogs_mods = float(cogs_mods_res.scalar() or 0.0)

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
    total_subtotal = float(orders_row[1] or 0.0)
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

@router.get("/analytics/order-velocity", response_model=List[OrderVelocityDataPoint])
async def get_order_velocity(
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
            func.count(Transaction.id).label("count")
        )
        .outerjoin(
            Transaction,
            (trunc_tx_ts == series.c.ts) & 
            (Transaction.status == StatusEnum.Completed) &
            (Transaction.timestamp >= start_utc) &
            (Transaction.timestamp <= end_utc)
        )
        .group_by(series.c.ts)
        .order_by(series.c.ts)
    )
    
    result = await db.execute(stmt)
    
    response = []
    for row in result.all():
        response.append({
            "date": row.date.strftime("%Y-%m-%d %H:%M:%S"),
            "orders": int(row.count)
        })
        
    return response

@router.get("/analytics/menu-engineering", response_model=MenuEngineeringResponse)
async def get_menu_engineering(
    timeframe: str = "last_30_days",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    start_utc, end_utc, _, _ = get_timeframe_boundaries(timeframe)
    
    # 1. Check total orders threshold (50)
    total_orders_stmt = (
        select(func.count(Transaction.id))
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
    )
    total_orders_res = await db.execute(total_orders_stmt)
    total_orders = total_orders_res.scalar() or 0
    
    insufficient_data = total_orders < 50
    bypass_threshold = False # Disabled by default. Change to True only for local testing of classification logic with sparse data.
    
    if insufficient_data and not bypass_threshold:
        return MenuEngineeringResponse(
            insufficient_data=True, total_orders=total_orders,
            average_volume=0, average_margin=0, items=[]
        )
        
    # 2. Get fully-loaded margin and volume per menu item
    query = text(MOD_STATS_CTE + """
        SELECT 
            ti.menu_item_id, 
            mi.name,
            sum(ti.quantity) as units_sold,
            sum(ti.quantity * ti.price_at_time) as base_revenue,
            sum(ti.quantity * ti.cogs_per_unit) as base_cogs,
            sum(ti.quantity * COALESCE(m.mod_revenue_per_unit, 0)) as total_mod_revenue,
            sum(ti.quantity * COALESCE(m.mod_cogs_per_unit, 0)) as total_mod_cogs
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        JOIN menu_items mi ON mi.id = ti.menu_item_id
        LEFT JOIN ModStats m ON m.transaction_item_id = ti.id
        WHERE t.status = 'Completed' 
          AND t.timestamp >= :start_utc 
          AND t.timestamp <= :end_utc
        GROUP BY ti.menu_item_id, mi.name
    """)
    result = await db.execute(query, {"start_utc": start_utc, "end_utc": end_utc})
    
    items = []
    classified_vols = []
    classified_margins = []
    
    # 3. Calculate per-unit margin
    for row in result.all():
        units_sold = int(row.units_sold)
        total_revenue = float(row.base_revenue) + float(row.total_mod_revenue)
        total_cogs = float(row.base_cogs) + float(row.total_mod_cogs)
        
        avg_margin_per_unit = (total_revenue - total_cogs) / units_sold if units_sold > 0 else 0
        
        items.append({
            "menu_item_id": row.menu_item_id,
            "menu_item_name": row.name,
            "units_sold": units_sold,
            "avg_contribution_margin_per_unit": round(avg_margin_per_unit, 2),
            "category": "Insufficient Data"
        })
        
        if units_sold >= 5:
            classified_vols.append(units_sold)
            classified_margins.append(avg_margin_per_unit)
            
    # 4. Compute averages (excluding < 5 unit items)
    avg_vol = sum(classified_vols) / len(classified_vols) if classified_vols else 0
    avg_mar = sum(classified_margins) / len(classified_margins) if classified_margins else 0
    
    # 5. Classify
    final_items = []
    for item in items:
        if item["units_sold"] < 5:
            item["category"] = "Insufficient Data"
        else:
            is_high_vol = item["units_sold"] >= avg_vol
            is_high_mar = item["avg_contribution_margin_per_unit"] >= avg_mar
            
            if is_high_vol and is_high_mar:
                item["category"] = "Star"
            elif is_high_vol and not is_high_mar:
                item["category"] = "Plowhorse"
            elif not is_high_vol and is_high_mar:
                item["category"] = "Puzzle"
            else:
                item["category"] = "Dog"
                
        final_items.append(MenuEngineeringItem(**item))
        
    return MenuEngineeringResponse(
        insufficient_data=False if bypass_threshold else insufficient_data,
        total_orders=total_orders,
        average_volume=round(avg_vol, 2),
        average_margin=round(avg_mar, 2),
        items=final_items
    )

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
            subtotal=float(txn.subtotal),
            tax=float(txn.tax),
            total_amount=float(txn.total_amount),
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

@router.get("/dashboard/kpis/transactions", response_model=PaginatedKPITransactions)
async def get_kpi_transactions(
    timeframe: str = "last_7_days",
    page: int = 1,
    size: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    start_utc, end_utc, _, _ = get_timeframe_boundaries(timeframe)

    ti_cogs = select(
        TransactionItem.transaction_id,
        func.sum(TransactionItem.quantity * TransactionItem.cogs_per_unit).label('items_cogs')
    ).group_by(TransactionItem.transaction_id).subquery()
    
    mod_cogs = select(
        TransactionItem.transaction_id,
        func.sum(TransactionItem.quantity * TransactionItemModifier.cogs_per_unit).label('mods_cogs')
    ).select_from(TransactionItemModifier).join(
        TransactionItem, TransactionItemModifier.transaction_item_id == TransactionItem.id
    ).group_by(TransactionItem.transaction_id).subquery()
    
    query = (
        select(
            Transaction,
            func.coalesce(ti_cogs.c.items_cogs, 0.0).label('items_cogs'),
            func.coalesce(mod_cogs.c.mods_cogs, 0.0).label('mods_cogs')
        )
        .outerjoin(ti_cogs, Transaction.id == ti_cogs.c.transaction_id)
        .outerjoin(mod_cogs, Transaction.id == mod_cogs.c.transaction_id)
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
    )
    
    count_query = select(func.count()).select_from(query.subquery())
    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0
    
    query = query.order_by(Transaction.timestamp.desc())
    query = query.offset((page - 1) * size).limit(size)
    
    result = await db.execute(query)
    rows = result.all()
    
    items = []
    for row in rows:
        txn = row.Transaction
        items_cogs_val = float(row.items_cogs)
        mods_cogs_val = float(row.mods_cogs)
        cogs = items_cogs_val + mods_cogs_val
        gross_revenue = float(txn.total_amount)
        net_revenue = gross_revenue - cogs
        
        items.append(KPITransactionItem(
            id=txn.id,
            timestamp=txn.timestamp,
            payment_method=txn.payment_method.value if hasattr(txn.payment_method, "value") else str(txn.payment_method),
            gross_revenue=gross_revenue,
            tax=float(txn.tax),
            cogs=cogs,
            net_revenue=net_revenue
        ))
        
    return PaginatedKPITransactions(
        items=items,
        total=total,
        page=page,
        size=size
    )

@router.get("/dashboard/kpis/cogs-breakdown", response_model=PaginatedCOGSBreakdown)
async def get_cogs_breakdown(
    timeframe: str = "last_7_days",
    page: int = 1,
    size: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    start_utc, end_utc, _, _ = get_timeframe_boundaries(timeframe)

    # Calculate summary total COGS directly matching get_kpis()
    cogs_items_res = await db.execute(
        select(func.sum(TransactionItem.quantity * TransactionItem.cogs_per_unit))
        .select_from(TransactionItem)
        .join(Transaction)
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
    )
    cogs_items_total = cogs_items_res.scalar() or 0.0

    cogs_mods_res = await db.execute(
        select(func.sum(TransactionItem.quantity * TransactionItemModifier.cogs_per_unit))
        .select_from(TransactionItemModifier)
        .join(TransactionItem)
        .join(Transaction)
        .where(Transaction.status == StatusEnum.Completed)
        .where(Transaction.timestamp >= start_utc)
        .where(Transaction.timestamp <= end_utc)
    )
    cogs_mods_total = cogs_mods_res.scalar() or 0.0
    summary_total_cogs = cogs_items_total + cogs_mods_total

    # Use raw SQL to group by menu_item_id exactly like menu engineering
    query = text(MOD_STATS_CTE + """
        SELECT 
            ti.menu_item_id, 
            mi.name,
            sum(ti.quantity) as units_sold,
            sum(ti.quantity * ti.price_at_time) as base_revenue,
            sum(ti.quantity * ti.cogs_per_unit) as base_cogs,
            sum(ti.quantity * COALESCE(m.mod_revenue_per_unit, 0)) as total_mod_revenue,
            sum(ti.quantity * COALESCE(m.mod_cogs_per_unit, 0)) as total_mod_cogs
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        JOIN menu_items mi ON mi.id = ti.menu_item_id
        LEFT JOIN ModStats m ON m.transaction_item_id = ti.id
        WHERE t.status = 'Completed' 
          AND t.timestamp >= :start_utc 
          AND t.timestamp <= :end_utc
        GROUP BY ti.menu_item_id, mi.name
        ORDER BY (sum(ti.quantity * ti.cogs_per_unit) + sum(ti.quantity * COALESCE(m.mod_cogs_per_unit, 0))) DESC
    """)
    
    result = await db.execute(query, {"start_utc": start_utc, "end_utc": end_utc})
    all_rows = result.all()
    
    total = len(all_rows)
    # Paginate in memory
    start_idx = (page - 1) * size
    end_idx = start_idx + size
    page_rows = all_rows[start_idx:end_idx]
    
    items = []
    for row in page_rows:
        item_cogs = float(row.base_cogs)
        modifier_cogs = float(row.total_mod_cogs)
        total_cogs = item_cogs + modifier_cogs
        
        # Calculate Percentage of Total COGS (against the FULL period's summary_total_cogs)
        pct_of_total_cogs = (total_cogs / summary_total_cogs * 100) if summary_total_cogs > 0 else 0.0
        
        # Calculate Food Cost Percentage (Total COGS / Item's Gross Revenue)
        item_gross_revenue = float(row.base_revenue) + float(row.total_mod_revenue)
        food_cost_pct = (total_cogs / item_gross_revenue * 100) if item_gross_revenue > 0 else 0.0
        
        items.append(COGSBreakdownItem(
            menu_item_id=str(row.menu_item_id),
            menu_item_name=row.name,
            units_sold=int(row.units_sold),
            item_cogs=item_cogs,
            modifier_cogs=modifier_cogs,
            total_cogs=total_cogs,
            percentage_of_total_cogs=round(pct_of_total_cogs, 2),
            food_cost_percentage=round(food_cost_pct, 2)
        ))
        
    return PaginatedCOGSBreakdown(
        items=items,
        total=total,
        page=page,
        size=size,
        summary_total_cogs=round(summary_total_cogs, 2)
    )

@router.get("/dashboard/kpis/margin-trend", response_model=List[MarginTrendItem])
async def get_margin_trend(
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
    
    ti_cogs = select(
        TransactionItem.transaction_id,
        func.sum(TransactionItem.quantity * TransactionItem.cogs_per_unit).label('items_cogs')
    ).group_by(TransactionItem.transaction_id).subquery()
    
    mod_cogs = select(
        TransactionItem.transaction_id,
        func.sum(TransactionItem.quantity * TransactionItemModifier.cogs_per_unit).label('mods_cogs')
    ).select_from(TransactionItemModifier).join(
        TransactionItem, TransactionItemModifier.transaction_item_id == TransactionItem.id
    ).group_by(TransactionItem.transaction_id).subquery()

    stmt = (
        select(
            series.c.ts.label("date"),
            func.coalesce(func.sum(Transaction.total_amount), 0).label("gross_revenue"),
            func.coalesce(func.sum(func.coalesce(ti_cogs.c.items_cogs, 0.0) + func.coalesce(mod_cogs.c.mods_cogs, 0.0)), 0).label("cogs")
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
        .outerjoin(ti_cogs, Transaction.id == ti_cogs.c.transaction_id)
        .outerjoin(mod_cogs, Transaction.id == mod_cogs.c.transaction_id)
        .group_by(series.c.ts)
        .order_by(series.c.ts)
    )
    result = await db.execute(stmt)
    
    trend = []
    for row in result.all():
        gross = float(row.gross_revenue)
        cogs = float(row.cogs)
        net = gross - cogs
        profit_margin = (net / gross * 100) if gross > 0 else 0.0
        
        trend.append(MarginTrendItem(
            date=row.date.strftime("%Y-%m-%d %H:%M:%S") if row.date else "",
            gross_revenue=round(gross, 2),
            cogs=round(cogs, 2),
            net_revenue=round(net, 2),
            profit_margin_percent=round(profit_margin, 2)
        ))
    return trend


@router.get("/dashboard/kpis/ats-distribution", response_model=List[ATSBucketItem])
async def get_ats_distribution(
    timeframe: str = "last_7_days",
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(role_required([RoleEnum.Manager]))
):
    start_utc, end_utc, _, _ = get_timeframe_boundaries(timeframe)

    stmt = select(
        func.count(Transaction.id).label("total_orders"),
        func.sum(
            case((Transaction.subtotal < 50000, 1), else_=0)
        ).label("bucket_0_50"),
        func.sum(
            case((and_(Transaction.subtotal >= 50000, Transaction.subtotal < 100000), 1), else_=0)
        ).label("bucket_50_100"),
        func.sum(
            case((and_(Transaction.subtotal >= 100000, Transaction.subtotal < 150000), 1), else_=0)
        ).label("bucket_100_150"),
        func.sum(
            case((and_(Transaction.subtotal >= 150000, Transaction.subtotal < 200000), 1), else_=0)
        ).label("bucket_150_200"),
        func.sum(
            case((Transaction.subtotal >= 200000, 1), else_=0)
        ).label("bucket_200_plus")
    ).where(
        Transaction.status == StatusEnum.Completed,
        Transaction.timestamp >= start_utc,
        Transaction.timestamp <= end_utc
    )

    result = await db.execute(stmt)
    row = result.first()

    total_orders = int(row.total_orders) if row and row.total_orders else 0
    b1 = int(row.bucket_0_50) if row and row.bucket_0_50 else 0
    b2 = int(row.bucket_50_100) if row and row.bucket_50_100 else 0
    b3 = int(row.bucket_100_150) if row and row.bucket_100_150 else 0
    b4 = int(row.bucket_150_200) if row and row.bucket_150_200 else 0
    b5 = int(row.bucket_200_plus) if row and row.bucket_200_plus else 0
    
    def calc_pct(count):
        return (count / total_orders * 100) if total_orders > 0 else 0.0

    return [
        ATSBucketItem(bucket="0 - 50k", order_count=b1, percentage=round(calc_pct(b1), 2)),
        ATSBucketItem(bucket="50k - 100k", order_count=b2, percentage=round(calc_pct(b2), 2)),
        ATSBucketItem(bucket="100k - 150k", order_count=b3, percentage=round(calc_pct(b3), 2)),
        ATSBucketItem(bucket="150k - 200k", order_count=b4, percentage=round(calc_pct(b4), 2)),
        ATSBucketItem(bucket="200k+", order_count=b5, percentage=round(calc_pct(b5), 2))
    ]
