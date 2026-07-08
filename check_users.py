import asyncio
from app.database import AsyncSessionLocal
from app.models import User
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User))
        users = result.scalars().all()
        for u in users:
            print(f"User: {u.username}, Role: {u.role}")

if __name__ == "__main__":
    asyncio.run(main())
