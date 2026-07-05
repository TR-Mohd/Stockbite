import asyncio
from datetime import datetime, timedelta
import uuid
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models import Transaction, TransactionItem, StatusEnum, PaymentMethodEnum, OrderTypeEnum, MenuItem
from app.routers.manager import get_kpis, get_basket_analysis

async def run_tests():
    async with AsyncSessionLocal() as db:
        # 1. Setup Test Data: Add 2 completed transactions
        # Find any existing menu item to use
        res = await db.execute(select(MenuItem).limit(2))
        menu_items = res.scalars().all()
        
        if len(menu_items) >= 2:
            tx1 = Transaction(
                id=str(uuid.uuid4()),
                subtotal=50000.0,
                tax=5000.0,
                total_amount=55000.0,
                payment_method=PaymentMethodEnum.Cash,
                status=StatusEnum.Completed,
                order_type=OrderTypeEnum.Takeaway,
                timestamp=datetime.utcnow()
            )
            db.add(tx1)
            db.add(TransactionItem(
                id=str(uuid.uuid4()), transaction_id=tx1.id, menu_item_id=menu_items[0].id, 
                quantity=1, price_at_time=25000.0, cogs_per_unit=10000.0
            ))
            db.add(TransactionItem(
                id=str(uuid.uuid4()), transaction_id=tx1.id, menu_item_id=menu_items[1].id, 
                quantity=1, price_at_time=25000.0, cogs_per_unit=10000.0
            ))

            tx2 = Transaction(
                id=str(uuid.uuid4()),
                subtotal=75000.0,
                tax=7500.0,
                total_amount=82500.0,
                payment_method=PaymentMethodEnum.Cash,
                status=StatusEnum.Completed,
                order_type=OrderTypeEnum.Takeaway,
                timestamp=datetime.utcnow()
            )
            db.add(tx2)
            db.add(TransactionItem(
                id=str(uuid.uuid4()), transaction_id=tx2.id, menu_item_id=menu_items[0].id, 
                quantity=3, price_at_time=25000.0, cogs_per_unit=10000.0
            ))
            await db.commit()
            print("Inserted 2 test transactions.")

        # 2. Run validations
        print("\n--- KPIs ---")
        kpis = await get_kpis(timeframe="last_30_days", db=db, current_user=None)
        print(kpis)

        print("\n--- Basket Analysis ---")
        basket = await get_basket_analysis(timeframe="last_30_days", db=db, current_user=None)
        for item in basket:
            print(item)

if __name__ == "__main__":
    asyncio.run(run_tests())
