import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.models import MenuItem, Ingredient, Recipe
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite")

# Updated prices as requested, with Ground Beef at Rp 128,000/kg
INGREDIENTS_DATA = [
    {"name": "Chicken Breast Fillet", "unit": "kg", "unit_cost": 65000.0, "category": "Meat"},
    {"name": "Ground Beef (Daging Giling)", "unit": "kg", "unit_cost": 128000.0, "category": "Meat"},
    {"name": "Peeled Shrimp (Udang Kupas)", "unit": "kg", "unit_cost": 120000.0, "category": "Seafood"},
    {"name": "Instant Noodles (Indomie)", "unit": "pcs", "unit_cost": 3000.0, "category": "Dry Goods"},
    {"name": "White Rice (Beras)", "unit": "kg", "unit_cost": 15000.0, "category": "Dry Goods"},
    {"name": "Chicken Eggs (Telur)", "unit": "pcs", "unit_cost": 2000.0, "category": "Dairy/Egg"},
    {"name": "Burger Buns", "unit": "pcs", "unit_cost": 3000.0, "category": "Bakery"},
    {"name": "Tortilla Wraps", "unit": "pcs", "unit_cost": 2500.0, "category": "Bakery"},
    {"name": "Cheddar Cheese (Block)", "unit": "kg", "unit_cost": 120000.0, "category": "Dairy/Egg"},
    {"name": "Mayonnaise", "unit": "kg", "unit_cost": 30000.0, "category": "Sauce/Condiment"},
    {"name": "Butter", "unit": "kg", "unit_cost": 80000.0, "category": "Dairy/Egg"},
    {"name": "Ketchup / Chili Sauce", "unit": "Liter", "unit_cost": 25000.0, "category": "Sauce/Condiment"},
    {"name": "Sweet Soy Sauce (Kecap Manis)", "unit": "Liter", "unit_cost": 30000.0, "category": "Sauce/Condiment"},
    {"name": "Peanut Sauce Base (Kacang)", "unit": "kg", "unit_cost": 30000.0, "category": "Sauce/Condiment"},
    {"name": "Tomatoes", "unit": "kg", "unit_cost": 15000.0, "category": "Produce"},
    {"name": "Lettuce", "unit": "kg", "unit_cost": 20000.0, "category": "Produce"},
    {"name": "Onions (Bawang Bombay)", "unit": "kg", "unit_cost": 30000.0, "category": "Produce"},
    {"name": "Garlic (Bawang Putih)", "unit": "kg", "unit_cost": 40000.0, "category": "Produce"},
    {"name": "Salt", "unit": "kg", "unit_cost": 10000.0, "category": "Dry Goods"},
    {"name": "Thai Tea Mix (Leaves)", "unit": "kg", "unit_cost": 150000.0, "category": "Beverage"},
    {"name": "Thai Green Tea Mix", "unit": "kg", "unit_cost": 150000.0, "category": "Beverage"},
    {"name": "Milo Powder", "unit": "kg", "unit_cost": 80000.0, "category": "Beverage"},
    {"name": "Standard Black Tea", "unit": "kg", "unit_cost": 50000.0, "category": "Beverage"},
    {"name": "Fresh Lemons", "unit": "kg", "unit_cost": 30000.0, "category": "Produce"},
    {"name": "Fresh Oranges (Jeruk Peras)", "unit": "kg", "unit_cost": 20000.0, "category": "Produce"},
    {"name": "Fresh Milk (Susu Cair)", "unit": "Liter", "unit_cost": 20000.0, "category": "Dairy/Egg"},
    {"name": "Condensed Milk", "unit": "kg", "unit_cost": 30000.0, "category": "Dairy/Egg"},
    {"name": "Evaporated Milk", "unit": "kg", "unit_cost": 45000.0, "category": "Dairy/Egg"},
    {"name": "Sugar", "unit": "kg", "unit_cost": 17000.0, "category": "Dry Goods"},
]

# Map menu item partial names to their recipe (ingredient name, quantity)
RECIPE_MAPPINGS = {
    "Spicy Indonesian Noodle": [
        ("Instant Noodles (Indomie)", 1.0),
        ("Chicken Eggs (Telur)", 1.0),
        ("Sweet Soy Sauce (Kecap Manis)", 0.02),
        ("Garlic (Bawang Putih)", 0.01),
    ],
    "Udang Keju": [
        ("Peeled Shrimp (Udang Kupas)", 0.05),
        ("Chicken Breast Fillet", 0.05),
        ("Cheddar Cheese (Block)", 0.02),
        ("Mayonnaise", 0.01),
    ],
    "Chicken Shawarma": [
        ("Chicken Breast Fillet", 0.15),
        ("Tortilla Wraps", 1.0),
        ("Lettuce", 0.02),
        ("Tomatoes", 0.02),
        ("Mayonnaise", 0.02),
    ],
    "Triple Whopper Jr with Cheese": [
        ("Burger Buns", 1.0),
        ("Ground Beef (Daging Giling)", 0.15),
        ("Cheddar Cheese (Block)", 0.02),
        ("Lettuce", 0.02),
        ("Tomatoes", 0.02),
        ("Ketchup / Chili Sauce", 0.02),
    ],
    "Nasi Goreng Spesial": [
        ("White Rice (Beras)", 0.2),
        ("Chicken Breast Fillet", 0.08),
        ("Chicken Eggs (Telur)", 1.0),
        ("Sweet Soy Sauce (Kecap Manis)", 0.03),
        ("Onions (Bawang Bombay)", 0.02),
        ("Butter", 0.01),
    ],
    "Sate Ayam": [
        ("Chicken Breast Fillet", 0.2),
        ("Peanut Sauce Base (Kacang)", 0.05),
        ("Sweet Soy Sauce (Kecap Manis)", 0.03),
        ("Onions (Bawang Bombay)", 0.02),
    ],
    "Thai Tea": [
        ("Thai Tea Mix (Leaves)", 0.02),
        ("Evaporated Milk", 0.05),
        ("Condensed Milk", 0.03),
    ],
    "Thai Green Tea": [
        ("Thai Green Tea Mix", 0.02),
        ("Evaporated Milk", 0.05),
        ("Condensed Milk", 0.03),
    ],
    "Milo": [
        ("Milo Powder", 0.04),
        ("Fresh Milk (Susu Cair)", 0.1),
        ("Condensed Milk", 0.02),
    ],
    "Teh Tarik": [
        ("Standard Black Tea", 0.01),
        ("Condensed Milk", 0.04),
        ("Evaporated Milk", 0.02),
    ],
    "Es Jeruk": [
        ("Fresh Oranges (Jeruk Peras)", 0.2),
        ("Sugar", 0.02),
    ],
    "Iced Lemon Tea": [
        ("Standard Black Tea", 0.01),
        ("Fresh Lemons", 0.05),
        ("Sugar", 0.02),
    ]
}

async def seed_realistic():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, class_=AsyncSession)

    async with async_session() as session:
        # Step 1: Clear existing Recipes & Ingredients
        print("Clearing old recipes and ingredients...")
        await session.execute(Recipe.__table__.delete())
        await session.execute(Ingredient.__table__.delete())
        
        # Step 2: Insert New Ingredients
        print("Inserting new ingredients into 'ingredients' table...")
        ing_map = {}
        for ing_data in INGREDIENTS_DATA:
            new_ing = Ingredient(
                name=ing_data["name"],
                unit=ing_data["unit"],
                unit_cost=ing_data["unit_cost"],
                category=ing_data["category"],
                stock_level=100.0,
                reorder_point=10.0
            )
            session.add(new_ing)
            await session.flush()
            ing_map[ing_data["name"]] = new_ing.id
            print(f"  Inserted: {new_ing.name} (Rp {new_ing.unit_cost}/{new_ing.unit})")
            
        # Step 3: Link to Menu Items in 'recipes' table
        print("\nInserting links into 'recipes' table...")
        mi_result = await session.execute(select(MenuItem))
        menu_items = mi_result.scalars().all()
        
        recipe_count = 0
        for mi in menu_items:
            mapping_key = next((key for key in RECIPE_MAPPINGS.keys() if key in mi.name), None)
            if not mapping_key:
                print(f"  Warning: No recipe mapping found for Menu Item '{mi.name}'")
                continue
            
            recipe_list = RECIPE_MAPPINGS[mapping_key]
            for (ing_name, qty) in recipe_list:
                ing_id = ing_map.get(ing_name)
                if ing_id:
                    session.add(Recipe(
                        menu_item_id=mi.id,
                        ingredient_id=ing_id,
                        quantity=qty
                    ))
                    recipe_count += 1
                else:
                    print(f"  Warning: Ingredient '{ing_name}' not found for '{mi.name}'")
                    
        await session.commit()
        print(f"\nSuccessfully inserted {len(INGREDIENTS_DATA)} ingredients and {recipe_count} recipe links!")

if __name__ == "__main__":
    asyncio.run(seed_realistic())
