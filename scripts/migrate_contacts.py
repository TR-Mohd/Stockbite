import asyncio
import os
import sys

# Add the root project directory to the path so we can import app modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import AsyncSessionLocal
from app.models import Transaction
from sqlalchemy.future import select

async def run_migration():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Transaction))
        transactions = result.scalars().all()
        
        comma_split_count = 0
        at_split_count = 0
        null_count = 0
        whatsapp_only_count = 0
        
        for txn in transactions:
            contact = txn.customer_contact
            if not contact:
                null_count += 1
                continue
                
            contact = contact.strip()
            
            if ',' in contact:
                # Comma split
                parts = contact.split(',', 1)
                txn.whatsapp = parts[0].strip() or None
                txn.email = parts[1].strip() or None
                comma_split_count += 1
            elif '@' in contact:
                # Email only
                txn.email = contact
                at_split_count += 1
            else:
                # WhatsApp only
                txn.whatsapp = contact
                whatsapp_only_count += 1
                
        await db.commit()
        
        print("Data Migration Audit Report")
        print("===========================")
        print(f"Total Transactions Processed: {len(transactions)}")
        print(f"- Split by comma (WhatsApp & Email): {comma_split_count}")
        print(f"- Detected as Email only (contains @): {at_split_count}")
        print(f"- Assumed WhatsApp only (no comma, no @): {whatsapp_only_count}")
        print(f"- Empty/Null contact: {null_count}")

if __name__ == "__main__":
    asyncio.run(run_migration())
