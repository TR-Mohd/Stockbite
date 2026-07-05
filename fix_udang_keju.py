import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, delete
from app.models import MenuItem, Recipe, Ingredient

DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite"

async def fix_udang_keju():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        # 1. Look up Udang Keju
        mi_res = await session.execute(select(MenuItem).where(MenuItem.name == "Udang Keju"))
        mi = mi_res.scalars().first()
        
        # 2. DELETE existing corrupted recipe rows
        await session.execute(delete(Recipe).where(Recipe.menu_item_id == mi.id))
        
        # 3. Look up Ingredient IDs
        ing_res = await session.execute(select(Ingredient).where(Ingredient.name.in_([
            "Peeled Shrimp (Udang Kupas)",
            "Chicken Breast Fillet",
            "Cheddar Cheese (Block)",
            "Mayonnaise"
        ])))
        ingredients = {ing.name: ing.id for ing in ing_res.scalars().all()}
        
        # 4. INSERT the correct originally approved recipe
        correct_recipe = [
            ("Peeled Shrimp (Udang Kupas)", 0.05),
            ("Chicken Breast Fillet", 0.05),
            ("Cheddar Cheese (Block)", 0.02),
            ("Mayonnaise", 0.01),
        ]
        
        for name, qty in correct_recipe:
            session.add(Recipe(
                menu_item_id=mi.id,
                ingredient_id=ingredients[name],
                quantity=qty
            ))
            
        await session.commit()
        print("Fixed Udang Keju!")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(fix_udang_keju())
