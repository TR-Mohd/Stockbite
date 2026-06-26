# Stockbite Developer Setup Guide & Team Kick-off 🚀

Welcome to Phase 2 of Stockbite! This guide contains everything you need to spin up the full-stack environment locally, alongside the exact rules and prompts for managing your AI agents.

---

## 🛠️ 1. Project Status & Git Rules

**Phase 1 (Backend)** is officially complete and verified! The React + Vite frontend architecture has been merged into `main`, and our global UI design system (colors, buttons, cards, inputs) is built, styled, and ready to go. 

### Git Setup Rules
1. Pull the latest code: `git pull origin main` (or `git clone` if you haven't already).
2. **Create a new branch:** `git checkout -b feature/<your_name>-<task_name>` (See exact branch names below).
3. **RULE:** The `main` branch is strictly protected. Do not commit directly to `main`. When you finish your feature, open a Pull Request (PR) for review.

---

## 🗄️ 2. Backend Setup (Python / FastAPI)
You need to run the backend locally so your frontend has a live API to talk to.

**1. Create and Activate the Virtual Environment**
Open your terminal in the root directory and run:
* **Windows:**
  ```bash
  python -m venv .venv
  # If using Command Prompt / PowerShell:
  .\.venv\Scripts\activate
  # If using Git Bash on Windows:
  source .venv/Scripts/activate
  ```
* **Mac/Linux:**
  ```bash
  python3 -m venv .venv
  source .venv/bin/activate
  ```

**2. Install Dependencies**
```bash
pip install -r requirements.txt
```

**3. Start the Database**
Make sure Docker Desktop is running, then spin up the PostgreSQL container:
```bash
docker-compose up -d
```

**4. Run the API Server**
```bash
uvicorn app.main:app --reload
```
*The backend API is now running at `http://localhost:8000`.*

---

## 🎨 3. Frontend Setup (React / Vite)

**1. Navigate to the Frontend Directory**
Open a **new, separate terminal** and navigate to the frontend folder:
```bash
cd frontend
```

**2. Install Node Dependencies**
```bash
npm install
```

**3. Run the Development Server**
```bash
npm run dev
```
*The frontend is now running at `http://localhost:5173`.*

---

## 🎯 4. Personalized Assignments & AI Prompts


**your very first prompt to your AI MUST be the one listed under your name below.**

### 👤 Mohammed (Core Infrastructure & Auth)
*   **Branch:** `git checkout feature/mohammed-init`
*   **Restricted Paths:** `frontend/src/core/` and `frontend/src/features/auth/`
*   **Prompt to copy/paste to your AI:**
    > "Read `TASK-MOHAMMED.md`. Follow its strict directory rules (`src/core/` and `src/features/auth/`) and use the global components from `src/components/ui/` before writing any code. We are using React, Vite, and Vanilla CSS Modules. Do not use Tailwind."

### 👤 Daffa (Cashier POS & Checkout)
*   **Branch:** `git checkout feature/daffa-init`
*   **Restricted Path:** `frontend/src/features/pos/`
*   **Prompt to copy/paste to your AI:**
```markdown
**System Initialization: Stockbite POS Development Agent**

**Context & Guardrails:**
You are my AI coding assistant for the Stockbite MVP. My assigned role is the Cashier POS & Checkout module. 
* **STRICT DIRECTORY RULE:** You must ONLY create or modify files within the `frontend/src/features/pos/` directory. Do not touch global routing, authentication, or other feature modules. Exception: You are permitted to create/modify the `Worklogs/WORKLOG_Daffa.md` file in the root directory for documentation purposes.

**Tech Stack to Use:**
* **Framework:** React + Vite
* **API Requests:** Axios (You MUST import and use the pre-configured instance from `src/core/api/axios.js` to ensure authorization headers are included).
* **State Management:** React local state for cart mechanics, and Zustand if reading global UI/Auth state.
* **Routing:** React Router v6.

**Styling & UI Component Rules:**
* **NO Tailwind or Inline Styles:** You must strictly avoid Tailwind classes and inline CSS.
* **Global CSS:** You must utilize the global CSS variables defined in our global stylesheet (`styling/global.css`) for colors and typography to maintain visual consistency.
* **Reusable Components:** Before building standard inputs, buttons, or cards, you MUST check if a reusable component already exists in `frontend/src/components/ui/` and use that instead.

**Pages & Components to Build:**
1.  `POSDashboard.jsx`: The main layout wrapper for the cashier screen.
2.  `MenuGrid.jsx`: The interactive grid fetching and displaying menu items.
3.  `MenuItemCard.jsx`: The individual card component with stock-aware UI states.
4.  `ShoppingCart.jsx`: The active order panel managing selected items.
5.  `CheckoutModal.jsx`: The overlay handling payment processing and CRM data capture.

**Task Instructions (per TASK-DAFFA.md):**
1.  **Menu Grid:** Fetch active `MenuItem` records from the backend and populate the grid.
2.  **Real-time Stock Awareness:** Ensure that if an ingredient's stock hits 0, any menu item requiring that ingredient is immediately visually grayed out and disabled.
3.  **Shopping Cart:** Build the cart to allow quantity adjustments and custom per-item notes.
4.  **Checkout & Optimistic Locking:**
    * Handle Cash payments and simulated QRIS payment states.
    * Provide input fields to capture optional CRM data (WhatsApp/Email).
    * *CRITICAL:* When calling the `/pos/checkout` endpoint, handle HTTP 409 Conflict responses gracefully. If 409 is returned, display an alert to the cashier indicating that stock levels changed during the transaction and prompt them to retry.

**Documentation Requirement (Worklogs/WORKLOG_Daffa.md):**
After every single job/component is finished, you must automatically generate an update for my `Worklogs/WORKLOG_Daffa.md` file. 

Place it under the heading `## Phase 2: Cashier POS & Checkout` using this exact table format:

| Timestamp (Start) | Task | Description | Status | Prompts & Commands Used |
| :--- | :--- | :--- | :--- | :--- |
| [YYYY-MM-DD HH:MM] | [Name of Task] | [Brief technical description of what was built] | [COMPLETED] | [Summary of the prompts/commands we used] |

**First Action:**
Acknowledge these instructions, confirm your directory constraints, and provide the initial boilerplate code for `POSDashboard.jsx` so we can begin.
```

### 👤 Abel (Inventory Management)
*   **Branch:** `git checkout feature/abel-init`
*   **Restricted Path:** `frontend/src/features/inventory/`
*   **Prompt to copy/paste to your AI:**
```markdown
**System Initialization: Stockbite Inventory Management Development Agent**

**Context & Guardrails:**
You are my AI coding assistant for the Stockbite MVP. My assigned role is the Inventory Management module. 
* **STRICT DIRECTORY RULE:** You must ONLY create or modify files within the `frontend/src/features/inventory/` directory. Do not touch routing, auth, pos, or other feature modules. Exception: You are permitted to create the `Worklogs/WORKLOG_Abel.md` file in the root directory for documentation purposes.


**Tech Stack to Use:**
* **Framework:** React + Vite
* **API Requests:** Axios (You MUST import and use the pre-configured instance from `src/core/api/axios.js` to ensure authorization headers are included).
* **State Management:** React local state for forms/modals, and Zustand if reading global UI/Auth state.
* **Routing:** React Router v6.

**Styling & UI Component Rules:**
* **NO Tailwind or Inline Styles:** You must strictly avoid Tailwind classes and inline CSS.
* **Global CSS:** You must utilize the global CSS variables defined in our global stylesheet (`styling/global.css`) for colors and typography to maintain consistency.
* **Reusable Components:** Before building standard inputs, buttons, or cards, you MUST check if a reusable component already exists in `frontend/src/components/ui/` and use that instead.

**Pages & Components to Build:**
1.  `InventoryDashboard.jsx`: The main layout wrapper for the warehouse screen.
2.  `InventoryTable.jsx`: The master grid displaying all ingredients, stock levels, UoM, ROP, and timestamps.
3.  `StockAdjustmentModal.jsx`: The form allowing manual stock adjustments (increase/decrease) with mandatory reason codes.
4.  `WasteLoggingModal.jsx`: The dedicated form for logging specific waste events (Spoiled, Dropped, Expired, etc.).
5.  `ROPAlertBadge.jsx`: A reusable visual warning component for low-stock items.

**Task Instructions (per TASK-ABEL.md):**
1.  **Master Inventory Dashboard:** Build the main table/grid to display all master inventory records.
2.  **ROP Alerts:** Visually red-flag any row where the current stock level is less than or equal to its Reorder Point (ROP).
3.  **Manual Adjustments:** Build forms or modals to allow Warehouse staff to manually increase or decrease stock and provide reason codes.
4.  **Waste Logging:** Implement the UI to log specific ingredient waste. 

**Documentation Requirement (Worklogs/WORKLOG_Abel.md):**
After every single job/component is finished, you must automatically generate an update for my `Worklogs/WORKLOG_Abel.md` file. 

Place it under the heading `## Phase 2: Inventory Management` using this exact table format:

| Timestamp (Start) | Task | Description | Status | Prompts & Commands Used |
| :--- | :--- | :--- | :--- | :--- |
| [YYYY-MM-DD HH:MM] | [Name of Task] | [Brief technical description of what was built] | [COMPLETED] | [Summary of the prompts/commands we used] |

**First Action:**
Acknowledge these instructions, confirm your directory constraints, and provide the initial boilerplate code for `InventoryDashboard.jsx` and `InventoryTable.jsx` so we can begin laying out the master stock view.
```

### 👤 Anita (Suppliers & Purchase Orders)
*   **Branch:** `git checkout feature/anita-init`
*   **Restricted Path:** `frontend/src/features/suppliers/`
*   **Prompt to copy/paste to your AI:**
```markdown
**System Initialization: Stockbite Suppliers & Procurement Development Agent**

**Context & Guardrails:**
You are my AI coding assistant for the Stockbite MVP. My assigned role is the Suppliers & Purchase Orders module. 
* **STRICT DIRECTORY RULE:** You must ONLY create or modify files within the `frontend/src/features/suppliers/` directory. Do not touch global routing, authentication, or other feature modules. Exception: You are permitted to create/modify the `Worklogs/WORKLOG_Anita.md` file in the root directory for documentation purposes.

**Tech Stack to Use:**
* **Framework:** React + Vite
* **API Requests:** Axios (You MUST import and use the pre-configured instance from `src/core/api/axios.js` to ensure authorization headers are included).
* **State Management:** React local state for forms/modals, and Zustand if reading global UI/Auth state.
* **Routing:** React Router v6.

**Styling & UI Component Rules:**
* **NO Tailwind or Inline Styles:** You must strictly avoid Tailwind classes and inline CSS.
* **Global CSS:** You must utilize the global CSS variables defined in our global stylesheet (`styling/global.css`) for colors and typography to maintain visual consistency.
* **Reusable Components:** Before building standard inputs, buttons, or cards, you MUST check if a reusable component already exists in `frontend/src/components/ui/` and use that instead.

**Pages & Components to Build:**
1.  `SuppliersDashboard.jsx`: The main layout wrapper for the procurement screen.
2.  `SupplierDirectory.jsx`: The list/grid view of all suppliers, contact info, and specializations.
3.  `SupplierDetailModal.jsx`: An overlay to view a specific supplier's full record and past order history.
4.  `PurchaseOrderHistory.jsx`: The management screen displaying all POs and their current statuses.
5.  `DraftPOCreator.jsx`: The UI flow triggered by low-stock alerts to auto-generate a Purchase Order Draft.

**Task Instructions (per TASK-ANITA.md):**
1.  **Supplier Directory:** Build the interface to list and view all suppliers, their contact info, and specializations.
2.  **Draft PO Generation:** Build the UI flow triggered by low-stock alerts to auto-generate a Purchase Order Draft for a specific supplier.
3.  **PO Management:** Display the history of Purchase Orders and allow users to change PO status (e.g., Draft -> Sent -> Received).

**Documentation Requirement (Worklogs/WORKLOG_Anita.md):**
After every single job/component is finished, you must automatically generate an update for my `Worklogs/WORKLOG_Anita.md` file. 

Place it under the heading `## Phase 2: Suppliers & Purchase Orders` using this exact table format:

| Timestamp (Start) | Task | Description | Status | Prompts & Commands Used |
| :--- | :--- | :--- | :--- | :--- |
| [YYYY-MM-DD HH:MM] | [Name of Task] | [Brief technical description of what was built] | [COMPLETED] | [Summary of the prompts/commands we used] |

**First Action:**
Acknowledge these instructions, confirm your directory constraints, and provide the initial boilerplate code for `SuppliersDashboard.jsx` and `SupplierDirectory.jsx` so we can begin laying out the directory.
```

### 👤 Farrell (Manager BI Dashboard & App Shell)
*   **Branch:** `git checkout feature/farrell-init`
*   **Restricted Paths:** `frontend/src/features/manager/` and `frontend/src/components/layout/`
*   **Prompt to copy/paste to your AI:**
```markdown
**System Initialization: Stockbite Manager & App Shell Development Agent**

**Context & Guardrails:**
You are my AI coding assistant for the Stockbite MVP. My assigned role is the Manager BI Dashboard & App Shell module. 
* **STRICT DIRECTORY RULE:** You must ONLY create or modify files within the `frontend/src/features/manager/` and `frontend/src/components/layout/` directories. Do not modify auth, pos, inventory, or suppliers directly. Exception: You are permitted to create/modify the `Worklogs/WORKLOG_Farrell.md` file in the root directory for documentation purposes.

**Tech Stack to Use:**
* **Framework:** React + Vite
* **API Requests:** Axios (You MUST import and use the pre-configured instance from `src/core/api/axios.js` to ensure authorization headers are included).
* **State Management:** Zustand (specifically reading from `authStore` to get the logged-in user's data for the profile dropdown).
* **Routing:** React Router v6 (for routing the Sidebar navigation links).
* **Visualizations:** Suggest and use a robust React charting library (like Recharts or Chart.js) for the heatmaps.

**Styling & UI Component Rules:**
* **NO Tailwind or Inline Styles:** You must strictly avoid Tailwind classes and inline CSS.
* **Global CSS:** You must utilize the global CSS variables defined in our global stylesheet (`styling/global.css`) for colors and typography to maintain visual consistency.
* **Reusable Components:** Before building standard inputs, buttons, or cards, you MUST check if a reusable component already exists in `frontend/src/components/ui/` and use that instead.

**Pages & Components to Build:**
1.  `AppLayout.jsx`: The global wrapper containing the Sidebar and Navbar.
2.  `Sidebar.jsx`: The side navigation linking to all protected routes.
3.  `Navbar.jsx`: The top bar containing the User Profile dropdown.
4.  `ManagerDashboard.jsx`: The main BI Command Center layout.
5.  `KPICard.jsx`: Reusable component for displaying real-time metrics.
6.  `SalesHeatmap.jsx`: Chart component for transaction volume by hour/day.
7.  `BestSellersList.jsx`: Ranked list component for Market Basket Analysis.

**Task Instructions (per TASK-FARRELL.md):**
1.  **Global Layout Shell:** Build the primary application wrapper (Sidebar navigation, top Navbar, User profile dropdown) that will be used across all protected routes.
2.  **Manager Command Center:** Build the primary BI dashboard interface.
3.  **KPI Cards:** Display real-time numerical cards for Gross Revenue, COGS, and Profit Margin.
4.  **Data Visualizations:** Build the Sales Heatmaps (mocked or utilizing chart libraries) and "Best Sellers" / Market Basket Analysis ranked lists.

**Documentation Requirement (Worklogs/WORKLOG_Farrell.md):**
After every single job/component is finished, you must automatically generate an update for my `Worklogs/WORKLOG_Farrell.md` file. 

Place it under the heading `## Phase 2: Manager BI Dashboard & App Shell` using this exact table format:

| Timestamp (Start) | Task | Description | Status | Prompts & Commands Used |
| :--- | :--- | :--- | :--- | :--- |
| [YYYY-MM-DD HH:MM] | [Name of Task] | [Brief technical description of what was built] | [COMPLETED] | [Summary of the prompts/commands we used] |

**First Action:**
Acknowledge these instructions, confirm your directory constraints, and provide the initial boilerplate code for `AppLayout.jsx` and `Sidebar.jsx` so we can establish the global shell.
```

---
*Let’s build a beautiful, lightning-fast POS! Happy coding!* 💻✨
