# Known Security Issues & Technical Debt

## Unmaintained Authentication Dependencies
- **python-jose**: Used for JWT token generation and validation. This library is effectively unmaintained and has known open CVEs (e.g., algorithm confusion vulnerabilities).
- **passlib**: Used for password hashing abstraction. It is unmaintained and throws deprecation warnings on modern Python versions (3.11+). Because it parses the internal versions of `bcrypt`, it is incompatible with `bcrypt >= 4.0.0`.
- **bcrypt**: Pinned to `3.2.2`. We cannot update to the latest version (`5.0.0`) without breaking `passlib`.

**Reason for Acceptance**: These are accepted as technical debt for the MVP phase. Swapping out core authentication libraries mid-project introduces a significant risk of breaking working authentication during the security review. They should be scheduled for replacement in a future release.

## Client-Side JWT Storage
- **localStorage**: The JWT access token is currently stored in the browser's `localStorage` via the frontend Zustand store (`authStore.js`). This exposes the token to Cross-Site Scripting (XSS) attacks, where malicious scripts could read the token and hijack the session.

**Reason for Acceptance**: Accepted as technical debt for the MVP phase due to the extremely short 15-minute token lifetime, which severely limits the exposure window of a hijacked token. The "correct" fix for future reference is to transition to an `httpOnly`, `Secure`, `SameSite=Strict` cookie-based authentication flow where the browser automatically attaches the token and JavaScript cannot access it.

## API Rate Limiting
- **Checkout Volumetric Limits**: There are currently no volumetric limits on the `/pos/checkout` endpoint. An authenticated cashier session can fire rapid, sequential transactions without being throttled.

**Reason for Acceptance**: Accepted as technical debt for the MVP phase. This should be revisited alongside any future kitchen-workflow or Order Fulfillment Time feature, since transaction-velocity anomaly detection naturally belongs with that workflow rather than as a standalone rate limiter now.

## COGS Breakdown Pagination
- **In-Memory Pagination**: The `/manager/dashboard/kpis/cogs-breakdown` endpoint currently fetches all menu items in memory before paginating.

**Reason for Acceptance**: Accepted as technical debt because it is perfectly performant for the current small menu size, though it may not scale efficiently if the menu grows to thousands of items. Logged to be refactored to SQL-level `LIMIT`/`OFFSET` when necessary.

## Resolved: Sticky Header Overlap (Table.jsx)
- **Status**: Resolved by Design Decision.
- **Description**: The original sticky-header approach in the shared `Table.jsx` component had a persistent, unresolved stacking/z-index bug after three fix attempts where rows would overlap the sticky header during scroll.
- **Resolution**: Resolved by redesigning the Drill-Down tables to a non-sticky header pattern matching `OrderHistory.jsx`. This explicitly trades away the sticky-header convenience for guaranteed visual stability. This is logged as a resolved tradeoff, not a deferred bug, so no further CSS fixes should be investigated or applied.

## Resolved: Float/Decimal Precision Display
- **Status**: Resolved by Design Decision.
- **Description**: The numeric migration in the database accurately converted `stock_level` and `reorder_point` to `NUMERIC(10,3)`. However, Decimal fields serialize as JSON STRINGS rather than numbers by default. This broke strict equality checks in the frontend (e.g. `stock === 0` in `InventoryTable.jsx`) and caused formatting irregularities.
- **Resolution**: Resolved by enforcing explicit `float()` casting on `stock_level` and `reorder_point` during Pydantic schema serialization (`IngredientResponse` and `PurchaseOrderResponse`). This ensures Pydantic emits clean JSON numbers to the frontend, solving the strict equality bugs without applying hacky `parseFloat` bandaids across every React component.

## Resolved: Fractional PCS Quantities
- **Status**: Resolved by Core Implementation.
- **Description**: Ingredients measured in `pcs` (like Tortilla Wraps) could be adjusted with decimal values (e.g. `15.01 pcs`), which is physically impossible and breaks data integrity.
- **Resolution**: Resolved both frontend and backend. Built a global, unit-aware `<NumberInput />` that restricts `step` to whole numbers for `pcs`, and added central API validation that rejects any non-integer `pcs` payload with a 400 Bad Request error. Centralized display using `formatQuantity` to completely strip decimals from `pcs` globally.

## Purchase Order Detail View
- **Missing Feature**: The Purchase Order History table is currently read-only. Clicking a row does not open a detail or timeline view.

**Reason for Acceptance**: Accepted as a known gap for the MVP phase. This is scheduled for future implementation when more detailed PO tracking or chronological history is required.

## Test Suite Instability
- **`test_firing_logic.py`**: Fails with a `TypeError` due to a missing test user fixture (the target test user is not successfully created or returned).
- **`test_pos_checkout.py`**: Fails with a `RuntimeError` (`got Future attached to a different loop`), which is a known issue with `pytest-asyncio` test fixture scopes and multiple `AsyncSession` creations.

**Reason for Acceptance**: These are pre-existing issues and do not reflect new regressions. They are deferred to a dedicated test-suite cleanup phase so that current feature work remains scoped.

## Draft PO Modal: Misleading "Deficit" Logic
- **Description**: In `DraftPOModal.jsx`, the "Deficit" value is calculated strictly as `Math.max(ROP - Stock, 0)`. When an ingredient hits its exact ROP threshold (e.g., Stock = 24, ROP = 24), the system correctly flags it as "Low Stock" and triggers the PO creation flow. However, the UI mathematically shows `Deficit: 0 pcs`, which contradicts the warning and confusingly implies no order is needed. 

**Reason for Acceptance**: Accepted as technical debt for the MVP phase. It was proposed to replace the "Deficit" label with "Recommended Order" (displaying `ROP * 2` or similar logic matching the actual input pre-fill), but this was deferred to a future UI polish sprint.