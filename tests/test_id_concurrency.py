import pytest
import asyncio
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models import User, RoleEnum, Supplier, Ingredient, PurchaseOrder, IDSequence
from app.auth import get_password_hash, create_access_token
from app.services import get_next_id_sequence
from sqlalchemy.pool import NullPool
import pytest_asyncio

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

@pytest_asyncio.fixture
async def manager_token(test_sessionmaker):
    async with test_sessionmaker() as session:
        mgr = User(
            id="EMP-MGR-26100",
            name="Manager User",
            username="mgr_user",
            role=RoleEnum.Manager,
            hashed_password=get_password_hash("password123"),
            is_super_admin=True
        )
        session.add(mgr)
        await session.commit()
    return create_access_token(data={"sub": "mgr_user", "role": "Manager", "is_super_admin": True})

@pytest.mark.asyncio
async def test_employee_id_concurrency(client, manager_token):
    headers = {"Authorization": f"Bearer {manager_token}"}

    async def create_staff_req(i):
        return await client.post("/manager/staff", json={
            "name": f"Staff {i}",
            "username": f"staff_{i}",
            "password": "password123",
            "role": "Cashier"
        }, headers=headers)

    results = await asyncio.gather(*[create_staff_req(i) for i in range(10)])
    status_codes = [r.status_code for r in results]

    assert all(code == 200 for code in status_codes), f"Expected all status 200, got: {status_codes}"

    created_ids = [r.json()["id"] for r in results]
    assert len(created_ids) == 10
    assert len(set(created_ids)) == 10, f"Duplicate IDs generated: {created_ids}"

    seq_numbers = sorted([int(uid[-3:]) for uid in created_ids])
    assert seq_numbers == list(range(101, 111)), f"Expected sequence 101..110, got: {seq_numbers}"


@pytest.mark.asyncio
async def test_supplier_id_concurrency(client, manager_token):
    headers = {"Authorization": f"Bearer {manager_token}"}

    async def create_supplier_req(i):
        return await client.post("/suppliers/", json={
            "name": f"Supplier {i}",
            "specialization": "Produce",
            "region": "NAT"
        }, headers=headers)

    results = await asyncio.gather(*[create_supplier_req(i) for i in range(10)])
    status_codes = [r.status_code for r in results]

    assert all(code == 200 for code in status_codes), f"Expected all status 200, got: {status_codes}"

    created_ids = [r.json()["id"] for r in results]
    assert len(created_ids) == 10
    assert len(set(created_ids)) == 10, f"Duplicate supplier IDs: {created_ids}"

    seq_numbers = sorted([int(sid[-3:]) for sid in created_ids])
    assert seq_numbers == list(range(100, 110)), f"Expected sequence 100..109, got: {seq_numbers}"


@pytest.mark.asyncio
async def test_purchase_order_id_concurrency(client, manager_token, test_sessionmaker):
    headers = {"Authorization": f"Bearer {manager_token}"}

    async with test_sessionmaker() as session:
        sup = Supplier(id="SUP-NAT-26100", name="Test Supplier")
        ing = Ingredient(id="ING-001", name="Coffee Beans", unit="kg", stock_level=10.0, reorder_point=5.0, unit_cost=10.0)
        session.add(sup)
        session.add(ing)
        await session.commit()

    async def create_po_req(i):
        payload = {
            "items": [
                {
                    "ingredient_id": "ING-001",
                    "ordered_quantity": 5.0,
                    "unit_cost": 10.0,
                }
            ],
            "notes": f"Test{i}",
        }
        return await client.post("/suppliers/SUP-NAT-26100/po", json=payload, headers=headers)

    results = await asyncio.gather(*[create_po_req(i) for i in range(10)])
    status_codes = [r.status_code for r in results]

    assert all(code == 200 for code in status_codes), f"Expected all status 200, got: {status_codes}"

    created_ids = [r.json()["id"] for r in results]
    assert len(created_ids) == 10
    assert len(set(created_ids)) == 10, f"Duplicate PO IDs: {created_ids}"

    seq_numbers = sorted([int(poid.split('-')[-1]) for poid in created_ids])
    assert seq_numbers == list(range(1, 11)), f"Expected sequence 1..10, got: {seq_numbers}"


@pytest.mark.asyncio
async def test_yearly_and_monthly_sequence_reset(test_sessionmaker):
    async with test_sessionmaker() as session:
        val_25 = await get_next_id_sequence(
            db=session,
            key="EMP-25",
            model=User,
            prefix_pattern="EMP-%-25%",
            default_start_val=100,
            extract_seq_fn=lambda mid: int(mid[-3:])
        )
        assert val_25 == 100

        val_26 = await get_next_id_sequence(
            db=session,
            key="EMP-26",
            model=User,
            prefix_pattern="EMP-%-26%",
            default_start_val=100,
            extract_seq_fn=lambda mid: int(mid[-3:])
        )
        assert val_26 == 100

        val_25_next = await get_next_id_sequence(
            db=session,
            key="EMP-25",
            model=User,
            prefix_pattern="EMP-%-25%",
            default_start_val=100,
            extract_seq_fn=lambda mid: int(mid[-3:])
        )
        assert val_25_next == 101

        po_2607 = await get_next_id_sequence(
            db=session,
            key="PO-2607",
            model=PurchaseOrder,
            prefix_pattern="PO-2607-%",
            default_start_val=1,
            extract_seq_fn=lambda mid: int(mid.split('-')[-1])
        )
        assert po_2607 == 1

        po_2608 = await get_next_id_sequence(
            db=session,
            key="PO-2608",
            model=PurchaseOrder,
            prefix_pattern="PO-2608-%",
            default_start_val=1,
            extract_seq_fn=lambda mid: int(mid.split('-')[-1])
        )
        assert po_2608 == 1
