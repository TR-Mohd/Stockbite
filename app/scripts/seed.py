import asyncio
import sys
import os

# Ensure the app module can be found
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from app.database import AsyncSessionLocal
from app.models import Supplier, Ingredient, User, RoleEnum, MenuItem, Recipe
from app.auth import get_password_hash
from sqlalchemy.future import select

async def seed_db():
    async with AsyncSessionLocal() as session:
        from app.models import Transaction, TransactionItem
        print("Checking if database already has transactions...")
        result_ti = await session.execute(select(TransactionItem))
        for ti in result_ti.scalars().all():
            await session.delete(ti)
        result_t = await session.execute(select(Transaction))
        for t in result_t.scalars().all():
            await session.delete(t)
        await session.commit()

        print("Checking if database already has recipes and menu items...")
        result_recipes = await session.execute(select(Recipe))
        for r in result_recipes.scalars().all():
            await session.delete(r)
        
        result_menu = await session.execute(select(MenuItem))
        for m in result_menu.scalars().all():
            await session.delete(m)
        await session.commit()

        print("Checking if database already has ingredients...")
        result = await session.execute(select(Ingredient))
        existing_ingredients = result.scalars().all()
        
        if existing_ingredients:
            print("Database already contains ingredients. Clearing them...")
            for ing in existing_ingredients:
                await session.delete(ing)
            await session.commit()
            
        print("Checking if database already has users...")
        result = await session.execute(select(User))
        existing_users = result.scalars().all()
        
        if existing_users:
            print("Database already contains users. Clearing them...")
            for u in existing_users:
                await session.delete(u)
            await session.commit()
            
        print("Seeding team users...")
        users = [
            User(name="mohammed", role=RoleEnum.Manager, hashed_password=get_password_hash("password123")),
            User(name="daffa", role=RoleEnum.Cashier, hashed_password=get_password_hash("password123")),
            User(name="anita", role=RoleEnum.Manager, hashed_password=get_password_hash("password123")),
            User(name="abel", role=RoleEnum.Warehouse, hashed_password=get_password_hash("password123")),
            User(name="farrell", role=RoleEnum.Manager, hashed_password=get_password_hash("password123")),
        ]
        session.add_all(users)
        await session.commit()
            
        print("Seeding dummy data...")
        
        # Suppliers
        s1 = Supplier(name="Fresh Farms Co.", specialization="Produce", phone="555-0100", email="contact@freshfarms.com")
        s2 = Supplier(name="Sysco Regional", specialization="General", phone="555-0200", email="orders@syscoregional.com")
        s3 = Supplier(name="Local Bakery Supply", specialization="Bakery", phone="555-0300", email="sales@localbakery.com")
        
        session.add_all([s1, s2, s3])
        await session.commit()
        await session.refresh(s1)
        await session.refresh(s2)
        await session.refresh(s3)
        
        # Ingredients
        ingredients = [
            # Meat
            Ingredient(name="Ground Beef", stock_level=5.0, unit="kg", reorder_point=10.0, category="Meat", preferred_supplier_id=s2.id),
            Ingredient(name="Chicken Breast", stock_level=25.0, unit="kg", reorder_point=15.0, category="Meat", preferred_supplier_id=s2.id),
            Ingredient(name="Bacon", stock_level=8.0, unit="kg", reorder_point=10.0, category="Meat", preferred_supplier_id=s2.id),
            
            # Bakery
            Ingredient(name="Burger Buns", stock_level=150.0, unit="pcs", reorder_point=50.0, category="Bakery", preferred_supplier_id=s3.id),
            Ingredient(name="Hotdog Buns", stock_level=40.0, unit="pcs", reorder_point=30.0, category="Bakery", preferred_supplier_id=s3.id),
            Ingredient(name="Tortilla Wraps", stock_level=120.0, unit="pcs", reorder_point=40.0, category="Bakery", preferred_supplier_id=s3.id),
            
            # Produce
            Ingredient(name="Lettuce", stock_level=2.0, unit="heads", reorder_point=5.0, category="Produce", preferred_supplier_id=s1.id),
            Ingredient(name="Tomatoes", stock_level=0.0, unit="kg", reorder_point=3.0, category="Produce", preferred_supplier_id=s1.id),
            Ingredient(name="Onions", stock_level=12.0, unit="kg", reorder_point=5.0, category="Produce", preferred_supplier_id=s1.id),
            Ingredient(name="Potatoes", stock_level=50.0, unit="kg", reorder_point=20.0, category="Produce", preferred_supplier_id=s1.id),
            
            # Dairy
            Ingredient(name="Cheddar Cheese", stock_level=4.0, unit="kg", reorder_point=5.0, category="Dairy", preferred_supplier_id=s2.id),
            Ingredient(name="Milk", stock_level=15.0, unit="L", reorder_point=10.0, category="Dairy", preferred_supplier_id=s1.id),
            Ingredient(name="Butter", stock_level=6.0, unit="kg", reorder_point=5.0, category="Dairy", preferred_supplier_id=s2.id),
            
            # Pantry
            Ingredient(name="Ketchup", stock_level=8.0, unit="bottles", reorder_point=10.0, category="Pantry", preferred_supplier_id=s2.id),
            Ingredient(name="Mustard", stock_level=12.0, unit="bottles", reorder_point=10.0, category="Pantry", preferred_supplier_id=s2.id),
            Ingredient(name="Mayonnaise", stock_level=2.0, unit="tubs", reorder_point=4.0, category="Pantry", preferred_supplier_id=s2.id),
            Ingredient(name="Salt", stock_level=10.0, unit="kg", reorder_point=5.0, category="Pantry", preferred_supplier_id=s2.id),
            Ingredient(name="Black Pepper", stock_level=3.0, unit="kg", reorder_point=2.0, category="Pantry", preferred_supplier_id=s2.id),
            
            # Beverages
            Ingredient(name="Cola", stock_level=48.0, unit="cans", reorder_point=100.0, category="Beverages", preferred_supplier_id=s2.id),
            Ingredient(name="Lemonade", stock_level=60.0, unit="bottles", reorder_point=50.0, category="Beverages", preferred_supplier_id=s1.id),
            Ingredient(name="Coffee Beans", stock_level=0.0, unit="kg", reorder_point=5.0, category="Beverages", preferred_supplier_id=s2.id),
        ]
        
        session.add_all(ingredients)
        await session.commit()
        
        # Refresh to get IDs
        for ing in ingredients:
            await session.refresh(ing)
            
        print("Checking if database already has menu items...")
        result = await session.execute(select(MenuItem))
        existing_menu_items = result.scalars().all()
        
        if existing_menu_items:
            print("Database already contains menu items. Clearing them (and recipes)...")
            result_recipes = await session.execute(select(Recipe))
            existing_recipes = result_recipes.scalars().all()
            for r in existing_recipes:
                await session.delete(r)
            for m in existing_menu_items:
                await session.delete(m)
            await session.commit()

        print("Seeding POS Menu Items...")
        
        m1 = MenuItem(name="Classic Burger", price=45000, category="Foods")
        m2 = MenuItem(name="Cheeseburger", price=55000, category="Foods")
        m3 = MenuItem(name="Chicken Sandwich", price=40000, category="Foods")
        m4 = MenuItem(name="Fries", price=20000, category="Foods")
        
        m5 = MenuItem(name="Cola", price=15000, category="Beverage")
        m6 = MenuItem(name="Fresh Lemonade", price=25000, category="Beverage")
        m7 = MenuItem(name="Iced Coffee", price=28000, category="Beverage")
        
        m8 = MenuItem(name="Extra Cheese", price=8000, category="Other")
        m9 = MenuItem(name="Bacon Add-on", price=12000, category="Other")
        
        menu_items = [m1, m2, m3, m4, m5, m6, m7, m8, m9]
        session.add_all(menu_items)
        await session.commit()
        
        for m in menu_items:
            await session.refresh(m)
            
        print("Seeding Recipes...")
        # Just simple recipes linking to ingredients
        recipes = [
            Recipe(menu_item_id=m1.id, ingredient_id=ingredients[0].id, quantity=0.2), # Ground Beef
            Recipe(menu_item_id=m1.id, ingredient_id=ingredients[3].id, quantity=1.0), # Burger Bun
            Recipe(menu_item_id=m5.id, ingredient_id=ingredients[16].id, quantity=1.0), # Cola Can
        ]
        session.add_all(recipes)
        await session.commit()

        print(f"Successfully seeded {len(ingredients)} ingredients, 3 suppliers, and {len(menu_items)} menu items!")

if __name__ == "__main__":
    asyncio.run(seed_db())
