import asyncio
import re
import random
from playwright.async_api import async_playwright, expect

async def parse_orders(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    orders = []
    order_blocks = re.split(r'### Order \d+', content)[1:]
    
    for block in order_blocks:
        lines = [line.strip() for line in block.strip().split('\n') if line.strip()]
        
        order = {
            "type": "",
            "table": "",
            "contact_type": "",
            "contact": "",
            "items": []
        }
        
        for line in lines:
            if line.startswith("- **Type:**"):
                type_match = re.search(r'\*\*Type:\*\* (Dine-in|Takeaway)', line)
                if type_match:
                    order["type"] = type_match.group(1)
                
                table_match = re.search(r'Table (\d+)', line)
                if table_match:
                    order["table"] = table_match.group(1)
            
            elif line.startswith("- **Customer:**"):
                phone_match = re.search(r'phone: ([\d\-\+]+)', line)
                email_match = re.search(r'email: ([\w\.\-\+]+@[\w\.\-]+)', line)
                
                if phone_match:
                    order["contact_type"] = "phone"
                    order["contact"] = phone_match.group(1).replace("-", "").replace("+", "").strip()
                elif email_match:
                    order["contact_type"] = "email"
                    order["contact"] = email_match.group(1).strip()
            
            elif line.startswith("- ") and "x " in line:
                # E.g.: - 3x Spicy Indonesian Noodle [Heat Level: Level 8]
                # E.g.: - 1x Chicken Shawarma [Add-ons: None]
                match = re.search(r'- (\d+)x (.*?)(?: \[(.*?)\])?$', line)
                if match:
                    qty = int(match.group(1))
                    name = match.group(2).strip()
                    mods_str = match.group(3)
                    
                    modifiers = []
                    if mods_str and "None" not in mods_str:
                        # Split by comma if multiple modifier groups
                        # E.g. "Heat Level: Level 8, Add-ons: Extra Pickles"
                        mod_parts = [m.strip() for m in mods_str.split(',')]
                        for part in mod_parts:
                            if ":" in part:
                                mod_val = part.split(':', 1)[1].strip()
                                modifiers.append(mod_val)
                    
                    order["items"].append({
                        "name": name,
                        "qty": qty,
                        "modifiers": modifiers
                    })
        orders.append(order)
    return orders

async def run_all_orders(filepath):
    orders = await parse_orders(filepath)
    print(f"Parsed {len(orders)} orders.")
    
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
            await asyncio.sleep(1) 

        for idx, order in enumerate(orders):
            print(f"\nProcessing Order {idx + 1}/{len(orders)}...")

            for item in order["items"]:
                item_name = item["name"]
                qty = item["qty"]
                modifiers = item["modifiers"]

                print(f"  Adding {qty}x {item_name}")

                menu_card = page.locator('.menu-item-card').filter(has=page.locator('.menu-item-title', has_text=item_name)).first
                await menu_card.click()

                modal = page.locator('.checkout-modal-container')
                try:
                    await expect(modal).to_be_visible(timeout=1000)
                    modal_opened = True
                except Exception:
                    modal_opened = False
                
                if modal_opened:
                    for mod in modifiers:
                        print(f"    Selecting modifier: {mod}")
                        await page.locator('label').filter(has_text=mod).first.click()
                    await page.get_by_test_id('btn-add-to-order').click()
                    await expect(modal).not_to_be_visible()

                if qty > 1:
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

                total_text = await page.locator('.checkout-modal-amount-value').first.inner_text()
                total_val = int(re.sub(r'\D', '', total_text))
                
                tendered = ((total_val // 10000) + 1) * 10000
                if tendered < total_val:
                    tendered = total_val
                
                await page.locator('#checkout-tendered').fill(str(tendered))
            else:
                await page.locator('.payment-card').nth(1).click()

            await page.get_by_test_id('btn-confirm-checkout').click()
            
            await expect(checkout_modal).not_to_be_visible(timeout=10000)
            print(f"Order {idx + 1} completed!")
            await asyncio.sleep(1)

        await browser.close()
        print("\nAll orders completed successfully.")

if __name__ == "__main__":
    asyncio.run(run_all_orders(r"C:\Users\JC\Desktop\randomized_orders_list.md"))
