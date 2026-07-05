import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from app.models import TransactionItem, MenuItem

DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite"

async def check():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        from app.models import Transaction
        stmt = select(TransactionItem, MenuItem).join(MenuItem, TransactionItem.menu_item_id == MenuItem.id).join(Transaction).where(
            MenuItem.name.in_(["Udang Keju", "Sate Ayam (10 pcs)", "Chicken Shawarma"])
        ).order_by(Transaction.timestamp.desc())
        
        result = await session.execute(stmt)
        items = result.all()
        
        for tx_item, menu_item in items[:20]:
            print(f"Item: {menu_item.name} | cogs_per_unit: {tx_item.cogs_per_unit} | price: {tx_item.price_at_time}")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(check())
