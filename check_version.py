import asyncio
import httpx
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from app.models import Ingredient
from sqlalchemy import select

async def main():
    from app.database import AsyncSessionLocal
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Ingredient).limit(1))
        ing = res.scalars().first()
        print(f"Before: version_id = {ing.version_id}, stock = {ing.stock_level}")
        
    async with httpx.AsyncClient() as client:
        resp = await client.post("http://localhost:8000/auth/token", data={
            "username": "abel", "password": "password123"
        })
        token = resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        url = f"http://localhost:8000/inventory/{ing.id}/adjust?amount=5&reason=API_Background"
        await client.post(url, headers=headers)
        
    async with AsyncSessionLocal() as session:
        res = await session.execute(select(Ingredient).where(Ingredient.id == ing.id))
        ing2 = res.scalars().first()
        print(f"After: version_id = {ing2.version_id}, stock = {ing2.stock_level}")

if __name__ == "__main__":
    asyncio.run(main())
