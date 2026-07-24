import pytest
import asyncio
from alembic.config import Config
from alembic import command
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
import pytest_asyncio
import sqlalchemy as sa

TEST_DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite_test"

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_migration_db():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    sessionmaker = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with sessionmaker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    app.state.limiter.enabled = False

    # Reset test database schema cleanly
    async with engine.begin() as conn:
        await conn.execute(sa.text("DROP SCHEMA public CASCADE;"))
        await conn.execute(sa.text("CREATE SCHEMA public;"))

    # Execute Alembic upgrade head against test DB
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, command.upgrade, alembic_cfg, "head")

    yield

    await engine.dispose()

@pytest.mark.asyncio
async def test_migration_schema_allows_multiple_super_admins():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        # 1. Execute initial setup
        setup_res = await ac.post("/auth/setup", json={
            "name": "Founding Admin",
            "username": "founding_admin",
            "password": "supersecurepassword123"
        })
        assert setup_res.status_code == 200, f"Initial setup failed: {setup_res.text}"
        assert setup_res.json()["is_super_admin"] is True

        # 2. Login as founding admin
        login_res = await ac.post("/auth/token", data={"username": "founding_admin", "password": "supersecurepassword123"})
        assert login_res.status_code == 200
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # 3. Create second Super-Admin via /manager/staff
        second_sa_res = await ac.post("/manager/staff", json={
            "name": "Second Super Admin",
            "username": "second_sa",
            "password": "anotherpassword123",
            "role": "Manager",
            "is_super_admin": True
        }, headers=headers)

        assert second_sa_res.status_code == 200, f"Failed to create second super admin under Alembic schema: {second_sa_res.text}"
        data = second_sa_res.json()
        assert data["username"] == "second_sa"
        assert data["is_super_admin"] is True

@pytest.mark.asyncio
async def test_migration_schema_system_config_table_integrity():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    async with engine.connect() as conn:
        # Verify system_config table exists in Alembic schema
        res = await conn.execute(sa.text("SELECT COUNT(*) FROM system_config"))
        count = res.scalar()
        assert count == 0

    await engine.dispose()

@pytest.mark.asyncio
async def test_migration_schema_setup_concurrency_race_condition():
    # Dispatch 5 simultaneous /auth/setup requests against a clean Alembic-migrated DB
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
    assert sorted(status_codes) == [200, 400, 400, 400, 400], f"Expected 1 success and 4 rejections under Alembic schema, got {status_codes}"

