import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # First, login to get a token
        print("Logging in...")
        resp = await client.post("http://localhost:8000/auth/token", data={
            "username": "abel", "password": "password123"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Get an ingredient
        print("Fetching inventory...")
        resp = await client.get("http://localhost:8000/inventory/", headers=headers)
        ingredients = resp.json()
        ingredient_id = ingredients[0]["id"]
        
        print(f"Testing concurrency on {ingredient_id}...")
        
        # Make two simultaneous requests
        async def make_req(amount, reason):
            url = f"http://localhost:8000/inventory/{ingredient_id}/adjust?amount={amount}&reason={reason}"
            resp = await client.post(url, headers=headers)
            print(f"Request {reason} finished with status {resp.status_code}")
            try:
                print(resp.json())
            except:
                pass
            return resp
            
        # Fire both at exactly the same time
        results = await asyncio.gather(
            make_req(1, "API_Background"),
            make_req(-1, "Physical count correction")
        )
        print("Done.")

if __name__ == "__main__":
    asyncio.run(main())
