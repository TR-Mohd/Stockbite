import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models import Transaction, TransactionItem, TransactionItemModifier, User

DATABASE_URL = "postgresql+asyncpg://stockbite_user:stockbite_password@localhost:5432/stockbite"

async def verify():
    engine = create_async_engine(DATABASE_URL)
    async_session = async_sessionmaker(engine, expire_on_commit=False)
    
    async with async_session() as session:
        # Get daffa user
        user_stmt = select(User).where(User.username == "daffa")
        user_res = await session.execute(user_stmt)
        daffa = user_res.scalars().first()
        if not daffa:
            print("User daffa not found!")
            return
            
        stmt = select(Transaction).options(
            selectinload(Transaction.items).selectinload(TransactionItem.selected_modifiers).selectinload(TransactionItemModifier.modifier),
            selectinload(Transaction.items).selectinload(TransactionItem.menu_item)
        ).where(Transaction.cashier_id == daffa.id).order_by(Transaction.timestamp.asc())
        
        result = await session.execute(stmt)
        transactions = result.scalars().all()
        
        print(f"Total transactions for daffa: {len(transactions)}")
        
        for idx, t in enumerate(transactions):
            print(f"\n--- Database Transaction {idx + 1} ---")
            print(f"ID: {t.id}")
            print(f"Type: {t.order_type}")
            print(f"Routing (Table/Buzzer): {t.routing_number}")
            print(f"Contact (WhatsApp): {t.whatsapp}")
            print(f"Contact (Email): {t.email}")
            print(f"Payment Method: {t.payment_method}")
            print(f"Total Amount: {t.total_amount}")
            print(f"Amount Tendered: {t.amount_tendered}")
            print(f"Change: {t.change}")
            
            for item in t.items:
                print(f"  Item: {item.quantity}x {item.menu_item.name} (Total Price: {item.price_at_time})")
                for sel_mod in item.selected_modifiers:
                    print(f"    Modifier: {sel_mod.modifier.name} (+{sel_mod.price_at_time})")

    await engine.dispose()

if __name__ == "__main__":
    asyncio.run(verify())
