"""
Seed script to create test users in the database
Run with: python seed_users.py
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.future import select
from app.models import User, RoleEnum
from app.auth import get_password_hash
from app.database import DATABASE_URL

async def seed_users():
    """Create initial test users"""
    
    # Create async engine
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    # Create session factory
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with async_session() as session:
        # Check if Daffa already exists
        result = await session.execute(
            select(User).where(User.name == "Daffa")
        )
        existing_user = result.scalars().first()
        
        if existing_user:
            print(f"User 'Daffa' already exists with ID: {existing_user.id}")
        else:
            # Create test users
            test_users = [
                {
                    "name": "Daffa",
                    "role": RoleEnum.Manager,
                    "password": "password123"
                },
                {
                    "name": "Abel",
                    "role": RoleEnum.Cashier,
                    "password": "password123"
                },
                {
                    "name": "Anita",
                    "role": RoleEnum.Warehouse,
                    "password": "password123"
                },
                {
                    "name": "Farrell",
                    "role": RoleEnum.Cashier,
                    "password": "password123"
                },
                {
                    "name": "Mohammed",
                    "role": RoleEnum.Manager,
                    "password": "password123"
                },
            ]
            
            for user_data in test_users:
                user = User(
                    name=user_data["name"],
                    role=user_data["role"],
                    hashed_password=get_password_hash(user_data["password"])
                )
                session.add(user)
                print(f"Creating user: {user_data['name']} ({user_data['role'].value})")
            
            await session.commit()
            print("\n✓ All test users created successfully!")
            print("\nTest credentials:")
            for user_data in test_users:
                print(f"  Username: {user_data['name']}, Password: {user_data['password']}")

if __name__ == "__main__":
    asyncio.run(seed_users())
