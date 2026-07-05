import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from app.models import Transaction, TransactionItem, TransactionItemModifier, User

DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite"

async def cleanup():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        user_stmt = select(User).where(User.username == "daffa")
        user_res = await session.execute(user_stmt)
        daffa = user_res.scalars().first()
        
        # Get all transactions for daffa ordered by timestamp
        stmt = select(Transaction).where(Transaction.cashier_id == daffa.id).order_by(Transaction.timestamp.asc())
        result = await session.execute(stmt)
        transactions = result.scalars().all()
        
        # We want to keep the last 3
        to_delete = transactions[:-3]
        
        for t in to_delete:
            print(f"Deleting transaction {t.id}...")
            
            # Delete modifiers
            item_stmt = select(TransactionItem).where(TransactionItem.transaction_id == t.id)
            item_res = await session.execute(item_stmt)
            items = item_res.scalars().all()
            for item in items:
                await session.execute(delete(TransactionItemModifier).where(TransactionItemModifier.transaction_item_id == item.id))
            
            # Delete items
            await session.execute(delete(TransactionItem).where(TransactionItem.transaction_id == t.id))
            
            # Delete transaction
            await session.execute(delete(Transaction).where(Transaction.id == t.id))
            
        await session.commit()
        print(f"Deleted {len(to_delete)} old transactions.")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(cleanup())
