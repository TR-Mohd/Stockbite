import os
import sys
import uuid
import pytest
from datetime import datetime

# Ensure we can import app modules from the root of the worktree
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import AsyncSessionLocal, engine
from app.models import Transaction, StatusEnum, PaymentMethodEnum, User, RoleEnum
from app.routers.manager import get_kpis
from sqlalchemy import text

if sys.platform == 'win32':
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

@pytest.mark.asyncio
async def test_dashboard_pipeline():
    async with AsyncSessionLocal() as db:
        await db.execute(text("TRUNCATE TABLE transaction_items CASCADE"))
        await db.execute(text("TRUNCATE TABLE transactions CASCADE"))
        await db.commit()
        
        # Create a mock cashier for the transactions
        cashier_id = str(uuid.uuid4())
        random_name = f"mock_cashier_{uuid.uuid4().hex[:8]}"
        cashier = User(id=cashier_id, name=random_name, role=RoleEnum.Cashier, hashed_password="mock", is_active=True)
        db.add(cashier)
        await db.commit()

        txs = [
            Transaction(id=str(uuid.uuid4()), total_amount=100.0, payment_method=PaymentMethodEnum.Cash, amount_tendered=100.0, change=0.0, status=StatusEnum.Completed, cashier_id=cashier_id, timestamp=datetime.utcnow()),
            Transaction(id=str(uuid.uuid4()), total_amount=200.0, payment_method=PaymentMethodEnum.Cash, amount_tendered=200.0, change=0.0, status=StatusEnum.Completed, cashier_id=cashier_id, timestamp=datetime.utcnow()),
            Transaction(id=str(uuid.uuid4()), total_amount=300.0, payment_method=PaymentMethodEnum.Cash, amount_tendered=300.0, change=0.0, status=StatusEnum.Completed, cashier_id=cashier_id, timestamp=datetime.utcnow()),
        ]
        
        db.add_all(txs)
        await db.commit()
        
        expected_gross = sum(tx.total_amount for tx in txs)
        # COGS is computed from TransactionItem.cogs_per_unit. These transactions have no items,
        # so real COGS = 0 and net_revenue = gross_revenue.
        expected_cogs = 0.0
        expected_net = expected_gross - expected_cogs
        expected_margin = (expected_net / expected_gross * 100) if expected_gross > 0 else 0.0
        
        mock_manager = User(id=str(uuid.uuid4()), name="mock_manager", role=RoleEnum.Manager)
        kpis = await get_kpis(db=db, current_user=mock_manager)
        
        assert kpis["gross_revenue"] == expected_gross, f"Gross revenue mismatch"
        assert kpis["cogs"] == expected_cogs, f"COGS mismatch: expected 0 (no items), got {kpis['cogs']}"
        assert kpis["net_revenue"] == expected_net, f"Net revenue mismatch"
