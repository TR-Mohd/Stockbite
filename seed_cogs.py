import asyncio
from app.database import AsyncSessionLocal
from app.models import Ingredient, TransactionItem, TransactionItemModifier
from sqlalchemy.future import select

async def main():
    async with AsyncSessionLocal() as session:
        # 1. Update ingredients unit_cost
        result = await session.execute(select(Ingredient))
        ingredients = result.scalars().all()
        for ing in ingredients:
            ing.unit_cost = 5000.0
            session.add(ing)
        
        # 2. Backfill TransactionItems
        result_items = await session.execute(select(TransactionItem))
        items = result_items.scalars().all()
        for item in items:
            # Estimate COGS as 35% of price
            item.cogs_per_unit = item.price_at_time * 0.35
            session.add(item)
            
        # 3. Backfill TransactionItemModifiers
        result_mods = await session.execute(select(TransactionItemModifier))
        mods = result_mods.scalars().all()
        for mod in mods:
            # Estimate COGS as 35% of price
            mod.cogs_per_unit = mod.price_at_time * 0.35
            session.add(mod)
            
        await session.commit()
        print("Data seeding for COGS completed.")

if __name__ == "__main__":
    asyncio.run(main())
