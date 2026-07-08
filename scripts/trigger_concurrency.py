import asyncio
import os
import urllib.request
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        page.on("response", lambda response: print("<<", response.status, response.url))
        
        # 1. Login properly
        print("Navigating to login...")
        try:
            await page.goto("http://localhost:5174/login", timeout=10000)
            base_url = "http://localhost:5174"
        except Exception:
            await page.goto("http://localhost:5173/login", timeout=10000)
            base_url = "http://localhost:5173"
            
        print("Logging in as abel...")
        await page.locator('input[type="text"]').fill('abel')
        await page.locator('input[type="password"]').fill('password123')
        await page.locator('button[type="submit"]').click()
        
        # 2. Wait for redirect
        print("Waiting for login to complete...")
        await asyncio.sleep(2) # just wait a bit for auth token to be set
        
        # 3. Explicitly go to inventory
        print("Going to inventory...")
        await page.goto(f"{base_url}/inventory")
        await page.wait_for_selector('table', timeout=10000)
        await asyncio.sleep(2)
        
        # 4. Find the first ingredient in the table and click Adjust Stock
        print("Opening adjust stock modal...")
        await page.locator('tr').nth(1).locator('button[title="Adjust Stock"]').click()
        await asyncio.sleep(1)
        
        # 5. Fill the form with new stock and unit cost
        print("Filling form...")
        await page.locator('input[type="number"]').first.fill('999')
        await page.locator('input[type="number"]').nth(1).fill('5000')
        # Use precise locator for the reason select inside the modal
        await page.locator('.modal-select').nth(1).select_option(value="Physical count correction")
        await asyncio.sleep(1)
        
        # 6. Extract token from local storage to make background API call
        print("Extracting token for background API call...")
        token = await page.evaluate("localStorage.getItem('token')")
        
        if not token:
            print("Token not found!")
            return
            
        # Get the selected ingredient ID from the select element
        ingredient_id = await page.locator('.modal-select').first.input_value()
        print(f"Ingredient ID: {ingredient_id}")
        
        # 7. Make background API call to adjust stock (simulating race condition)
        print("Making background API call to trigger optimistic locking version bump...")
        headers = {"Authorization": f"Bearer {token}"}
        url = f"http://localhost:8000/inventory/{ingredient_id}/adjust?amount=1&reason=API_Background"
        
        def make_request():
            try:
                req = urllib.request.Request(url, method="POST", headers=headers)
                with urllib.request.urlopen(req) as resp:
                    print("Background API response:", resp.status)
            except urllib.error.HTTPError as e:
                print("Failed background req HTTP error", e.code)
            except Exception as e:
                print("Failed background req", e)
                
        # Launch background request without awaiting it yet
        task = asyncio.create_task(asyncio.to_thread(make_request))
        
        # 8. Immediately click submit in the UI
        print("Clicking submit in UI...")
        await page.locator('button:has-text("Confirm Adjustment")').click()
        
        # Wait for the background request to finish
        await task
        
        # 9. Wait for the error banner to appear
        print("Waiting for error banner...")
        try:
            await page.locator('.inventory-error-banner').wait_for(timeout=5000, state="visible")
            print("Error banner found!")
        except Exception as e:
            print("Error banner did not appear!", e)
        
        await asyncio.sleep(1)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
