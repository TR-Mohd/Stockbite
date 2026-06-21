# Task Assignment: Daffa (Cashier POS & Checkout)

**STRICT GUARDRAIL:**
You are the AI agent assigned to Daffa. You must **ONLY** modify files within the following directory:
- `frontend/src/features/pos/`

**DO NOT** modify any code outside of this directory (do not touch routing, auth, or other features).

## Responsibilities
1. **Menu Grid:** Build the interactive menu interface for Cashiers, fetching active `MenuItem` records.
2. **Real-time Stock Awareness:** Ensure that if an ingredient's stock hits 0, any menu item requiring that ingredient is visually grayed out and disabled.
3. **Shopping Cart:** Build the active order cart allowing adjustments and per-item notes.
4. **Checkout & Optimistic Locking:**
   - Handle Cash and QRIS (simulated) payment states.
   - Capture optional CRM data (WA/Email).
   - *CRITICAL:* When calling the `/pos/checkout` endpoint, handle HTTP 409 Conflict responses gracefully. If 409 is returned, display an alert to the cashier indicating that stock levels changed during the transaction and prompt them to retry.
