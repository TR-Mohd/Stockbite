import asyncio
from app.database import AsyncSessionLocal
from app.models import Ingredient
from sqlalchemy.future import select

async def get_ingredients():
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Ingredient.name))
        names = res.scalars().all()
        print("Ingredients in DB:", names)

if __name__ == "__main__":
    asyncio.run(get_ingredients())
