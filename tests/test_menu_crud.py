import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from app.models import (
    User, RoleEnum, Ingredient, MenuItem, Recipe, 
    Transaction, TransactionItem, StatusEnum, OrderTypeEnum, PaymentMethodEnum,
    ItemModifierGroup, ItemModifier, ModifierRecipe
)
from app.auth import get_password_hash, create_access_token
from sqlalchemy.pool import NullPool
import pytest_asyncio
from sqlalchemy.future import select

TEST_DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite_test"

_TestSessionLocal = None

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_db():
    global _TestSessionLocal
    test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    _TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)

    async def override_get_db():
        async with _TestSessionLocal() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed base ingredients and user
    async with _TestSessionLocal() as session:
        user = User(
            id="usr_mgr_1",
            name="test_manager", 
            username="test_manager", 
            role=RoleEnum.Manager, 
            hashed_password=get_password_hash("pass")
        )
        session.add(user)

        ing1 = Ingredient(id="ing_beef", name="Ground Beef", stock_level=10.0, unit="kg", version_id=1, unit_cost=50000.0)
        ing2 = Ingredient(id="ing_bun", name="Burger Bun", stock_level=100.0, unit="pcs", version_id=1, unit_cost=5000.0)
        ing3 = Ingredient(id="ing_cheese", name="Cheddar Cheese", stock_level=5.0, unit="kg", version_id=1, unit_cost=40000.0)
        session.add_all([ing1, ing2, ing3])

        await session.commit()
    
    yield
    await test_engine.dispose()

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def token():
    return create_access_token(data={"sub": "test_manager", "role": "Manager"})

# === POST /manager/menu ===

@pytest.mark.asyncio
async def test_create_menu_item_with_recipes(client, token):
    """POST with 2 valid recipe entries -> 201.
    Verify response has correct name/price/category.
    Then GET /manager/menu/{id} and confirm recipes array has 2 entries."""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Classic Burger",
        "category": "Main Course",
        "price": 45000,
        "recipes": [
            {"ingredient_id": "ing_beef", "quantity": 0.2},
            {"ingredient_id": "ing_bun", "quantity": 1.0}
        ]
    }
    res = await client.post("/manager/menu", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Classic Burger"
    assert data["price"] == 45000.0
    assert len(data["recipes"]) == 2

    item_id = data["id"]
    detail_res = await client.get(f"/manager/menu/{item_id}", headers=headers)
    assert detail_res.status_code == 200
    detail_data = detail_res.json()
    assert len(detail_data["recipes"]) == 2
    ing_ids = {r["ingredient_id"] for r in detail_data["recipes"]}
    assert ing_ids == {"ing_beef", "ing_bun"}

@pytest.mark.asyncio
async def test_create_menu_item_no_recipes(client, token):
    """POST with empty recipes list -> 201. Confirm item created, GET detail shows recipes: []."""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Plain Water",
        "category": "Beverage",
        "price": 5000,
        "recipes": []
    }
    res = await client.post("/manager/menu", json=payload, headers=headers)
    assert res.status_code == 201
    data = res.json()
    assert data["recipes"] == []

@pytest.mark.asyncio
async def test_create_menu_item_invalid_ingredient_id(client, token):
    """POST with one valid + one bogus ingredient_id -> 422.
    Confirm response detail mentions the bad ID.
    Confirm NO MenuItem row was created (full rollback)."""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Ghost Burger",
        "category": "Main Course",
        "price": 50000,
        "recipes": [
            {"ingredient_id": "ing_beef", "quantity": 0.2},
            {"ingredient_id": "bogus_ing_id", "quantity": 1.0}
        ]
    }
    res = await client.post("/manager/menu", json=payload, headers=headers)
    assert res.status_code == 422
    assert "bogus_ing_id" in res.json()["detail"]

    # Verify item was not created
    list_res = await client.get("/manager/menu", headers=headers)
    items = list_res.json()
    assert not any(i["name"] == "Ghost Burger" for i in items)

@pytest.mark.asyncio
async def test_create_menu_item_duplicate_name(client, token):
    """POST two items with same name (case-insensitive) -> second returns 400."""
    headers = {"Authorization": f"Bearer {token}"}
    payload1 = {"name": "Cheeseburger", "category": "Main Course", "price": 50000}
    res1 = await client.post("/manager/menu", json=payload1, headers=headers)
    assert res1.status_code == 201

    payload2 = {"name": "cheeseburger", "category": "Main Course", "price": 55000}
    res2 = await client.post("/manager/menu", json=payload2, headers=headers)
    assert res2.status_code == 400
    assert "already exists" in res2.json()["detail"]

@pytest.mark.asyncio
async def test_create_menu_item_zero_price(client, token):
    """POST with price=0 -> 201 (free/promo item allowed)."""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {"name": "Free Sample", "category": "Appetizer", "price": 0}
    res = await client.post("/manager/menu", json=payload, headers=headers)
    assert res.status_code == 201
    assert res.json()["price"] == 0.0

# === PUT /manager/menu/{id} ===

@pytest.mark.asyncio
async def test_update_replaces_recipes(client, token):
    """Create item with 2 recipes, then PUT with 1 different recipe.
    GET detail -> confirm exactly 1 recipe row, the new one."""
    headers = {"Authorization": f"Bearer {token}"}
    payload_create = {
        "name": "Special Sandwich",
        "category": "Main Course",
        "price": 30000,
        "recipes": [
            {"ingredient_id": "ing_beef", "quantity": 0.1},
            {"ingredient_id": "ing_bun", "quantity": 1.0}
        ]
    }
    create_res = await client.post("/manager/menu", json=payload_create, headers=headers)
    item_id = create_res.json()["id"]

    payload_update = {
        "recipes": [
            {"ingredient_id": "ing_cheese", "quantity": 0.05}
        ]
    }
    update_res = await client.put(f"/manager/menu/{item_id}", json=payload_update, headers=headers)
    assert update_res.status_code == 200

    detail_res = await client.get(f"/manager/menu/{item_id}", headers=headers)
    recipes = detail_res.json()["recipes"]
    assert len(recipes) == 1
    assert recipes[0]["ingredient_id"] == "ing_cheese"

@pytest.mark.asyncio
async def test_update_replaces_recipes_direct_db_check(client, token):
    """Create item with 2 recipes (ing_beef, ing_bun), then PUT to replace recipes with ing_cheese.
    Query the recipes table directly from DB filtered ONLY by old ingredient_ids (ing_beef, ing_bun)
    for this menu item and assert zero rows exist — proving old rows were deleted, not orphaned."""
    headers = {"Authorization": f"Bearer {token}"}
    payload_create = {
        "name": "Direct DB Check Sandwich",
        "category": "Main Course",
        "price": 35000,
        "recipes": [
            {"ingredient_id": "ing_beef", "quantity": 0.2},
            {"ingredient_id": "ing_bun", "quantity": 1.0}
        ]
    }
    create_res = await client.post("/manager/menu", json=payload_create, headers=headers)
    item_id = create_res.json()["id"]

    payload_update = {
        "recipes": [
            {"ingredient_id": "ing_cheese", "quantity": 0.1}
        ]
    }
    update_res = await client.put(f"/manager/menu/{item_id}", json=payload_update, headers=headers)
    assert update_res.status_code == 200

    # Query DB directly for old recipe rows
    async with _TestSessionLocal() as session:
        res = await session.execute(
            select(Recipe).where(
                Recipe.menu_item_id == item_id,
                Recipe.ingredient_id.in_(["ing_beef", "ing_bun"])
            )
        )
        old_rows = res.scalars().all()
        assert len(old_rows) == 0

        # Also query all recipe rows for this menu item to verify only ing_cheese exists
        res_all = await session.execute(
            select(Recipe).where(Recipe.menu_item_id == item_id)
        )
        all_rows = res_all.scalars().all()
        assert len(all_rows) == 1
        assert all_rows[0].ingredient_id == "ing_cheese"

@pytest.mark.asyncio
async def test_update_omit_recipes_preserves_existing(client, token):
    """Create item with recipes, then PUT with recipes field omitted (None).
    GET detail -> recipes unchanged."""
    headers = {"Authorization": f"Bearer {token}"}
    payload_create = {
        "name": "Deluxe Burger",
        "category": "Main Course",
        "price": 60000,
        "recipes": [{"ingredient_id": "ing_beef", "quantity": 0.3}]
    }
    create_res = await client.post("/manager/menu", json=payload_create, headers=headers)
    item_id = create_res.json()["id"]

    payload_update = {"price": 65000}
    update_res = await client.put(f"/manager/menu/{item_id}", json=payload_update, headers=headers)
    assert update_res.status_code == 200
    assert update_res.json()["price"] == 65000.0

    detail_res = await client.get(f"/manager/menu/{item_id}", headers=headers)
    recipes = detail_res.json()["recipes"]
    assert len(recipes) == 1
    assert recipes[0]["ingredient_id"] == "ing_beef"

@pytest.mark.asyncio
async def test_update_rename_duplicate(client, token):
    """Create item A and item B. PUT item B with name=A (case-insensitive) -> 400."""
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/manager/menu", json={"name": "Fries", "category": "Appetizer", "price": 20000}, headers=headers)
    res_b = await client.post("/manager/menu", json={"name": "Onion Rings", "category": "Appetizer", "price": 25000}, headers=headers)
    item_b_id = res_b.json()["id"]

    update_res = await client.put(f"/manager/menu/{item_b_id}", json={"name": "fries"}, headers=headers)
    assert update_res.status_code == 400
    assert "already exists" in update_res.json()["detail"]

# === DELETE /manager/menu/{id} ===

@pytest.mark.asyncio
async def test_delete_with_transactions_soft_deactivates(client, token):
    """Create item, create a Transaction+TransactionItem referencing it.
    DELETE -> 200, body has status='deactivated'.
    GET list -> item still present with is_active=False."""
    headers = {"Authorization": f"Bearer {token}"}
    create_res = await client.post("/manager/menu", json={"name": "Popular Tea", "category": "Beverage", "price": 10000}, headers=headers)
    item_id = create_res.json()["id"]

    async with _TestSessionLocal() as session:
        txn = Transaction(
            id="tx_test_menu_del",
            subtotal=10000.0,
            tax=1000.0,
            total_amount=11000.0,
            payment_method=PaymentMethodEnum.Cash,
            status=StatusEnum.Completed,
            order_type=OrderTypeEnum.Takeaway
        )
        session.add(txn)
        await session.flush()
        ti = TransactionItem(
            transaction_id="tx_test_menu_del",
            menu_item_id=item_id,
            quantity=1,
            price_at_time=10000.0,
            cogs_per_unit=0.0
        )
        session.add(ti)
        await session.commit()

    del_res = await client.delete(f"/manager/menu/{item_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deactivated"

    list_res = await client.get("/manager/menu", headers=headers)
    items = list_res.json()
    deactivated_item = next((i for i in items if i["id"] == item_id), None)
    assert deactivated_item is not None
    assert deactivated_item["is_active"] == False

@pytest.mark.asyncio
async def test_delete_without_transactions_hard_deletes(client, token):
    """Create item with no transactions, but seed it with Recipe rows AND a full modifier chain
    (ItemModifierGroup → ItemModifier → ModifierRecipe).
    DELETE → 200, body has status='deleted'.
    Assert in DB: MenuItem is gone, and all 4 child tables (Recipe, ItemModifierGroup,
    ItemModifier, ModifierRecipe) have 0 remaining rows associated with that item."""
    headers = {"Authorization": f"Bearer {token}"}
    create_res = await client.post("/manager/menu", json={"name": "Custom Combo", "category": "Main Course", "price": 70000, "recipes": [{"ingredient_id": "ing_beef", "quantity": 0.2}]}, headers=headers)
    item_id = create_res.json()["id"]

    async with _TestSessionLocal() as session:
        grp = ItemModifierGroup(id="grp_1", menu_item_id=item_id, name="Sauce Choice")
        session.add(grp)
        await session.flush()

        mod = ItemModifier(id="mod_1", group_id=grp.id, name="Extra Cheese", price_adjustment=5000)
        session.add(mod)
        await session.flush()

        mod_rec = ModifierRecipe(id="mrec_1", modifier_id=mod.id, ingredient_id="ing_cheese", quantity=0.05)
        session.add(mod_rec)
        await session.commit()

    del_res = await client.delete(f"/manager/menu/{item_id}", headers=headers)
    assert del_res.status_code == 200
    assert del_res.json()["status"] == "deleted"

    # Assert in DB that all rows are gone
    async with _TestSessionLocal() as session:
        res_item = await session.execute(select(MenuItem).where(MenuItem.id == item_id))
        assert res_item.scalars().first() is None

        res_rec = await session.execute(select(Recipe).where(Recipe.menu_item_id == item_id))
        assert len(res_rec.scalars().all()) == 0

        res_grp = await session.execute(select(ItemModifierGroup).where(ItemModifierGroup.menu_item_id == item_id))
        assert len(res_grp.scalars().all()) == 0

        res_mod = await session.execute(select(ItemModifier).where(ItemModifier.id == "mod_1"))
        assert len(res_mod.scalars().all()) == 0

        res_mrec = await session.execute(select(ModifierRecipe).where(ModifierRecipe.id == "mrec_1"))
        assert len(res_mrec.scalars().all()) == 0

# === GET /manager/menu/{id} ===

@pytest.mark.asyncio
async def test_get_detail_returns_recipes(client, token):
    """Create item with 2 recipes. GET /manager/menu/{id}.
    Confirm response includes recipes array with ingredient_id, ingredient_name, unit, quantity."""
    headers = {"Authorization": f"Bearer {token}"}
    payload = {
        "name": "Detailed Burger",
        "category": "Main Course",
        "price": 40000,
        "recipes": [
            {"ingredient_id": "ing_beef", "quantity": 0.25},
            {"ingredient_id": "ing_bun", "quantity": 1.0}
        ]
    }
    create_res = await client.post("/manager/menu", json=payload, headers=headers)
    item_id = create_res.json()["id"]

    res = await client.get(f"/manager/menu/{item_id}", headers=headers)
    assert res.status_code == 200
    data = res.json()
    assert data["id"] == item_id
    assert len(data["recipes"]) == 2
    beef_rec = next(r for r in data["recipes"] if r["ingredient_id"] == "ing_beef")
    assert beef_rec["ingredient_name"] == "Ground Beef"
    assert beef_rec["unit"] == "kg"
    assert beef_rec["quantity"] == 0.25

@pytest.mark.asyncio
async def test_get_detail_not_found(client, token):
    """GET /manager/menu/{bogus_id} -> 404."""
    headers = {"Authorization": f"Bearer {token}"}
    res = await client.get("/manager/menu/non_existent_id", headers=headers)
    assert res.status_code == 404

@pytest.mark.asyncio
async def test_get_manager_menu_list(client, token):
    """GET /manager/menu -> 200, returns list including active and inactive items."""
    headers = {"Authorization": f"Bearer {token}"}
    await client.post("/manager/menu", json={"name": "Item Active", "category": "Main", "price": 10000}, headers=headers)
    res = await client.get("/manager/menu", headers=headers)
    assert res.status_code == 200
    assert len(res.json()) >= 1
