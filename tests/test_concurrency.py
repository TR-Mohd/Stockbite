import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models import User, RoleEnum, Ingredient
from app.auth import get_password_hash, create_access_token
from sqlalchemy.pool import NullPool
import pytest_asyncio

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
async def test_inventory_adjust_concurrency(client, token):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create an ingredient
    payload = {
        "name": "Race Condition Sugar",
        "unit": "kg",
        "stock_level": 10.0,
        "reorder_point": 5.0,
        "category": "Dry Goods",
        "unit_cost": 2.00
    }
    res_create = await client.post("/inventory/", json=payload, headers=headers)
    assert res_create.status_code == 201
    ing_id = res_create.json()["id"]

    # Fire 50 concurrent stock adjustments
    async def make_req(i):
        url = f"/inventory/{ing_id}/adjust?amount=1&reason=Race{i}"
        return await client.post(url, headers=headers)
        
    responses = await asyncio.gather(*(make_req(i) for i in range(50)))
    
    status_codes = [resp.status_code for resp in responses]
    
    # Some should succeed, but many should fail with a 409 conflict
    success_count = status_codes.count(200)
    conflict_count = status_codes.count(409)
    
    assert success_count > 0, "At least one request should succeed"
    assert conflict_count > 0, "Concurrent requests should result in 409 conflicts due to StaleDataError"
    
    # No 500s should have happened
    for code in status_codes:
        assert code in (200, 409), f"Unexpected status code: {code}"
