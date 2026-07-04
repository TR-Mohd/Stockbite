import asyncio
import sys
import os

# Add the project root to sys.path so we can import 'app'
sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from sqlalchemy import text
from app.database import AsyncSessionLocal, engine
from app.models import MenuItem, ItemModifierGroup, ItemModifier

async def seed():
    async with AsyncSessionLocal() as session:
        print("Clearing existing menu items and modifiers...")
        # Order matters for foreign keys
        await session.execute(text("DELETE FROM item_modifiers"))
        await session.execute(text("DELETE FROM item_modifier_groups"))
        await session.execute(text("DELETE FROM transaction_items")) # Need to clear these if they reference menu items, or just CASCADE
        # Wait, the easiest way to avoid FK violation is just clear them:
        await session.execute(text("DELETE FROM transaction_item_modifiers"))
        await session.execute(text("DELETE FROM transaction_items"))
        await session.execute(text("DELETE FROM modifier_recipes"))
        await session.execute(text("DELETE FROM recipes"))
        await session.execute(text("DELETE FROM menu_items"))
        await session.commit()

        print("Seeding Foods...")
        foods = []
        
        item1 = MenuItem(name="Spicy Indonesian Noodle", price=15000, category="Foods")
        group1 = ItemModifierGroup(menu_item=item1, name="Heat Level", is_required=True, min_selections=1, max_selections=1)
        mod1_1 = ItemModifier(group=group1, name="Level 6", price_adjustment=0)
        mod1_2 = ItemModifier(group=group1, name="Level 8", price_adjustment=0)
        foods.extend([item1, group1, mod1_1, mod1_2])

        item2 = MenuItem(name="Udang Keju", price=20000, category="Foods")
        foods.append(item2)

        item3 = MenuItem(name="Chicken Shawarma", price=25000, category="Foods")
        group3 = ItemModifierGroup(menu_item=item3, name="Add-ons", is_required=False, min_selections=0, max_selections=2)
        mod3_1 = ItemModifier(group=group3, name="Extra Garlic Sauce", price_adjustment=3000)
        mod3_2 = ItemModifier(group=group3, name="Extra Pickles", price_adjustment=2000)
        foods.extend([item3, group3, mod3_1, mod3_2])

        item4 = MenuItem(name="Triple Whopper Jr with Cheese", price=45000, category="Foods")
        foods.append(item4)

        item5 = MenuItem(name="Nasi Goreng Spesial", price=20000, category="Foods")
        group5 = ItemModifierGroup(menu_item=item5, name="Heat Level", is_required=True, min_selections=1, max_selections=1)
        mod5_1 = ItemModifier(group=group5, name="Not Spicy", price_adjustment=0)
        mod5_2 = ItemModifier(group=group5, name="Medium", price_adjustment=0)
        mod5_3 = ItemModifier(group=group5, name="Very Spicy", price_adjustment=0)
        foods.extend([item5, group5, mod5_1, mod5_2, mod5_3])

        item6 = MenuItem(name="Sate Ayam (10 pcs)", price=25000, category="Foods")
        group6 = ItemModifierGroup(menu_item=item6, name="Sauce Type", is_required=True, min_selections=1, max_selections=1)
        mod6_1 = ItemModifier(group=group6, name="Peanut Sauce", price_adjustment=0)
        mod6_2 = ItemModifier(group=group6, name="Sweet Soy Sauce", price_adjustment=0)
        foods.extend([item6, group6, mod6_1, mod6_2])

        for f in foods:
            session.add(f)
            
        print("Seeding Beverages...")
        beverages = [
            MenuItem(name="Thai Tea", price=10000, category="Beverage"),
            MenuItem(name="Thai Green Tea", price=12000, category="Beverage"),
            MenuItem(name="Milo", price=10000, category="Beverage"),
            MenuItem(name="Teh Tarik", price=10000, category="Beverage"),
            MenuItem(name="Es Jeruk", price=12000, category="Beverage"),
            MenuItem(name="Iced Lemon Tea", price=15000, category="Beverage")
        ]
        
        for bev in beverages:
            session.add(bev)
            grp = ItemModifierGroup(menu_item=bev, name="Ice Level", is_required=True, min_selections=1, max_selections=1)
            session.add(grp)
            session.add(ItemModifier(group=grp, name="Normal Ice", price_adjustment=0))
            session.add(ItemModifier(group=grp, name="Less Ice", price_adjustment=0))
            session.add(ItemModifier(group=grp, name="No Ice", price_adjustment=0))

        await session.commit()
        print("Database seeded successfully with realistic POS menu data!")

if __name__ == "__main__":
    asyncio.run(seed())
