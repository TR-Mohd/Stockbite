import asyncio
import os
import sys
import httpx
from sqlalchemy.future import select

# Add root path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.database import AsyncSessionLocal
from app.models import Transaction

async def test_checkout():
    # 1. Login to get token
    async with httpx.AsyncClient(base_url="http://localhost:8000") as client:
        login_response = await client.post(
            "/auth/token",
            data={"username": "daffa", "password": "password123"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        if login_response.status_code != 200:
            print(f"Login failed: {login_response.text}")
            return
            
        token = login_response.json()["access_token"]
        print("Login successful.")

        # 2. Get menu items to add to cart
        menu_response = await client.get("/pos/menu", headers={"Authorization": f"Bearer {token}"})
        menu_items = menu_response.json()
        if not menu_items:
            print("No menu items found.")
            return
            
        item = menu_items[0]
        
        # 3. Submit checkout
        payload = {
            "payment_method": "Cash",
            "amount_tendered": 500000,
            "whatsapp": "5551234",
            "email": "test@test.com",
            "order_type": "Dine-In",
            "routing_number": "12",
            "items": [
                {
                    "menu_item_id": item["id"],
                    "quantity": 1,
                    "notes": "",
                    "modifier_ids": []
                }
            ]
        }
        
        checkout_response = await client.post(
            "/pos/checkout",
            json=payload,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        if checkout_response.status_code != 200:
            print(f"Checkout failed: {checkout_response.text}")
            return
            
        txn_id = checkout_response.json()["id"]
        print(f"Checkout API Call successful! Transaction ID: {txn_id}")
        
    # 4. Verify Database
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Transaction).where(Transaction.id == txn_id))
        txn = result.scalar_one_or_none()
        
        if not txn:
            print("Transaction not found in DB!")
            return
            
        print("\nDatabase Row Verification:")
        print(f"ID: {txn.id}")
        print(f"Order Type: {txn.order_type.value}")
        print(f"Routing Number (Table): {txn.routing_number}")
        print(f"WhatsApp: {txn.whatsapp}")
        print(f"Email: {txn.email}")
        print(f"Payment Method: {txn.payment_method.value}")
        print(f"Amount Tendered: {txn.amount_tendered}")
        print(f"Change Due: {txn.change}")

if __name__ == "__main__":
    asyncio.run(test_checkout())
