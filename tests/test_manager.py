import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models import User, RoleEnum, Ingredient, MenuItem, Recipe, Transaction, TransactionItem, StatusEnum
from app.auth import get_password_hash, create_access_token
from sqlalchemy.pool import NullPool
import pytest_asyncio
from datetime import datetime

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
        user = User(name="test_manager", username="test_manager", role=RoleEnum.Manager, hashed_password=get_password_hash("pass"))
        session.add(user)
        
        mi = MenuItem(id="mi_1", name="burger", price=10.0, category="Main", is_active=True)
        session.add(mi)
        
        # Add ingredient
        ing = Ingredient(id="ing_1", name="Meat", stock_level=10.0, unit="kg", version_id=1, unit_cost=2.50)
        session.add(ing)
        
        # Add a completed transaction with cogs_per_unit set on the item
        txn = Transaction(id="tx_1", subtotal=20.0, tax=0.0, total_amount=20.0, payment_method="Cash", status=StatusEnum.Completed, timestamp=datetime.utcnow())
        session.add(txn)
        await session.flush()
        
        # cogs_per_unit = quantity(1) * unit_cost(2.50) = 2.50, total COGS = 2 * 2.50 = 5.0
        ti = TransactionItem(transaction_id="tx_1", menu_item_id="mi_1", quantity=2, price_at_time=10.0, cogs_per_unit=2.50)
        session.add(ti)
        
        recipe = Recipe(menu_item_id="mi_1", ingredient_id="ing_1", quantity=1.0)
        session.add(recipe)
        
        await session.commit()
    
    yield

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def token():
    return create_access_token(data={"sub": "test_manager", "role": "Manager"})

# NOTE: /manager/menu endpoint is not implemented in this worktree's router.
# This test is intentionally omitted.

@pytest.mark.asyncio
async def test_dashboard_kpis(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    res = await client.get("/manager/dashboard/kpis", headers=headers)
    assert res.status_code == 200
    data = res.json()
    # gross_revenue: 1 transaction, total_amount=20.0
    # cogs: TransactionItem has cogs_per_unit=2.50, quantity=2 → COGS = 5.0
    # net_revenue: 20.0 - 5.0 = 15.0
    assert data["gross_revenue"] == 20.0
    assert data["cogs"] == 5.0
    assert data["net_revenue"] == 15.0
