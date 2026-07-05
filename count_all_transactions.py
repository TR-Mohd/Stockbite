import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models import Transaction, TransactionItem, TransactionItemModifier

DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite"

async def count_all():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        # Count all transactions regardless of cashier
        stmt = select(Transaction)
        result = await session.execute(stmt)
        transactions = result.scalars().all()
        print(f"Total Transactions to delete: {len(transactions)}")
        
        # Also count associated items and modifiers that will be cascaded/deleted
        item_stmt = select(TransactionItem)
        item_res = await session.execute(item_stmt)
        items = item_res.scalars().all()
        print(f"Total Transaction Items to delete: {len(items)}")
        
        mod_stmt = select(TransactionItemModifier)
        mod_res = await session.execute(mod_stmt)
        mods = mod_res.scalars().all()
        print(f"Total Transaction Modifiers to delete: {len(mods)}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(count_all())
