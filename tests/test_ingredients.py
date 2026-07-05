import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models import User, RoleEnum, Ingredient, AuditLog
from app.auth import get_password_hash, create_access_token
from sqlalchemy.pool import NullPool
import pytest_asyncio
from sqlalchemy.future import select

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
        await session.commit()
    
    yield

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def token():
    return create_access_token(data={"sub": "test_manager", "role": "Manager"})

@pytest.mark.asyncio
async def test_create_ingredient(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Salt",
        "unit": "kg",
        "stock_level": 5.0,
        "reorder_point": 1.0,
        "category": "Spice",
        "unit_cost": 1.50
    }
    res = await client.post("/inventory/", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Salt"
    assert data["unit"] == "kg"
    assert data["unit_cost"] == 1.50
    assert "id" in data

@pytest.mark.asyncio
async def test_update_ingredient(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    # Create ingredient first
    payload = {
        "name": "Pepper",
        "unit": "kg",
        "stock_level": 2.0,
        "reorder_point": 0.5,
        "unit_cost": 2.00
    }
    res_create = await client.post("/inventory/", json=payload, headers=headers)
    ing_id = res_create.json()["id"]
    
    # Update unit_cost and category
    update_payload = {
        "unit_cost": 5.00,
        "category": "Spice"
    }
    res_update = await client.put(f"/inventory/{ing_id}", json=update_payload, headers=headers)
    assert res_update.status_code == 200
    data = res_update.json()
    assert data["unit_cost"] == 5.00
    assert data["category"] == "Spice"
    assert data["name"] == "Pepper" # Ensure original field is unmodified

@pytest.mark.asyncio
async def test_update_ingredient_security(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create a base ingredient
    payload = {
        "name": "Sugar",
        "unit": "kg",
        "stock_level": 10.0,
        "unit_cost": 1.00
    }
    res_create = await client.post("/inventory/", json=payload, headers=headers)
    ing_id = res_create.json()["id"]

    # 2. Attempt to bypass stock adjustment using the PUT endpoint
    malicious_payload = {
        "stock_level": 999.0
    }
    res_malicious = await client.put(f"/inventory/{ing_id}", json=malicious_payload, headers=headers)
    assert res_malicious.status_code == 200
    # Because 'stock_level' is not in IngredientUpdate schema, Pydantic ignores it.
    assert res_malicious.json()["stock_level"] == 10.0

    # 3. Attempt to set negative unit cost
    negative_cost_payload = {
        "unit_cost": -5.00
    }
    res_negative = await client.put(f"/inventory/{ing_id}", json=negative_cost_payload, headers=headers)
    assert res_negative.status_code == 422 # Unprocessable Entity due to Field(ge=0.0)
