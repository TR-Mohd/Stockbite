import os
import sys
import uuid
import pytest
from datetime import datetime

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import Base
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from app.models import Transaction, StatusEnum, PaymentMethodEnum, User, RoleEnum
from app.routers.manager import get_kpis
import pytest_asyncio

TEST_DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite_test"

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_test_db():
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    return TestSessionLocal

@pytest.mark.asyncio
async def test_dashboard_pipeline(setup_test_db):
    TestSessionLocal = setup_test_db
    async with TestSessionLocal() as db:
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
        expected_cogs = 0.0
        expected_net = expected_gross - expected_cogs
        
        mock_manager = User(id=str(uuid.uuid4()), name="mock_manager", role=RoleEnum.Manager)
        kpis = await get_kpis(timeframe="last_7_days", db=db, current_user=mock_manager)
        
        assert kpis["gross_revenue"] == expected_gross, f"Gross revenue mismatch"
        assert kpis["cogs"] == expected_cogs, f"COGS mismatch: expected 0 (no items), got {kpis['cogs']}"
        assert kpis["net_revenue"] == expected_net, f"Net revenue mismatch"
