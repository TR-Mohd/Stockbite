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

@pytest.mark.asyncio
async def test_migration_schema_purchase_order_items_backfill():
    alembic_cfg = Config("alembic.ini")
    alembic_cfg.set_main_option("sqlalchemy.url", TEST_DATABASE_URL)
    loop = asyncio.get_running_loop()

    # 1. Downgrade schema to previous head (f2b3c4d5e6f7) before purchase_order_items migration
    await loop.run_in_executor(None, command.downgrade, alembic_cfg, "f2b3c4d5e6f7")

    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    async with engine.begin() as conn:
        # 2. Insert test supplier, ingredient, and legacy purchase_order with old header columns
        await conn.execute(sa.text("""
            INSERT INTO suppliers (id, name, specialization, phone, email, address, contact_person, is_active)
            VALUES ('sup-test-1', 'Test Supplier', 'General', '12345', 'sup@test.com', '123 St', 'Bob', true);
        """))
        await conn.execute(sa.text("""
            INSERT INTO ingredients (id, name, stock_level, unit, reorder_point, category, unit_cost, last_updated, version_id)
            VALUES ('ing-test-100', 'Flour', 50.0, 'kg', 10.0, 'Dry', 4500.50, NOW(), 1);
        """))
        await conn.execute(sa.text("""
            INSERT INTO purchase_orders (id, supplier_id, ingredient_id, current_stock, reorder_point, suggested_quantity, actual_received_quantity, date, status, notes)
            VALUES ('po-legacy-1', 'sup-test-1', 'ing-test-100', 50.0, 10.0, 25.0, 25.0, NOW(), 'Received', 'Legacy PO note');
        """))

    # 3. Execute upgrade head to run c1a2b3d4e5f6
    await loop.run_in_executor(None, command.upgrade, alembic_cfg, "head")

    async with engine.connect() as conn:
        # 4. Verify legacy row still exists in purchase_orders table
        res_po = await conn.execute(sa.text("SELECT count(*) FROM purchase_orders WHERE id = 'po-legacy-1'"))
        assert res_po.scalar() == 1

        # 5. Verify old single-item columns no longer exist on purchase_orders
        res_cols = await conn.execute(sa.text("""
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'purchase_orders'
              AND column_name IN ('ingredient_id', 'current_stock', 'reorder_point', 'suggested_quantity', 'actual_received_quantity')
        """))
        assert len(res_cols.fetchall()) == 0

        # 6. Verify backfilled row in purchase_order_items
        res_item = await conn.execute(sa.text("""
            SELECT id, purchase_order_id, ingredient_id, current_stock, reorder_point,
                   suggested_quantity, actual_received_quantity, received_at,
                   unit_cost_at_time, ingredient_unit_cost_before_receipt
            FROM purchase_order_items WHERE purchase_order_id = 'po-legacy-1'
        """))
        row = res_item.mappings().first()
        assert row is not None, "Expected backfilled row in purchase_order_items"
        assert row["purchase_order_id"] == "po-legacy-1"
        assert row["ingredient_id"] == "ing-test-100"
        assert float(row["current_stock"]) == 50.0
        assert float(row["reorder_point"]) == 10.0
        assert float(row["suggested_quantity"]) == 25.0
        assert float(row["actual_received_quantity"]) == 25.0
        assert row["received_at"] is None
        assert float(row["unit_cost_at_time"]) == 4500.50
        assert row["ingredient_unit_cost_before_receipt"] is None

    await engine.dispose()


