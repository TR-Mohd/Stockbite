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
- **Sticky Header Overlap (Table.jsx)**: Rows overlap the sticky table header during scroll. The root cause is not yet definitively identified. Deferred from Phase 5.
