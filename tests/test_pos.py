import pytest
import asyncio
from httpx import AsyncClient
from app.main import app
from app.database import Base, get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models import User, RoleEnum, Ingredient, MenuItem, Recipe
from app.auth import get_password_hash

import pytest_asyncio

import pytest_asyncio
from sqlalchemy.pool import NullPool

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
        # Create user
        user = User(name="test_cashier", role=RoleEnum.Cashier, hashed_password=get_password_hash("pass"))
        session.add(user)
        
        # Create ingredient with 10 stock
        ing = Ingredient(id="ing_1", name="Chicken", stock_level=10.0, unit="kg", version_id=1)
        session.add(ing)
        
        # Create menu item
        mi = MenuItem(id="mi_1", name="Fried Chicken", price=50.0, category="Main", is_active=True)
        session.add(mi)
        await session.commit()
        
        # Create recipe requiring 5 stock
        recipe = Recipe(menu_item_id="mi_1", ingredient_id="ing_1", quantity=5.0)
        session.add(recipe)
        await session.commit()
    
    yield

from httpx import ASGITransport

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def token(client):
    # In a real test, we would hit the /auth/token endpoint
    # For now, we mock the dependency or generate a valid token manually
    from app.auth import create_access_token
    access_token = create_access_token(data={"sub": "test_cashier", "role": "Cashier"})
    return access_token

@pytest.mark.asyncio
async def test_concurrent_checkout_optimistic_locking(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "payment_method": "Cash",
        "amount_tendered": 100.0,
        "items": [
            {
                "menu_item_id": "mi_1",
                "quantity": 1
            }
        ]
    }

    # Simulate 3 concurrent checkout requests
    # Stock is 10, each requires 5. Only 2 should succeed, 1 should fail due to lack of stock or locking.
    req1 = client.post("/pos/checkout", json=payload, headers=headers)
    req2 = client.post("/pos/checkout", json=payload, headers=headers)
    req3 = client.post("/pos/checkout", json=payload, headers=headers)
    
    responses = await asyncio.gather(req1, req2, req3, return_exceptions=True)
    
    status_codes = [res.status_code for res in responses if not isinstance(res, Exception)]
    
    # Expect at least one 400 (Insufficient stock) or 409 (StaleDataError / Optimistic Lock)
    assert 200 in status_codes
    assert 409 in status_codes or 400 in status_codes
