import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.database import Base, get_db
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import NullPool
from app.auth import get_password_hash, create_access_token
from app.models import User, RoleEnum
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload
from app.models import MenuItem, Ingredient, Recipe, ItemModifierGroup, ItemModifier, Transaction

TEST_DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite_test"

@pytest_asyncio.fixture(scope="session")
async def db_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False, poolclass=NullPool)
    yield engine
    await engine.dispose()

@pytest_asyncio.fixture(scope="session")
async def db_maker(db_engine):
    yield async_sessionmaker(db_engine, class_=AsyncSession, expire_on_commit=False)

@pytest_asyncio.fixture(scope="function", autouse=True)
async def setup_db(db_engine, db_maker):
    async def override_get_db():
        async with db_maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    # Seed data
    async with db_maker() as session:
        user = User(name="test_cashier", username="test_cashier", role=RoleEnum.Cashier, hashed_password=get_password_hash("pass"))
        session.add(user)
        await session.commit()
    
    yield

@pytest_asyncio.fixture
async def async_db(db_maker):
    session = db_maker()
    yield session
    try:
        await session.close()
    except RuntimeError:
        pass

@pytest_asyncio.fixture
async def client():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def token():
    return create_access_token(data={"sub": "test_cashier", "role": "Cashier"})

@pytest.mark.asyncio
async def test_checkout_ingredient_deduction(client, token, async_db):
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Setup Data: Create ingredients directly via DB (Cashier role cannot POST to /inventory/)
    ing1 = Ingredient(name="Burger Bun", unit="pcs", stock_level=50, unit_cost=2000.0)
    ing2 = Ingredient(name="Beef Patty", unit="pcs", stock_level=40, unit_cost=5000.0)
    ing3 = Ingredient(name="Cheese Slice", unit="pcs", stock_level=20, unit_cost=1500.0)
    
    async_db.add_all([ing1, ing2, ing3])
    await async_db.commit()
    await async_db.refresh(ing1)
    await async_db.refresh(ing2)
    await async_db.refresh(ing3)
    
    ing1_id = ing1.id
    ing2_id = ing2.id
    ing3_id = ing3.id
    
    # We must insert MenuItem and Modifiers manually for speed and full control over IDs
    mi = MenuItem(name="Test Burger", price=35000.0, category="Foods", is_active=True)
    async_db.add(mi)
    await async_db.commit()
    await async_db.refresh(mi)
    
    recipe1 = Recipe(menu_item_id=mi.id, ingredient_id=ing1_id, quantity=1.0)
    recipe2 = Recipe(menu_item_id=mi.id, ingredient_id=ing2_id, quantity=2.0) # Double patty
    async_db.add_all([recipe1, recipe2])
    
    # Modifier Group & Modifier (Extra Cheese)
    mod_group = ItemModifierGroup(menu_item_id=mi.id, name="Add-ons", min_selections=0, max_selections=5)
    async_db.add(mod_group)
    await async_db.commit()
    await async_db.refresh(mod_group)
    
    mod = ItemModifier(group_id=mod_group.id, name="Extra Cheese", price_adjustment=3000.0)
    async_db.add(mod)
    await async_db.commit()
    await async_db.refresh(mod)
    
    # Let's add the modifier recipe via raw SQL or model
    # Wait, the modifier recipe isn't exposed in tests easily. Let's just create an Ingredient explicitly and hook it.
    from app.models import ModifierRecipe
    mod_recipe = ModifierRecipe(modifier_id=mod.id, ingredient_id=ing3_id, quantity=1.0)
    async_db.add(mod_recipe)
    await async_db.commit()
    
    # 2. Execute Checkout Flow
    checkout_payload = {
        "order_type": "Dine-In",
        "routing_number": "Table 5",
        "payment_method": "Cash",
        "amount_tendered": 200000.0,
        "items": [
            {
                "menu_item_id": mi.id,
                "quantity": 3,
                "notes": "No pickles",
                "modifier_ids": [mod.id]
            }
        ]
    }
    
    res_checkout = await client.post("/pos/checkout", json=checkout_payload, headers=headers)
    assert res_checkout.status_code == 200, res_checkout.text
    
    # 3. Verify Math (Ingredient Deduction)
    # Burger Bun: 50 - (1 bun * 3 burgers) = 47
    # Beef Patty: 40 - (2 patties * 3 burgers) = 34
    # Cheese Slice: 20 - (1 slice * 3 burgers) = 17
    
    # Expire cached objects to force a DB refetch
    async_db.expire_all()
    
    ing1_final = await async_db.execute(select(Ingredient).where(Ingredient.id == ing1_id))
    ing2_final = await async_db.execute(select(Ingredient).where(Ingredient.id == ing2_id))
    ing3_final = await async_db.execute(select(Ingredient).where(Ingredient.id == ing3_id))
    
    assert ing1_final.scalars().first().stock_level == 47.0
    assert ing2_final.scalars().first().stock_level == 34.0
    assert ing3_final.scalars().first().stock_level == 17.0

@pytest.mark.asyncio
async def test_checkout_insufficient_stock(client, token, async_db):
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create ingredient with very low stock directly via DB
    ing = Ingredient(name="Rare Truffle", unit="g", stock_level=5.0, unit_cost=100.0)
    async_db.add(ing)
    await async_db.commit()
    await async_db.refresh(ing)
    ing_id = ing.id
    
    mi = MenuItem(name="Truffle Pasta", price=95000.0, category="Foods", is_active=True)
    async_db.add(mi)
    await async_db.commit()
    await async_db.refresh(mi)
    
    recipe = Recipe(menu_item_id=mi.id, ingredient_id=ing_id, quantity=10.0) # Requires 10g, only 5g available
    async_db.add(recipe)
    await async_db.commit()
    
    checkout_payload = {
        "order_type": "Takeaway",
        "payment_method": "Cash",
        "amount_tendered": 200000.0,
        "items": [
            {
                "menu_item_id": mi.id,
                "quantity": 1,
                "modifier_ids": []
            }
        ]
    }
    
    res_checkout = await client.post("/pos/checkout", json=checkout_payload, headers=headers)
    
    # Should throw 400 Insufficient Stock
    assert res_checkout.status_code == 400
    assert "Insufficient stock" in res_checkout.json()["detail"]
    
    # Verify stock was completely untouched
    async_db.expire_all()
    ing_final = await async_db.execute(select(Ingredient).where(Ingredient.id == ing_id))
    assert ing_final.scalars().first().stock_level == 5.0

@pytest.mark.asyncio
async def test_checkout_concurrency(client, token, async_db):
    import asyncio
    headers = {"Authorization": f"Bearer {token}"}
    
    # Create ingredient with stock=1
    ing = Ingredient(name="High Contention Item", unit="pcs", stock_level=1.0, unit_cost=5.0)
    async_db.add(ing)
    await async_db.commit()
    await async_db.refresh(ing)
    ing_id = ing.id
    
    mi = MenuItem(name="Contention Meal", price=10.0, category="Foods", is_active=True)
    async_db.add(mi)
    await async_db.commit()
    await async_db.refresh(mi)
    
    recipe = Recipe(menu_item_id=mi.id, ingredient_id=ing_id, quantity=1.0)
    async_db.add(recipe)
    await async_db.commit()
    
    checkout_payload = {
        "order_type": "Takeaway",
        "payment_method": "Cash",
        "amount_tendered": 20.0,
        "items": [
            {
                "menu_item_id": mi.id,
                "quantity": 1,
                "modifier_ids": []
            }
        ]
    }
    
    # Fire 2 concurrent checkout requests
    async def make_req():
        return await client.post("/pos/checkout", json=checkout_payload, headers=headers)
        
    responses = await asyncio.gather(make_req(), make_req())
    
    status_codes = [resp.status_code for resp in responses]
    
    # Since stock=1 and quantity=1, exactly one should succeed (200)
    # The other should fail with 400 (Insufficient stock) or 409 (Optimistic locking backstop)
    assert status_codes.count(200) == 1, f"Expected exactly one success, got status codes: {status_codes}"
    assert (status_codes.count(400) == 1 or status_codes.count(409) == 1), f"Expected one failure, got status codes: {status_codes}"
    
    async_db.expire_all()
    ing_final = await async_db.execute(select(Ingredient).where(Ingredient.id == ing_id))
    assert ing_final.scalars().first().stock_level == 0.0
