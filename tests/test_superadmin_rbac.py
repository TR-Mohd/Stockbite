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
from jose import jwt

TEST_DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite_test"

@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture(scope="session")
async def test_sessionmaker(test_engine):
    yield async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

@pytest_asyncio.fixture(scope="function", autouse=True)
async def clean_db(test_engine, test_sessionmaker):
    async def override_get_db():
        async with test_sessionmaker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.state.limiter.enabled = False

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)

    yield

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_setup_status_on_empty_db(client):
    res = await client.get("/auth/setup-status")
    assert res.status_code == 200
    assert res.json() == {"setup_required": True}

@pytest.mark.asyncio
async def test_initial_setup_success(client):
    payload = {
        "name": "Founding Admin",
        "username": "founding_admin",
        "password": "supersecurepassword123",
        "email": "admin@stockbite.com"
    }
    res = await client.post("/auth/setup", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["username"] == "founding_admin"
    assert data["role"] == "Manager"
    assert data["is_super_admin"] is True

    # Confirm setup-status now returns False
    res_status = await client.get("/auth/setup-status")
    assert res_status.json() == {"setup_required": False}

@pytest.mark.asyncio
async def test_initial_setup_password_min_length(client):
    # Short password (< 8 chars) should fail validation
    payload = {
        "name": "Admin Short",
        "username": "admin_short",
        "password": "123"
    }
    res = await client.post("/auth/setup", json=payload)
    assert res.status_code == 422

@pytest.mark.asyncio
async def test_initial_setup_rejected_when_user_exists(client):
    # Setup first user
    payload = {
        "name": "Founding Admin",
        "username": "founding_admin",
        "password": "supersecurepassword123"
    }
    res1 = await client.post("/auth/setup", json=payload)
    assert res1.status_code == 200

    # Second setup attempt should be rejected with 400
    payload2 = {
        "name": "Second Admin",
        "username": "second_admin",
        "password": "anotherpassword123"
    }
    res2 = await client.post("/auth/setup", json=payload2)
    assert res2.status_code == 400
    assert "Initial setup has already been completed" in res2.json()["detail"]

@pytest.mark.asyncio
async def test_initial_setup_concurrency_race_condition(test_engine, test_sessionmaker):
    # Dispatch 5 simultaneous /auth/setup requests against a clean DB
    async def make_setup_request(idx):
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
            return await ac.post("/auth/setup", json={
                "name": f"Admin {idx}",
                "username": f"admin_{idx}",
                "password": f"password123_{idx}"
            })

    results = await asyncio.gather(*[make_setup_request(i) for i in range(5)])
    status_codes = [r.status_code for r in results]
    successes = [r for r in results if r.status_code == 200]
    rejections = [r for r in results if r.status_code == 400]

    assert len(successes) == 1, f"Expected exactly 1 setup success, got {len(successes)}"
    assert len(rejections) == 4, f"Expected exactly 4 HTTP 400 rejections, got {len(rejections)}"
    assert sorted(status_codes) == [200, 400, 400, 400, 400], f"Expected exactly 4 HTTP 400 rejections and 1 HTTP 200 success, got {status_codes}"

@pytest.mark.asyncio
async def test_last_super_admin_delete_and_deactivate_protection(client, test_sessionmaker):
    # 1. Setup initial sole super admin (sa1)
    setup_res = await client.post("/auth/setup", json={
        "name": "Root Admin",
        "username": "root_admin",
        "password": "rootpassword123"
    })
    assert setup_res.status_code == 200
    sa1_id = setup_res.json()["id"]

    # Login as sa1
    login_res = await client.post("/auth/token", data={"username": "root_admin", "password": "rootpassword123"})
    sa1_token = login_res.json()["access_token"]
    sa1_headers = {"Authorization": f"Bearer {sa1_token}"}

    # 2. sa1 creates a standard Manager (std_mgr)
    mgr_res = await client.post("/manager/staff", json={
        "name": "Std Manager",
        "username": "std_mgr",
        "password": "password123",
        "role": "Manager"
    }, headers=sa1_headers)
    assert mgr_res.status_code == 200
    std_mgr_id = mgr_res.json()["id"]

    # Login as std_mgr
    login_mgr = await client.post("/auth/token", data={"username": "std_mgr", "password": "password123"})
    mgr_headers = {"Authorization": f"Bearer {login_mgr.json()['access_token']}"}

    # 3. Standard Manager attempts to delete Super-Admin -> fails with 403
    del_by_mgr = await client.delete(f"/manager/staff/{sa1_id}", headers=mgr_headers)
    assert del_by_mgr.status_code == 403
    assert "Only Super-Admins can delete managers" in del_by_mgr.json()["detail"]

    # 4. Super-Admin attempts to deactivate self (the sole Super-Admin) -> fails with 400
    deact_self = await client.put(f"/manager/staff/{sa1_id}/toggle-status", headers=sa1_headers)
    assert deact_self.status_code == 400

    # 5. Super-Admin attempts to delete self -> fails with 403 (cannot delete self)
    del_self = await client.delete(f"/manager/staff/{sa1_id}", headers=sa1_headers)
    assert del_self.status_code == 403

@pytest.mark.asyncio
async def test_setup_and_manager_created_ids_are_sequential(client):
    # 1. Create founding admin via /auth/setup
    setup_res = await client.post("/auth/setup", json={
        "name": "Founding Admin",
        "username": "founding_admin",
        "password": "supersecurepassword123",
        "email": "admin@stockbite.com"
    })
    assert setup_res.status_code == 200
    admin_id = setup_res.json()["id"]

    # 2. Login as founding admin
    login_res = await client.post("/auth/token", data={"username": "founding_admin", "password": "supersecurepassword123"})
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create second Manager via /manager/staff
    mgr_res = await client.post("/manager/staff", json={
        "name": "Second Manager",
        "username": "second_mgr",
        "password": "password123",
        "role": "Manager"
    }, headers=headers)
    assert mgr_res.status_code == 200
    mgr_id = mgr_res.json()["id"]

    # 4. Assert both IDs follow the same structured pattern and are strictly sequential
    admin_seq = int(admin_id[-3:])
    mgr_seq = int(mgr_id[-3:])
    assert mgr_seq == admin_seq + 1, f"Expected sequential IDs, got admin_id={admin_id} and mgr_id={mgr_id}"



