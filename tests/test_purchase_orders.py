import pytest
import asyncio
from decimal import Decimal
from httpx import AsyncClient, ASGITransport
from sqlalchemy.future import select
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
import pytest_asyncio

from app.main import app
from app.database import Base, get_db
from app.auth import get_password_hash
from app.models import (
    User,
    RoleEnum,
    Supplier,
    Ingredient,
    PurchaseOrder,
    PurchaseOrderItem,
    POStatusEnum,
)

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
            email="mgr@stockbite.com",
            name="Manager User",
            username="mgr_user",
            role=RoleEnum.Manager,
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_super_admin=True,
        )
        session.add(mgr)
        await session.commit()

    from app.auth import create_access_token
    return create_access_token({"sub": "mgr_user", "role": "Manager", "is_super_admin": True})


@pytest.mark.asyncio
async def test_po_receipt_wac_calculation(client, manager_token, test_sessionmaker):
    headers = {"Authorization": f"Bearer {manager_token}"}
    async with test_sessionmaker() as session:
        sup = Supplier(id="SUP-WAC-100", name="WAC Supplier")
        ing1 = Ingredient(id="ING-WAC-1", name="Flour", unit="kg", stock_level=10.0, reorder_point=5.0, unit_cost=10.00)
        ing2 = Ingredient(id="ING-WAC-2", name="Sugar", unit="kg", stock_level=5.0, reorder_point=2.0, unit_cost=12.00)
        ing3 = Ingredient(id="ING-WAC-3", name="Salt", unit="kg", stock_level=10.0, reorder_point=3.0, unit_cost=10.00)
        session.add_all([sup, ing1, ing2, ing3])
        await session.commit()

    # Create Draft PO with 3 items
    create_payload = {
        "items": [
            {"ingredient_id": "ING-WAC-1", "ordered_quantity": 10.0, "unit_cost": 20.00},
            {"ingredient_id": "ING-WAC-2", "ordered_quantity": 15.0, "unit_cost": 16.00},
            {"ingredient_id": "ING-WAC-3", "ordered_quantity": 20.0, "unit_cost": 12.50},
        ],
        "notes": "WAC Test PO",
    }
    res_create = await client.post("/suppliers/SUP-WAC-100/po", json=create_payload, headers=headers)
    assert res_create.status_code == 200, res_create.text
    po_data = res_create.json()
    po_id = po_data["id"]

    # Send PO
    res_send = await client.post(f"/purchase-orders/{po_id}/send", headers=headers)
    assert res_send.status_code == 200, res_send.text

    # Receive PO
    items_map = {item["ingredient_id"]: item["id"] for item in po_data["items"]}
    receive_payload = {
        "items": [
            {"item_id": items_map["ING-WAC-1"], "actual_quantity": 10.0, "actual_unit_cost": 20.00},
            {"item_id": items_map["ING-WAC-2"], "actual_quantity": 15.0, "actual_unit_cost": 16.00},
            {"item_id": items_map["ING-WAC-3"], "actual_quantity": 20.0, "actual_unit_cost": 12.50},
        ]
    }
    res_receive = await client.post(f"/purchase-orders/{po_id}/receive", json=receive_payload, headers=headers)
    assert res_receive.status_code == 200, res_receive.text

    # Verify WAC math and stock levels in DB
    async with test_sessionmaker() as session:
        res1 = await session.execute(select(Ingredient).where(Ingredient.id == "ING-WAC-1"))
        ing1_db = res1.scalars().first()
        assert ing1_db.stock_level == 20.0
        assert float(ing1_db.unit_cost) == 15.00

        res2 = await session.execute(select(Ingredient).where(Ingredient.id == "ING-WAC-2"))
        ing2_db = res2.scalars().first()
        assert ing2_db.stock_level == 20.0
        assert float(ing2_db.unit_cost) == 15.00

        res3 = await session.execute(select(Ingredient).where(Ingredient.id == "ING-WAC-3"))
        ing3_db = res3.scalars().first()
        assert ing3_db.stock_level == 30.0
        assert float(ing3_db.unit_cost) == 11.67


@pytest.mark.asyncio
async def test_po_undo_receive_wac_reversal(client, manager_token, test_sessionmaker):
    headers = {"Authorization": f"Bearer {manager_token}"}
    async with test_sessionmaker() as session:
        sup = Supplier(id="SUP-REV-100", name="Rev Supplier")
        ing = Ingredient(id="ING-REV-1", name="Butter", unit="kg", stock_level=10.0, reorder_point=5.0, unit_cost=10.00)
        session.add_all([sup, ing])
        await session.commit()

    create_payload = {
        "items": [
            {"ingredient_id": "ING-REV-1", "ordered_quantity": 10.0, "unit_cost": 20.00}
        ],
        "notes": "Undo test PO"
    }
    res_create = await client.post("/suppliers/SUP-REV-100/po", json=create_payload, headers=headers)
    assert res_create.status_code == 200, res_create.text
    po_data = res_create.json()
    po_id = po_data["id"]
    item_id = po_data["items"][0]["id"]

    res_send = await client.post(f"/purchase-orders/{po_id}/send", headers=headers)
    assert res_send.status_code == 200

    receive_payload = {
        "items": [
            {"item_id": item_id, "actual_quantity": 10.0, "actual_unit_cost": 20.00}
        ]
    }
    res_receive = await client.post(f"/purchase-orders/{po_id}/receive", json=receive_payload, headers=headers)
    assert res_receive.status_code == 200

    # Verify received cost/stock
    async with test_sessionmaker() as session:
        res = await session.execute(select(Ingredient).where(Ingredient.id == "ING-REV-1"))
        ing_db = res.scalars().first()
        assert ing_db.stock_level == 20.0
        assert float(ing_db.unit_cost) == 15.00

    # Undo receive
    res_undo = await client.post(f"/purchase-orders/{po_id}/undo-receive", headers=headers)
    assert res_undo.status_code == 200, res_undo.text
    assert res_undo.json()["status"] == POStatusEnum.Sent.value

    # Verify restored cost/stock
    async with test_sessionmaker() as session:
        res = await session.execute(select(Ingredient).where(Ingredient.id == "ING-REV-1"))
        ing_db = res.scalars().first()
        assert ing_db.stock_level == 10.0
        assert float(ing_db.unit_cost) == 10.00

        res_item = await session.execute(select(PurchaseOrderItem).where(PurchaseOrderItem.id == item_id))
        item_db = res_item.scalars().first()
        assert item_db.received_at is None
        assert item_db.ingredient_unit_cost_before_receipt is None
        assert item_db.actual_received_quantity is None


@pytest.mark.asyncio
async def test_po_undo_receive_blocked_by_more_recent_receipt(client, manager_token, test_sessionmaker):
    headers = {"Authorization": f"Bearer {manager_token}"}
    async with test_sessionmaker() as session:
        sup = Supplier(id="SUP-BLK-100", name="Block Supplier")
        ing = Ingredient(id="ING-BLK-1", name="Cream", unit="kg", stock_level=10.0, reorder_point=5.0, unit_cost=10.00)
        session.add_all([sup, ing])
        await session.commit()

    # Create & receive PO-A
    res_a = await client.post(
        "/suppliers/SUP-BLK-100/po",
        json={"items": [{"ingredient_id": "ING-BLK-1", "ordered_quantity": 10.0, "unit_cost": 10.00}]},
        headers=headers,
    )
    po_a = res_a.json()
    await client.post(f"/purchase-orders/{po_a['id']}/send", headers=headers)
    await client.post(
        f"/purchase-orders/{po_a['id']}/receive",
        json={"items": [{"item_id": po_a["items"][0]["id"], "actual_quantity": 10.0, "actual_unit_cost": 20.00}]},
        headers=headers,
    )

    # Create & receive PO-B (later receipt for same ingredient)
    res_b = await client.post(
        "/suppliers/SUP-BLK-100/po",
        json={"items": [{"ingredient_id": "ING-BLK-1", "ordered_quantity": 10.0, "unit_cost": 10.00}]},
        headers=headers,
    )
    po_b = res_b.json()
    await client.post(f"/purchase-orders/{po_b['id']}/send", headers=headers)
    await client.post(
        f"/purchase-orders/{po_b['id']}/receive",
        json={"items": [{"item_id": po_b["items"][0]["id"], "actual_quantity": 10.0, "actual_unit_cost": 30.00}]},
        headers=headers,
    )

    # Verify WAC after PO-B: stock=30.0, wac=20.00
    async with test_sessionmaker() as session:
        res = await session.execute(select(Ingredient).where(Ingredient.id == "ING-BLK-1"))
        ing_before = res.scalars().first()
        assert ing_before.stock_level == 30.0
        assert float(ing_before.unit_cost) == 20.00

    # Attempt to undo PO-A -> must be blocked
    res_undo_a = await client.post(f"/purchase-orders/{po_a['id']}/undo-receive", headers=headers)
    assert res_undo_a.status_code == 400
    assert "a later receipt exists for ingredient ING-BLK-1" in res_undo_a.json()["detail"]

    # Verify Ingredient stock & WAC unchanged
    async with test_sessionmaker() as session:
        res = await session.execute(select(Ingredient).where(Ingredient.id == "ING-BLK-1"))
        ing_after = res.scalars().first()
        assert ing_after.stock_level == 30.0
        assert float(ing_after.unit_cost) == 20.00


@pytest.mark.asyncio
async def test_po_receipt_concurrency(client, manager_token, test_sessionmaker):
    headers = {"Authorization": f"Bearer {manager_token}"}
    async with test_sessionmaker() as session:
        sup = Supplier(id="SUP-CONC-100", name="Conc Supplier")
        ing = Ingredient(id="ING-CONC-1", name="Milk", unit="kg", stock_level=100.0, reorder_point=10.0, unit_cost=10.00)
        session.add_all([sup, ing])
        await session.commit()

    # Create & send PO1 (100 units @ 20.00)
    res1 = await client.post(
        "/suppliers/SUP-CONC-100/po",
        json={"items": [{"ingredient_id": "ING-CONC-1", "ordered_quantity": 100.0, "unit_cost": 20.00}]},
        headers=headers,
    )
    po1 = res1.json()
    await client.post(f"/purchase-orders/{po1['id']}/send", headers=headers)

    # Create & send PO2 (100 units @ 40.00)
    res2 = await client.post(
        "/suppliers/SUP-CONC-100/po",
        json={"items": [{"ingredient_id": "ING-CONC-1", "ordered_quantity": 100.0, "unit_cost": 40.00}]},
        headers=headers,
    )
    po2 = res2.json()
    await client.post(f"/purchase-orders/{po2['id']}/send", headers=headers)

    async def receive_po(po, cost):
        return await client.post(
            f"/purchase-orders/{po['id']}/receive",
            json={"items": [{"item_id": po["items"][0]["id"], "actual_quantity": 100.0, "actual_unit_cost": cost}]},
            headers=headers,
        )

    results = await asyncio.gather(
        receive_po(po1, 20.00),
        receive_po(po2, 40.00),
    )
    assert all(r.status_code == 200 for r in results), [r.text for r in results]

    # Check final stock and WAC
    async with test_sessionmaker() as session:
        res = await session.execute(select(Ingredient).where(Ingredient.id == "ING-CONC-1"))
        ing_final = res.scalars().first()
        assert ing_final.stock_level == 300.0
        assert float(ing_final.unit_cost) == 23.33


@pytest.mark.asyncio
async def test_po_receive_missing_item_fails(client, manager_token, test_sessionmaker):
    headers = {"Authorization": f"Bearer {manager_token}"}
    async with test_sessionmaker() as session:
        sup = Supplier(id="SUP-MISS-100", name="Miss Supplier")
        ing1 = Ingredient(id="ING-MISS-1", name="Apple", unit="kg", stock_level=10.0, reorder_point=2.0, unit_cost=5.00)
        ing2 = Ingredient(id="ING-MISS-2", name="Banana", unit="kg", stock_level=10.0, reorder_point=2.0, unit_cost=3.00)
        session.add_all([sup, ing1, ing2])
        await session.commit()

    res_create = await client.post(
        "/suppliers/SUP-MISS-100/po",
        json={
            "items": [
                {"ingredient_id": "ING-MISS-1", "ordered_quantity": 10.0, "unit_cost": 5.00},
                {"ingredient_id": "ING-MISS-2", "ordered_quantity": 10.0, "unit_cost": 3.00},
            ]
        },
        headers=headers,
    )
    po_data = res_create.json()
    po_id = po_data["id"]
    await client.post(f"/purchase-orders/{po_id}/send", headers=headers)

    # Submit receive request missing second item
    res_receive = await client.post(
        f"/purchase-orders/{po_id}/receive",
        json={"items": [{"item_id": po_data["items"][0]["id"], "actual_quantity": 10.0, "actual_unit_cost": 5.00}]},
        headers=headers,
    )
    assert res_receive.status_code == 400
    assert "Receive request must include all line items" in res_receive.json()["detail"]

    # Verify PO status unchanged
    res_get = await client.get(f"/purchase-orders/{po_id}", headers=headers)
    assert res_get.json()["status"] == POStatusEnum.Sent.value


@pytest.mark.asyncio
async def test_po_create_invalid_ingredient_rollback(client, manager_token, test_sessionmaker):
    headers = {"Authorization": f"Bearer {manager_token}"}
    async with test_sessionmaker() as session:
        sup = Supplier(id="SUP-RBK-100", name="Rbk Supplier")
        ing1 = Ingredient(id="ING-RBK-1", name="Valid Ing", unit="kg", stock_level=10.0, reorder_point=2.0, unit_cost=5.00)
        session.add_all([sup, ing1])
        await session.commit()

    res_create = await client.post(
        "/suppliers/SUP-RBK-100/po",
        json={
            "items": [
                {"ingredient_id": "ING-RBK-1", "ordered_quantity": 10.0, "unit_cost": 5.00},
                {"ingredient_id": "ING-NONEXISTENT", "ordered_quantity": 10.0, "unit_cost": 3.00},
            ]
        },
        headers=headers,
    )
    assert res_create.status_code == 404
    assert "Ingredient ING-NONEXISTENT not found" in res_create.json()["detail"]

    # Verify no PO or POI rows were created
    async with test_sessionmaker() as session:
        res_po = await session.execute(select(PurchaseOrder))
        pos = res_po.scalars().all()
        assert len(pos) == 0

        res_poi = await session.execute(select(PurchaseOrderItem))
        pois = res_poi.scalars().all()
        assert len(pois) == 0
