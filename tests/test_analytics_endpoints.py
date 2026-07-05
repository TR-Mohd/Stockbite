import os
import sys
import uuid
import pytest
from datetime import datetime
import urllib.request
import urllib.parse
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.database import AsyncSessionLocal, engine
from app.models import Transaction, TransactionItem, StatusEnum, PaymentMethodEnum, User, RoleEnum, MenuItem
from sqlalchemy import text
from sqlalchemy.future import select

if sys.platform == 'win32':
    import asyncio
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

BASE_URL = "http://localhost:8000"

def login(username, password):
    url = f"{BASE_URL}/auth/token"
    data = urllib.parse.urlencode({"username": username, "password": password}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def fetch_endpoint(endpoint, token):
    url = f"{BASE_URL}/manager/{endpoint}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return None

@pytest.mark.asyncio
async def test_analytics_endpoints():
    expected_mi1_qty = 3
    expected_mi2_qty = 1
    total_expected_revenue = 0
    from zoneinfo import ZoneInfo
    now_utc = datetime.utcnow().replace(tzinfo=ZoneInfo("UTC"))
    today_str = now_utc.astimezone(ZoneInfo("Asia/Jakarta")).strftime("%Y-%m-%d 00:00:00")
    
    async with AsyncSessionLocal() as db:
        await db.execute(text("TRUNCATE TABLE transaction_items CASCADE"))
        await db.execute(text("TRUNCATE TABLE transactions CASCADE"))
        await db.commit()

        temp_manager_id = str(uuid.uuid4())
        from app.auth import get_password_hash
        temp_manager = User(id=temp_manager_id, name="analytics_tester", username="analytics_tester", role=RoleEnum.Manager, hashed_password=get_password_hash("testpass"), is_active=True)
        db.add(temp_manager)
        
        res_mi = await db.execute(select(MenuItem))
        menu_items = res_mi.scalars().all()
        if len(menu_items) < 2:
            pytest.skip("Need at least 2 menu items to test.")
            
        mi1, mi2 = menu_items[0], menu_items[1]
        mi1_name = mi1.name
        mi2_name = mi2.name
        
        t1_total = mi1.price * 2 + mi2.price
        t1 = Transaction(id=str(uuid.uuid4()), total_amount=t1_total, payment_method=PaymentMethodEnum.Cash, status=StatusEnum.Completed, timestamp=datetime.utcnow(), cashier_id=temp_manager_id)
        ti1_1 = TransactionItem(id=str(uuid.uuid4()), transaction_id=t1.id, menu_item_id=mi1.id, quantity=2, price_at_time=mi1.price)
        ti1_2 = TransactionItem(id=str(uuid.uuid4()), transaction_id=t1.id, menu_item_id=mi2.id, quantity=1, price_at_time=mi2.price)
        
        t2_total = mi1.price * 1
        t2 = Transaction(id=str(uuid.uuid4()), total_amount=t2_total, payment_method=PaymentMethodEnum.Cash, status=StatusEnum.Completed, timestamp=datetime.utcnow(), cashier_id=temp_manager_id)
        ti2_1 = TransactionItem(id=str(uuid.uuid4()), transaction_id=t2.id, menu_item_id=mi1.id, quantity=1, price_at_time=mi1.price)
        
        total_expected_revenue = t1_total + t2_total
        
        db.add_all([t1, t2, ti1_1, ti1_2, ti2_1])
        await db.commit()
    
    token_data = login("analytics_tester", "testpass")
    assert "error" not in token_data, "Login failed"
    token = token_data["access_token"]
    
    # Best Sellers
    best_sellers = fetch_endpoint("analytics/best-sellers", token)
    print("BEST SELLERS:", best_sellers)
    mi1_result_qty = 0
    for bs in best_sellers:
        if bs["menu_item_name"] == mi1_name:
            mi1_result_qty = bs["total_sold"]
            break
    assert mi1_result_qty == expected_mi1_qty
    
    # Revenue Trend
    revenue_trend = fetch_endpoint("analytics/revenue-trend", token)
    print("REVENUE TREND:", revenue_trend)
    today_revenue = 0
    for rt in revenue_trend:
        if rt["date"] == today_str:
            today_revenue = rt["revenue"]
            break
    assert today_revenue == total_expected_revenue
    
    # Basket Analysis
    basket = fetch_endpoint("analytics/basket-analysis", token)
    pair_found = False
    expected_pair_names = set([mi1_name, mi2_name])
    for b in basket:
        if set([b["item1_name"], b["item2_name"]]) == expected_pair_names:
            pair_found = True
            assert b["frequency"] == 1
            break
    assert pair_found
    
    # KPIs cross-check
    kpis = fetch_endpoint("dashboard/kpis", token)
    assert kpis["gross_revenue"] == total_expected_revenue

    # Cleanup
    async with AsyncSessionLocal() as db:
        await db.execute(text("DELETE FROM transaction_items"))
        await db.execute(text("DELETE FROM transactions"))
        await db.execute(text("DELETE FROM users WHERE name = 'analytics_tester'"))
        await db.commit()
