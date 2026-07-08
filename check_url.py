import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            await page.goto("http://localhost:5174/login", timeout=10000)
        except Exception:
            await page.goto("http://localhost:5173/login", timeout=10000)
            
        print("Logging in as able...")
        await page.locator('input[type="text"]').fill('able')
        await page.locator('input[type="password"]').fill('password123')
        await page.locator('button[type="submit"]').click()
        
        print("Waiting 3s for redirect...")
        await asyncio.sleep(3)
        
        url = page.url
        print(f"Current URL: {url}")
        
        text = await page.content()
        print("Content has error?", "Invalid username or password" in text)
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
