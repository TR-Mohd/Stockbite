import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.future import select
from app.models import User, RoleEnum, Ingredient, AuditLog
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
async def test_adjust_stock_stale_frontend(client, token):
    """
    Test that the /adjust endpoint correctly uses the backend's current stock
    to compute the delta, ignoring any stale state implied by the frontend.
    """
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create an ingredient with stock 10
    create_response = await client.post("/inventory/", json={
        "name": "Test Stale State Item",
        "unit": "kg",
        "stock_level": 10.0,
        "reorder_point": 5.0,
        "category": "Raw Meat",
        "unit_cost": 2.5
    }, headers=headers)
    assert create_response.status_code == 201
    ingredient_id = create_response.json()["id"]

    # 2. Simulate a frontend that thinks the stock is 0, and wants to set it to 15.
    # The frontend sends `new_stock_level = 15`. 
    # If the backend is correct, it will compute delta = 15 - 10 = 5.
    # It will then add 5 to the stock, making it exactly 15.
    # If the backend incorrectly trusted a frontend delta of 15 (15 - 0), 
    # the stock would become 10 + 15 = 25.
    
    response = await client.post(
        f"/inventory/{ingredient_id}/adjust",
        json={
            "new_stock_level": 15.0,
            "reason": "Correcting stale state bug"
        },
        headers=headers
    )
    
    assert response.status_code == 200
    data = response.json()
    assert float(data["stock_level"]) == 15.0  # Must be exactly what was requested
    
    # 3. Verify the AuditLog delta
    # Since we don't have a dedicated audit endpoint to read specific logs for an item without filtering,
    # we can check it via a separate query if needed, but the response stock_level is the primary proof.
    # To verify the delta, we will query the DB directly.
    
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    
    async with TestSessionLocal() as session:
        result = await session.execute(
            select(AuditLog)
            .where(AuditLog.resource == f"Ingredient:Test Stale State Item")
            .where(AuditLog.action == "Stock Adjustment")
            .order_by(AuditLog.timestamp.desc())
        )
        audit_log = result.scalars().first()
        assert audit_log is not None
        print(f"\nAuditLog Evidence -> old_stock: {audit_log.details['old_stock']}, new_stock: {audit_log.details['new_stock']}, computed delta: {audit_log.details['delta']}")
        assert audit_log.details["old_stock"] == 10.0
        assert audit_log.details["new_stock"] == 15.0
        assert audit_log.details["delta"] == 5.0  # The delta should be exactly 5, not 15
