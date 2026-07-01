import { test, expect } from '@playwright/test';

test.describe('Cashier Happy Path & Edge Cases', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to POS dashboard
    // Note: Assuming no authentication is strictly blocking the root dashboard in this mocked state,
    // or we may need to mock the authentication state. For now, navigate directly.
    await page.goto('/');
  });

  test('Step A: Modifier & Cart Stacking', async ({ page }) => {
    // Intercept menu API if necessary, but assuming the dev server serves real/seeded data.
    
    // Find an item with modifiers. For stability, we assume "Spicy Noodle" exists, 
    // or we just click the first item that opens the customization modal.
    // If the local DB has seeded data, we'll try to trigger an item with modifiers.
    // Wait for menu items to load
    await page.waitForSelector('.menu-item-card');
    
    // We mock the menu response to ensure we have an item with modifiers
    await page.route('**/pos/menu', async route => {
      const json = [
        {
          id: 999,
          name: "Spicy Noodle",
          price: 25000,
          stock: 100,
          category: "Food",
          modifier_groups: [
            {
              id: 1,
              name: "Spiciness Level",
              min_selections: 1,
              max_selections: 1,
              modifiers: [
                { id: 101, name: "Level 6", price_adjustment: 0 },
                { id: 102, name: "Level 8", price_adjustment: 2000 }
              ]
            }
          ]
        }
      ];
      await route.fulfill({ json });
    });

    await page.reload();
    await page.waitForSelector('.menu-item-card');

    // Add item first time
    await page.getByTestId('menu-item-999').click();
    
    // Customization modal should appear
    const modal = page.locator('.checkout-modal-container').filter({ hasText: 'Customize Spicy Noodle' });
    await expect(modal).toBeVisible();

    // Select "Level 8"
    await page.getByTestId('modifier-102').click();

    // Add to order
    await page.getByTestId('btn-add-to-order').click();

    // Verify it's in the cart
    const cartItem = page.getByTestId('cart-item-999');
    await expect(cartItem).toBeVisible();
    await expect(cartItem.getByTestId('cart-item-qty')).toHaveText('1');

    // Add exact same item again
    await page.getByTestId('menu-item-999').click();
    await expect(modal).toBeVisible();
    await page.getByTestId('modifier-102').click();
    await page.getByTestId('btn-add-to-order').click();

    // Verify quantity incremented to 2 and only 1 row exists
    await expect(cartItem).toHaveCount(1);
    await expect(cartItem.getByTestId('cart-item-qty')).toHaveText('2');
  });

  test('Step B: Routing & Checkout', async ({ page }) => {
    // Add a simple item to cart to enable checkout
    await page.route('**/pos/menu', async route => {
      const json = [
        { id: 888, name: "Plain Rice", price: 5000, stock: 100, category: "Food", modifier_groups: [] }
      ];
      await route.fulfill({ json });
    });

    await page.route('**/pos/checkout', async route => {
      await route.fulfill({ json: { transaction_id: 12345, status: "completed" } });
    });

    await page.reload();
    await page.waitForSelector('.menu-item-card');
    await page.getByTestId('menu-item-888').click();

    // Click Make Order
    await page.getByTestId('btn-make-order').click();
    
    // Toggle Dine-In
    await page.getByTestId('btn-dine-in').click();

    // Verify Table Number field appears
    const tableInput = page.getByTestId('input-table-number');
    await expect(tableInput).toBeVisible();

    // Attempt to confirm without table number
    const confirmBtn = page.getByTestId('btn-confirm-checkout');
    await expect(confirmBtn).toBeDisabled();

    // Enter Table 5
    await tableInput.fill('Table 5');
    await expect(confirmBtn).toBeEnabled();

    // Set up dialog listener for success alert
    const dialogPromise = page.waitForEvent('dialog');
    
    // Finalize checkout
    await confirmBtn.click();

    // Verify success notification
    const dialog = await dialogPromise;
    expect(dialog.message()).toContain('Payment Successful');
    await dialog.accept();

    // Verify cart is cleared
    await expect(page.getByTestId('cart-item-888')).not.toBeVisible();
  });
});
