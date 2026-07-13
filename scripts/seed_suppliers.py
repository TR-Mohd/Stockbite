import asyncio
from app.database import AsyncSessionLocal
from app.models import Supplier
from sqlalchemy import delete

async def seed_suppliers():
    async with AsyncSessionLocal() as db:
        await db.execute(delete(Supplier))
        new_suppliers = [
            Supplier(id="SUP-JKT-26100", name="Jakarta Central Provisions", contact_person="Budi Santoso", email="budi@jktprovisions.com", phone="+62 812-3456-7890", address="Jl. Sudirman No. 1", specialization="fresh produce", is_active=True, region="JKT"),
            Supplier(id="SUP-BDO-26100", name="Bandung Dairy Co.", contact_person="Siti Aminah", email="siti@bandungdairy.com", phone="+62 22 1234-5678", address="Jl. Braga No. 10", specialization="dairy & milk", is_active=True, region="BDO"),
            Supplier(id="SUP-SBY-26100", name="Surabaya Meat Packers Int.", contact_person="Agus Wijaya", email="agus@sby-meat.com", phone="+62 813-9876-5432", address="Jl. Pemuda No. 5", specialization="poultry & meat", is_active=True, region="SBY"),
            Supplier(id="SUP-NAT-26100", name="Indofood Sukses Makmur", contact_person="Rina Melati", email="rina@indofood.com", phone="+62 21 8765-4321", address="Sudirman Plaza", specialization="dry goods & staples", is_active=True, region="NAT"),
            Supplier(id="SUP-DPS-26100", name="Bali Organic Farms", contact_person="Wayan Koster", email="wayan@baliorganic.com", phone="+62 819-1122-3344", address="Jl. Raya Ubud", specialization="fresh vegetables & fruits", is_active=True, region="DPS")
        ]
        db.add_all(new_suppliers)
        await db.commit()
        print("Suppliers seeded")

if __name__ == "__main__":
    asyncio.run(seed_suppliers())
