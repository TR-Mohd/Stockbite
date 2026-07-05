import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models import MenuItem, Recipe, Ingredient

DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite"

async def check():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        stmt = select(MenuItem).options(
            selectinload(MenuItem.recipes).selectinload(Recipe.ingredient)
        ).where(MenuItem.name == "Udang Keju")
        
        result = await session.execute(stmt)
        mi = result.scalars().first()
        
        print(f"Menu Item: {mi.name}")
        total_cogs = 0
        for recipe in mi.recipes:
            cost = recipe.quantity * recipe.ingredient.unit_cost
            total_cogs += cost
            print(f"  - {recipe.ingredient.name}: {recipe.quantity} {recipe.ingredient.unit} @ {recipe.ingredient.unit_cost} = {cost}")
        print(f"Calculated COGS: {total_cogs}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
