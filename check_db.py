import asyncio
import asyncpg
import json

async def main():
    conn = await asyncpg.connect('postgresql://postgres:postgres@localhost:5432/stockbite')
    row = await conn.fetchrow("SELECT is_active, role, hashed_password FROM users WHERE username='daffa'")
    if row:
        print(dict(row))
    else:
        print("User not found")
    await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
