import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models import User, RoleEnum
from app.auth import get_password_hash, create_access_token, SECRET_KEY, ALGORITHM
from sqlalchemy.pool import NullPool
import pytest_asyncio
from datetime import datetime, timedelta, timezone
from jose import jwt

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
        user = User(
            name="test_cashier",
            username="test_cashier",
            role=RoleEnum.Cashier,
            hashed_password=get_password_hash("pass"),
            is_active=True
        )
        session.add(user)
        await session.commit()
    
    yield
    
    # We could theoretically teardown here, but drop_all next run handles it

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac
        
def generate_token(username, token_type, expires_delta=None):
    to_encode = {"sub": username, "type": token_type}
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": int(expire.timestamp())})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@pytest.mark.asyncio
async def test_refresh_token_success(client):
    refresh_token = generate_token("test_cashier", "refresh", timedelta(hours=24))
    res = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    
    # Verify new token claims
    payload = jwt.decode(data["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["sub"] == "test_cashier"
    assert payload["role"] == RoleEnum.Cashier.value
    assert payload.get("type") is None # Access token shouldn't have type 'refresh'

@pytest.mark.asyncio
async def test_refresh_token_expired(client):
    # Expired token (delta negative)
    expired_token = generate_token("test_cashier", "refresh", timedelta(minutes=-5))
    res = await client.post("/auth/refresh", json={"refresh_token": expired_token})
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_refresh_token_invalid_type(client):
    # Pass an access token to the refresh endpoint
    access_token = create_access_token(data={"sub": "test_cashier", "role": RoleEnum.Cashier.value})
    res = await client.post("/auth/refresh", json={"refresh_token": access_token})
    assert res.status_code == 401
    
@pytest.mark.asyncio
async def test_refresh_token_role_rederivation(client):
    # 1. Generate refresh token while user is Cashier
    refresh_token = generate_token("test_cashier", "refresh", timedelta(hours=24))
    
    # 2. Change user's role to Manager in DB directly
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)
    
    from sqlalchemy.future import select
    async with TestSessionLocal() as session:
        result = await session.execute(select(User).where(User.username == "test_cashier"))
        user = result.scalars().first()
        user.role = RoleEnum.Manager
        await session.commit()
        
    # 3. Refresh the token
    res = await client.post("/auth/refresh", json={"refresh_token": refresh_token})
    assert res.status_code == 200
    data = res.json()
    
    # 4. Verify new token has Manager role
    payload = jwt.decode(data["access_token"], SECRET_KEY, algorithms=[ALGORITHM])
    assert payload["role"] == RoleEnum.Manager.value
