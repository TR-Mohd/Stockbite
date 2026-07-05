import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
import pytest_asyncio
from datetime import datetime, timezone
import uuid

from app.models import User, RoleEnum, Transaction, TransactionItem, StatusEnum, PaymentMethodEnum, MenuItem
from app.auth import get_password_hash, create_access_token

TEST_DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite_test"

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_db():
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed data
    async with TestSessionLocal() as session:
        user = User(id="manager_1", name="analytics_tester", username="analytics_tester", role=RoleEnum.Manager, hashed_password=get_password_hash("testpass"), is_active=True)
        session.add(user)
        
        mi1 = MenuItem(id="mi_1", name="Item 1", price=10.0, category="Foods", is_active=True)
        mi2 = MenuItem(id="mi_2", name="Item 2", price=15.0, category="Foods", is_active=True)
        session.add_all([mi1, mi2])
        await session.flush()

        now = datetime.now(timezone.utc).replace(tzinfo=None)
        
        t1_total = mi1.price * 2 + mi2.price
        t1 = Transaction(id="tx_1", total_amount=t1_total, payment_method=PaymentMethodEnum.Cash, status=StatusEnum.Completed, timestamp=now, cashier_id="manager_1")
        ti1_1 = TransactionItem(id="ti_1", transaction_id="tx_1", menu_item_id="mi_1", quantity=2, price_at_time=mi1.price)
        ti1_2 = TransactionItem(id="ti_2", transaction_id="tx_1", menu_item_id="mi_2", quantity=1, price_at_time=mi2.price)
        
        t2_total = mi1.price * 1
        t2 = Transaction(id="tx_2", total_amount=t2_total, payment_method=PaymentMethodEnum.Cash, status=StatusEnum.Completed, timestamp=now, cashier_id="manager_1")
        ti2_1 = TransactionItem(id="ti_3", transaction_id="tx_2", menu_item_id="mi_1", quantity=1, price_at_time=mi1.price)
        
        session.add_all([t1, t2, ti1_1, ti1_2, ti2_1])
        await session.commit()
    
    yield

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def token():
    return create_access_token(data={"sub": "analytics_tester", "role": "Manager"})

@pytest.mark.asyncio
async def test_analytics_endpoints(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Best Sellers
    res = await client.get("/manager/analytics/best-sellers", headers=headers)
    assert res.status_code == 200
    best_sellers = res.json()
    
    mi1_result_qty = 0
    for bs in best_sellers:
        if bs["menu_item_name"] == "Item 1":
            mi1_result_qty = bs["total_sold"]
            break
    assert mi1_result_qty == 3
    
    # Revenue Trend
    res = await client.get("/manager/analytics/revenue-trend", headers=headers)
    assert res.status_code == 200
    revenue_trend = res.json()
    
    # Find any date that has revenue to verify it summed properly
    total_revenue_in_trend = sum(rt["revenue"] for rt in revenue_trend)
    assert total_revenue_in_trend == 45.0
    assert total_revenue_in_trend == 45.0
    
    # Basket Analysis
    res = await client.get("/manager/analytics/basket-analysis", headers=headers)
    assert res.status_code == 200
    basket = res.json()
    
    pair_found = False
    for b in basket:
        if set([b["item1_name"], b["item2_name"]]) == {"Item 1", "Item 2"}:
            pair_found = True
            assert b["frequency"] == 1
            break
    assert pair_found
    
    # KPIs cross-check
    res = await client.get("/manager/dashboard/kpis", headers=headers)
    assert res.status_code == 200
    kpis = res.json()
    assert kpis["gross_revenue"] == 45.0
