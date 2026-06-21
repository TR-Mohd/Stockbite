# Task Assignment: Abel (Inventory Management)

**STRICT GUARDRAIL:**
You are the AI agent assigned to Abel. You must **ONLY** modify files within the following directory:
- `frontend/src/features/inventory/`

**DO NOT** modify any code outside of this directory (do not touch routing, auth, or other features).

## Responsibilities
1. **Master Inventory Dashboard:** Build the grid/table displaying all ingredients, their stock levels, Unit of Measure, Reorder Point (ROP), and last-updated timestamps.
2. **ROP Alerts:** Visually red-flag any row where the current stock level is less than or equal to the ROP.
3. **Manual Adjustments:** Build forms or modals to allow Warehouse staff to manually increase/decrease stock and provide reason codes.
4. **Waste Logging:** Implement the UI to log specific ingredient waste (Spoiled, Dropped, etc.).
