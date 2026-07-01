import asyncio
import httpx
from datetime import datetime, timedelta

async def test_api():
    async with httpx.AsyncClient() as client:
        # Login
        resp = await client.post("http://localhost:8000/auth/token", data={"username": "mohammed", "password": "password123"})
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        print("--- Testing Full History Fetch ---")
        resp = await client.get("http://localhost:8000/manager/orders", headers=headers)
        data = resp.json()
        print(f"Status Code: {resp.status_code}")
        print(f"Total orders returned: {data['total']}")
        if data['items']:
            first = data['items'][0]
            print(f"Sample Order:\n - ID: {first['id']}\n - Cashier: {first['cashier_name']}\n - Type: {first['order_type']}\n - Total: {first['total_amount']}")
        
        print("\n--- Testing Empty State (Future Date) ---")
        future_date = (datetime.now() + timedelta(days=365)).strftime('%Y-%m-%d')
        resp = await client.get(f"http://localhost:8000/manager/orders?date_from={future_date}", headers=headers)
        empty_data = resp.json()
        print(f"Status Code: {resp.status_code}")
        print(f"Total orders returned: {empty_data['total']}")
        print(f"Items array: {empty_data['items']}")

asyncio.run(test_api())
