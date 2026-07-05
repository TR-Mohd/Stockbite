import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, delete
from app.models import Transaction, TransactionItem, TransactionItemModifier

DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite"

async def wipe_all():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        # Delete unconditionally
        await session.execute(delete(TransactionItemModifier))
        await session.execute(delete(TransactionItem))
        await session.execute(delete(Transaction))
        await session.commit()
        
        # Verify 0 rows
        tx_count = len((await session.execute(select(Transaction))).scalars().all())
        item_count = len((await session.execute(select(TransactionItem))).scalars().all())
        mod_count = len((await session.execute(select(TransactionItemModifier))).scalars().all())
        
        print(f"Transactions remaining: {tx_count}")
        print(f"Items remaining: {item_count}")
        print(f"Modifiers remaining: {mod_count}")
        
    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(wipe_all())
