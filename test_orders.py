import asyncio
import re
import random
from playwright.async_api import async_playwright, expect

ORDERS = [
    {
        "type": "Takeaway",
        "contact_type": "email",
        "contact": "bayu.saputra550@gmail.com",
        "items": [
            {"name": "Udang Keju", "qty": 1, "modifiers": []}
        ]
    }
]

async def run_orders():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)
        context = await browser.new_context()
        page = await context.new_page()

        page.on("dialog", lambda dialog: dialog.accept())

        print("Navigating to POS...")
        await page.goto("http://localhost:5173/pos")

        if "login" in page.url:
            print("Logging in...")
            await page.locator("#username").fill("daffa")
            await page.locator("#password").fill("password123")
            await page.get_by_role("button", name="Sign In").click()
            await page.wait_for_url("**/pos")
            print("Logged in!")
            await asyncio.sleep(1) # wait for menu to load

        for idx, order in enumerate(ORDERS):
            print(f"\nProcessing Order {idx + 1}...")

            for item in order["items"]:
                item_name = item["name"]
                qty = item["qty"]
                modifiers = item["modifiers"]

                print(f"  Adding {qty}x {item_name}")

                # Find menu card by filtering elements containing the title text
                menu_card = page.locator('.menu-item-card').filter(has=page.locator('.menu-item-title', has_text=item_name)).first
                await menu_card.click()

                if modifiers:
                    modal = page.locator('.checkout-modal-container')
                    await expect(modal).to_be_visible()

                    for mod in modifiers:
                        print(f"    Selecting modifier: {mod}")
                        # Strict match or filter
                        await page.locator('label').filter(has_text=mod).first.click()

                    await page.get_by_test_id('btn-add-to-order').click()
                    await expect(modal).not_to_be_visible()

                if qty > 1:
                    # Cart item locator
                    cart_item = page.locator('.cart-item').filter(has=page.locator('.cart-item-name', has_text=item_name)).first
                    for _ in range(qty - 1):
                        await cart_item.locator('.btn-plus').click()
                        await asyncio.sleep(0.1)

            print("  Making Order...")
            await page.get_by_test_id('btn-make-order').click()

            checkout_modal = page.locator('.checkout-modal-container')
            await expect(checkout_modal).to_be_visible()

            if order["type"] == "Takeaway":
                await page.get_by_test_id('btn-takeaway').click()
            else:
                await page.get_by_test_id('btn-dine-in').click()
                await page.get_by_test_id('input-table-number').fill(order["table"])

            if order["contact_type"] == "email":
                await page.locator('.btn-add-email').click()
                await page.locator('#checkout-email').fill(order["contact"])
            else:
                await page.locator('#checkout-whatsapp').fill(order["contact"])

            payment_method = random.choice(["Cash", "QRIS"])
            print(f"  Payment: {payment_method}")

            if payment_method == "Cash":
                await page.locator('.payment-card').nth(0).click()

                # Parse the total amount text
                total_text = await page.locator('.checkout-modal-amount-value').first.inner_text()
                total_val = int(re.sub(r'\D', '', total_text))
                
                # Rendered amount: slightly more or equal
                tendered = ((total_val // 10000) + 1) * 10000
                if tendered < total_val:
                    tendered = total_val
                
                await page.locator('#checkout-tendered').fill(str(tendered))
            else:
                await page.locator('.payment-card').nth(1).click()

            await page.get_by_test_id('btn-confirm-checkout').click()
            
            # Wait for checkout completion
            await expect(checkout_modal).not_to_be_visible(timeout=10000)
            print(f"Order {idx + 1} completed!")
            await asyncio.sleep(1)

        await browser.close()
        print("\nAll 3 test orders completed successfully.")

if __name__ == "__main__":
    asyncio.run(run_orders())
