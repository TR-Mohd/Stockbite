import asyncio
from playwright.async_api import async_playwright
import datetime

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})
        
        # Go to login
        print("Logging in as manager...")
        await page.goto('http://localhost:5173/login')
        await page.fill('input[placeholder="Username"]', 'mohammed') # Manager account
        await page.fill('input[placeholder="Password"]', 'password123')
        await page.click('button[type="submit"]')
        
        # Wait for redirect to dashboard
        print("Waiting for dashboard...")
        await page.wait_for_url('http://localhost:5173/manager/dashboard', timeout=5000)
        
        # Go to Order History
        print("Navigating to Order History...")
        await page.goto('http://localhost:5173/manager/orders')
        
        # Wait for table to load
        print("Waiting for data to load...")
        # Since we just checked out successfully in the previous phase, we should have data
        await page.wait_for_selector('table', state='visible', timeout=5000)
        await asyncio.sleep(2) # Give it a second to render data
        
        # Take screenshot of loaded state
        print("Taking screenshot of loaded data...")
        await page.screenshot(path='order_history_loaded.png', full_page=True)
        print("Saved order_history_loaded.png")
        
        # Test empty state by setting date to far future
        print("Filtering to future date to test empty state...")
        future_date = (datetime.datetime.now() + datetime.timedelta(days=365)).strftime('%Y-%m-%d')
        await page.fill('input[type="date"]', future_date) # Fills the first date input (Date From)
        
        await asyncio.sleep(2) # Wait for fetch
        
        # Take screenshot of empty state
        print("Taking screenshot of empty state...")
        await page.screenshot(path='order_history_empty.png', full_page=True)
        print("Saved order_history_empty.png")
        
        await browser.close()
        print("Done!")

asyncio.run(run())
