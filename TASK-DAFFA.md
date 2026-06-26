# Task Assignment: Daffa (Cashier POS & Checkout)

**STRICT GUARDRAIL:**
You are the AI agent assigned to Daffa. You must **ONLY** modify files within the following directory:
- `frontend/src/features/pos/`

**DO NOT** modify any code outside of this directory (do not touch routing, auth, or other features).

## Responsibilities
1. [x] **Menu Grid:** Build the interactive menu interface for Cashiers, fetching active `MenuItem` records.
2. [x] **Real-time Stock Awareness:** Ensure that if an ingredient's stock hits 0, any menu item requiring that ingredient is visually grayed out and disabled.
3. [x] **Shopping Cart:** Build the active order cart allowing adjustments and per-item notes.
4. [x] **Checkout & Optimistic Locking:**
   - Handle Cash and QRIS (simulated) payment states.
   - Capture optional CRM data (WA/Email).
   - *CRITICAL:* When calling the `/pos/checkout` endpoint, handle HTTP 409 Conflict responses gracefully. If 409 is returned, display an alert to the cashier indicating that stock levels changed during the transaction and prompt them to retry.


## Documentation Requirement (Worklogs/WORKLOG_Daffa.md)
After every single job/component is finished, you must automatically generate an update for the `Worklogs/WORKLOG_Daffa.md` file in the root directory. 

Place it under the heading `## Phase 2: Cashier POS & Checkout` using this exact table format:

| Timestamp (Start) | Task | Description | Status | Prompts & Commands Used |
| :--- | :--- | :--- | :--- | :--- |
| [YYYY-MM-DD HH:MM] | [Name of Task] | [Brief technical description of what was built] | [COMPLETED] | [Summary of the prompts/commands we used] |
