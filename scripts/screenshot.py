import asyncio
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={'width': 1280, 'height': 800})
        
        # Go to login
        print("Logging in...")
        await page.goto('http://localhost:5173/login')
        await page.fill('input[type="text"]', 'daffa') # Assuming username is text
        await page.fill('input[type="password"]', 'password123')
        await page.click('button[type="submit"]')
        
        # Wait for redirect to POS
        print("Navigating to POS...")
        await page.wait_for_url('http://localhost:5173/pos', timeout=5000)
        
        # Add item to cart
        print("Adding item to cart...")
        await page.click('.menu-card', timeout=5000)
        
        # Open checkout modal
        print("Opening checkout modal...")
        await page.click('.pay-button')
        
        # Wait for modal to appear
        await page.wait_for_selector('.checkout-modal-content', state='visible')
        
        # Select Dine-In
        print("Filling form...")
        await page.click('.toggle-option:has-text("Dine-In")')
        
        # Fill Table no and Whatsapp (they might be standard inputs)
        # Using placeholders since they are more stable
        await page.fill('input[placeholder*="Table"]', '12')
        await page.fill('input[placeholder*="WhatsApp"]', '5551234')
        
        # Add email
        await page.click('button.add-email-btn')
        await page.fill('input[placeholder*="Email"]', 'test@test.com')
        
        # Select Cash
        await page.click('.payment-card:has-text("Cash")')
        
        # Fill amount
        await page.fill('.tendered-input', '500000')
        
        # Wait a moment for animations
        await asyncio.sleep(1)
        
        # Take screenshot of the modal
        print("Taking screenshot...")
        modal = await page.query_selector('.checkout-modal-content')
        await modal.screenshot(path='checkout_modal_expanded.png')
        print("Screenshot saved to checkout_modal_expanded.png")
        
        await browser.close()

asyncio.run(run())
