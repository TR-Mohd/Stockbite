"""
Temporary recipe seeding script.
Links each menu item to plausible ingredients at quantities calibrated
so that COGS ≈ 25-35% of the menu price (unit_cost is 5000 for all).
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.models import Recipe

DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite"

# IDs from the DB (first 8 chars are enough to identify, using full IDs here)
MENU = {
    "Spicy Indonesian Noodle":       "d25c9bed",
    "Udang Keju":                    "089a4740",
    "Chicken Shawarma":              "7737aeca",
    "Triple Whopper Jr with Cheese": "5e1e5adc",
    "Nasi Goreng Spesial":           "09d12952",
    "Sate Ayam (10 pcs)":            "5aba7510",
    "Thai Tea":                      "f075657c",
    "Thai Green Tea":                "5b1cc1a0",
    "Milo":                          "b4c11d3a",
    "Teh Tarik":                     "319f823a",
    "Es Jeruk":                      "c6f605e4",
    "Iced Lemon Tea":                "714a5a19",
}

ING = {
    "Ground Beef":    "1f56ddd0",
    "Chicken Breast": "233abee2",
    "Burger Buns":    "3bf9c8bb",
    "Bacon":          "41e2d282",
    "Tortilla Wraps": "6a8d1a5b",
    "Salt":           "1bf5a0f5",
    "Lemonade":       "25ce770f",
    "Tomatoes":       "3b86f407",
    "Mayonnaise":     "3de170f3",
    "Coffee Beans":   "6fc61757",
    "Cheddar Cheese": "73dcc39f",
    "Milk":           "95f689d7",
    "Onions":         "a24b3b3d",
    "Lettuce":        "bcb8d29e",
    "Ketchup":        "c00d6c04",
    "Butter":         "ca63c82a",
    "Mustard":        "ce76ed7c",
}

# Each entry: (menu_item_prefix, ingredient_prefix, quantity)
# COGS = quantity * 5000. Target: ~25-35% of item price.
# e.g. Triple Whopper price=45000, target COGS≈12000 → 2.4 units of beef (2.4*5000=12000)
RECIPES = [
    # Spicy Indonesian Noodle (price=15000, target COGS≈4000)
    ("d25c9bed", "a24b3b3d", 0.3),  # Onions 0.3kg
    ("d25c9bed", "1bf5a0f5", 0.1),  # Salt 0.1kg

    # Udang Keju (price=20000, target COGS≈3500)
    ("089a4740", "73dcc39f", 0.4),  # Cheddar Cheese 0.4kg
    ("089a4740", "3de170f3", 0.15), # Mayonnaise 0.15 tub

    # Chicken Shawarma (price=25000, target COGS≈7000)
    ("7737aeca", "233abee2", 0.8),  # Chicken Breast 0.8kg
    ("7737aeca", "6a8d1a5b", 1.0),  # Tortilla Wraps 1 pcs
    ("7737aeca", "bcb8d29e", 0.1),  # Lettuce 0.1 head
    ("7737aeca", "3b86f407", 0.1),  # Tomatoes 0.1kg

    # Triple Whopper Jr with Cheese (price=45000, target COGS≈12000)
    ("5e1e5adc", "1f56ddd0", 1.2),  # Ground Beef 1.2kg
    ("5e1e5adc", "3bf9c8bb", 1.0),  # Burger Buns 1 pcs
    ("5e1e5adc", "73dcc39f", 0.3),  # Cheddar Cheese 0.3kg
    ("5e1e5adc", "bcb8d29e", 0.05), # Lettuce 0.05 head
    ("5e1e5adc", "3b86f407", 0.05), # Tomatoes 0.05kg

    # Nasi Goreng Spesial (price=20000, target COGS≈5500)
    ("09d12952", "233abee2", 0.5),  # Chicken Breast 0.5kg
    ("09d12952", "a24b3b3d", 0.2),  # Onions 0.2kg
    ("09d12952", "1bf5a0f5", 0.05), # Salt 0.05kg
    ("09d12952", "ca63c82a", 0.1),  # Butter 0.1kg

    # Sate Ayam 10 pcs (price=25000, target COGS≈7000)
    ("5aba7510", "233abee2", 1.0),  # Chicken Breast 1.0kg
    ("5aba7510", "a24b3b3d", 0.1),  # Onions 0.1kg
    ("5aba7510", "1bf5a0f5", 0.05), # Salt 0.05kg

    # Thai Tea (price=10000, target COGS≈2500)
    ("f075657c", "95f689d7", 0.3),  # Milk 0.3L
    ("f075657c", "1bf5a0f5", 0.01), # Salt (a pinch)

    # Thai Green Tea (price=12000, target COGS≈3000)
    ("5b1cc1a0", "95f689d7", 0.3),  # Milk 0.3L
    ("5b1cc1a0", "ca63c82a", 0.05), # Butter 0.05kg

    # Milo (price=10000, target COGS≈2000)
    ("b4c11d3a", "95f689d7", 0.2),  # Milk 0.2L
    ("b4c11d3a", "ca63c82a", 0.02), # Butter 0.02kg

    # Teh Tarik (price=10000, target COGS≈2500)
    ("319f823a", "95f689d7", 0.3),  # Milk 0.3L
    ("319f823a", "1bf5a0f5", 0.01), # Salt

    # Es Jeruk (price=12000, target COGS≈3000)
    ("c6f605e4", "25ce770f", 0.3),  # Lemonade 0.3 bottle
    ("c6f605e4", "1bf5a0f5", 0.01), # Salt

    # Iced Lemon Tea (price=15000, target COGS≈3500)
    ("714a5a19", "25ce770f", 0.4),  # Lemonade 0.4 bottle
    ("714a5a19", "95f689d7", 0.1),  # Milk 0.1L
]

async def seed():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession)

    async with async_session() as session:
        # Fetch full IDs from DB
        from app.models import MenuItem, Ingredient
        mi_result = await session.execute(select(MenuItem))
        mi_map = {m.id[:8]: m.id for m in mi_result.scalars().all()}

        ing_result = await session.execute(select(Ingredient))
        ing_map = {i.id[:8]: i.id for i in ing_result.scalars().all()}

        count = 0
        for (mi_prefix, ing_prefix, qty) in RECIPES:
            full_mi_id = mi_map.get(mi_prefix)
            full_ing_id = ing_map.get(ing_prefix)
            if not full_mi_id or not full_ing_id:
                print(f"  SKIP: {mi_prefix} or {ing_prefix} not found")
                continue

            recipe = Recipe(
                menu_item_id=full_mi_id,
                ingredient_id=full_ing_id,
                quantity=qty
            )
            session.add(recipe)
            count += 1

        await session.commit()
        print(f"OK: Seeded {count} recipe links across {len(MENU)} menu items.")
        
        # Verify - print expected COGS per item
        from sqlalchemy.orm import selectinload
        mi_result2 = await session.execute(
            select(MenuItem).options(selectinload(MenuItem.recipes))
        )
        print("\n=== Expected COGS per item ===")
        for m in mi_result2.scalars().all():
            cogs = sum(r.quantity * 5000 for r in m.recipes)
            print(f"  {m.name:<40} price={m.price:<8} COGS≈{cogs:<8} margin≈{((m.price-cogs)/m.price*100):.0f}%")

if __name__ == "__main__":
    asyncio.run(seed())
