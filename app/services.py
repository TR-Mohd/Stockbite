from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi import HTTPException
from .models import Ingredient, AuditLog

def update_ingredient_stock(db: AsyncSession, ingredient: Ingredient, amount: float, user_id: str, action: str, reason: str = None, extra_details: dict = None):
    """
    Shared function to update ingredient stock level and record an AuditLog.
    Does NOT commit the transaction. The caller is responsible for db.commit() and catching StaleDataError.
    """
    old_stock = ingredient.stock_level
    new_stock = max(0.0, old_stock + amount)
    ingredient.stock_level = new_stock
    
    details = {
        "old_stock": old_stock,
        "new_stock": new_stock,
        "delta": amount
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
