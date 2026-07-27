from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from decimal import Decimal
from .models import Ingredient, AuditLog

def update_ingredient_stock(db: AsyncSession, ingredient: Ingredient, amount: Decimal, user_id: str, action: str, reason: str = None, extra_details: dict = None):
    """
    Shared function to update ingredient stock level and record an AuditLog.
    Does NOT commit the transaction. The caller is responsible for db.commit() and catching StaleDataError.
    """
    old_stock = ingredient.stock_level
    new_stock = max(Decimal("0.0"), old_stock + amount)
    
    if ingredient.unit and ingredient.unit.lower() == 'pcs':
        if amount % 1 != 0 or new_stock % 1 != 0:
            raise HTTPException(status_code=400, detail="Fractional quantities are not allowed for 'pcs'")
            
    ingredient.stock_level = new_stock
    
    details = {
        "old_stock": float(old_stock),
        "new_stock": float(new_stock),
        "delta": float(amount)
    }
    if reason:
        details["reason"] = reason
    if extra_details:
        details.update(extra_details)
        
    audit = AuditLog(
        user_id=user_id,
        action=action,
        resource=f"Ingredient:{ingredient.name}",
        outcome="Success",
        details=details
    )
    db.add(audit)
    return new_stock

from typing import Callable, Type
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.dialects.sqlite import insert as sqlite_insert
from .models import IDSequence

async def get_next_id_sequence(
    db: AsyncSession,
    key: str,
    model: Type,
    prefix_pattern: str,
    default_start_val: int,
    extract_seq_fn: Callable[[str], int]
) -> int:
    """
    Race-safe generator for sequential structured IDs using pessimistic locks and ON CONFLICT DO NOTHING backfill.
    """
    res = await db.execute(
        select(IDSequence).where(IDSequence.key == key).with_for_update()
    )
    seq_row = res.scalars().first()

    if not seq_row:
        res_max = await db.execute(
            select(model.id)
            .where(model.id.like(prefix_pattern))
            .order_by(model.id.desc())
        )
        max_id = res_max.scalars().first()

        init_val = default_start_val - 1
        if max_id:
            try:
                init_val = extract_seq_fn(max_id)
            except Exception:
                init_val = default_start_val - 1

        dialect_name = db.bind.dialect.name if db.bind else "postgresql"
        if dialect_name == "sqlite":
            stmt = sqlite_insert(IDSequence).values(key=key, current_value=init_val).on_conflict_do_nothing(index_elements=['key'])
        else:
            stmt = pg_insert(IDSequence).values(key=key, current_value=init_val).on_conflict_do_nothing(index_elements=['key'])

        await db.execute(stmt)

        res = await db.execute(
            select(IDSequence).where(IDSequence.key == key).with_for_update()
        )
        seq_row = res.scalars().one()

    seq_row.current_value += 1
    await db.flush()
    return seq_row.current_value

