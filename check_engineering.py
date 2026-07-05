import asyncio
import httpx

async def check():
    async with httpx.AsyncClient() as client:
        # Login
        login_data = {"username": "mohammed", "password": "password123"}
        token_res = await client.post("http://localhost:8000/auth/token", data=login_data)
        if token_res.status_code != 200:
            print(f"Login failed: {token_res.status_code} {token_res.text}")
            return
        
        token = token_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        response = await client.get("http://localhost:8000/manager/analytics/menu-engineering", headers=headers)
        if response.status_code == 200:
            data = response.json()
            print("Raw Data:", data)
            for item in data.get("matrix", []):
                if item["name"] == "Udang Keju":
                    print(f"Udang Keju Classification: {item['classification']}")
                    print(f"  Margin: {item['margin']}")
                    print(f"  COGS: {item['cogs']}")
                    print(f"  Price: {item['price']}")
                    break
        else:
            print(f"Failed to fetch: {response.status_code} {response.text}")

if __name__ == "__main__":
    asyncio.run(check())
