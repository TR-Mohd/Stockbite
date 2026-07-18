# Known Security Issues & Technical Debt

## Unmaintained Authentication Dependencies
- **python-jose**: Used for JWT token generation and validation. This library is effectively unmaintained and has known open CVEs (e.g., algorithm confusion vulnerabilities).
- **passlib**: Used for password hashing abstraction. It is unmaintained and throws deprecation warnings on modern Python versions (3.11+). Because it parses the internal versions of `bcrypt`, it is incompatible with `bcrypt >= 4.0.0`.
- **bcrypt**: Pinned to `3.2.2`. We cannot update to the latest version (`5.0.0`) without breaking `passlib`.

**Reason for Acceptance**: These are accepted as technical debt for the MVP phase. Swapping out core authentication libraries mid-project introduces a significant risk of breaking working authentication during the security review. They should be scheduled for replacement in a future release.

## Security & Authentication
- **Stateless Refresh Token Revocation Gap:** Refresh tokens are currently implemented as stateless JWTs with a 24-hour expiry. This means a refresh token cannot be force-revoked before its natural expiry, even after a user clicks "Logout" or reports a stolen device (since there is no server-side blocklist). While role demotions or account deactivations *are* caught during the next 15-minute refresh cycle (as claims are re-derived from the DB), the refresh token itself remains technically valid until it expires.
- **Token Storage:** Auth tokens are currently stored in `localStorage`, which remains vulnerable to XSS.
- **Scheduled Improvements:** A future hardening phase will address both of the above by migrating to `httpOnly` secure cookies for token storage, alongside implementing a server-side revocation list (or strict refresh token rotation with family invalidation) to close the force-revocation gap.

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

## Resolved: Draft PO Modal: Misleading "Deficit" Logic
- **Status**: Resolved by Core Implementation.
- **Description**: In `DraftPOModal.jsx`, the "Deficit" value was calculated strictly as `Math.max(ROP - Stock, 0)`. When an ingredient hit its exact ROP threshold, the system correctly flagged it as "Low Stock" but the modal confusingly showed `Deficit: 0 pcs`. Furthermore, ordering exactly the deficit would only return the stock to the ROP line, immediately triggering another warning.
- **Resolution**: Resolved by shifting the operational logic to target a safe buffer. The formula was updated to `Math.max((ROP * 2) - Stock, 0)`, establishing a single source of truth for both the input pre-fill and the display label. The UI label was renamed from "Deficit:" (with error styling) to "Recommended Order:" (with neutral styling), ensuring a logical, non-zero suggested quantity when items hit their threshold.