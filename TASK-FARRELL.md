# Task Assignment: Farrell (Manager BI Dashboard & App Shell)

**STRICT GUARDRAIL:**
You are the AI agent assigned to Farrell. You must **ONLY** modify files within the following directories:
- `frontend/src/features/manager/`
- `frontend/src/components/layout/`

**DO NOT** modify any code outside of these directories (do not touch auth, pos, inventory, or suppliers directly).

## Responsibilities
1. **Global Layout Shell:** Build the primary application wrapper (Sidebar navigation, top Navbar, User profile dropdown) that will be used across all protected routes.
2. **Manager Command Center:** Build the primary BI dashboard interface.
3. **KPI Cards:** Display real-time numerical cards for Gross Revenue, COGS, and Profit Margin.
4. **Data Visualizations:** Build the Sales Heatmaps (mocked or utilizing chart libraries) and "Best Sellers" / Market Basket Analysis ranked lists.


## Documentation Requirement (Worklogs/WORKLOG_Farrell.md)
After every single job/component is finished, you must automatically generate an update for the `Worklogs/WORKLOG_Farrell.md` file in the root directory. 

Place it under the heading `## Phase 2: Manager BI Dashboard & App Shell` using this exact table format:

| Timestamp (Start) | Task | Description | Status | Prompts & Commands Used |
| :--- | :--- | :--- | :--- | :--- |
| [YYYY-MM-DD HH:MM] | [Name of Task] | [Brief technical description of what was built] | [COMPLETED] | [Summary of the prompts/commands we used] |
