# PRODUCT REQUIREMENTS DOCUMENT

## Stockbite

An integrated Management Information System for fast-paced franchise restaurants featuring QR self-ordering, Kitchen Display System (KDS), and automated real-time inventory tracking.

| | |
| --- | --- |
| **Version** | v5 |
| **Date** | 22 July 2026 |
| **Team** | MBG (Mahasiswa Berprestasi Global) |
| **Product Owner** | Mohammed Aatef Saleh |
| **Client / Stakeholder** | Restaurant / F&B Business Owner |
| **Status** | Pre-Sale Hardening / Production-Ready Candidate |

---

# PART 1: PROBLEM, OBJECTIVES & SCOPE

## 1. Problem Statement

F&B business owners cannot accurately assess real-time profitability, control warehouse costs, or build customer relationships because their existing operations rely on disconnected cashier registers, manual stock counting, and zero digital CRM — resulting in stock-outs during peak hours, untracked ingredient waste, lost supplier negotiation leverage, and an inability to run data-driven marketing campaigns.

### 1.1 Background & Context

Many small-to-medium F&B businesses in Indonesia operate with standalone cash registers (or even handwritten notes) and manage inventory through end-of-day physical counts. Supplier orders are placed via WhatsApp chats with no centralized record. Customer data is never captured, making loyalty programs or targeted promotions impossible. As the business grows, this fragmented approach causes compounding inefficiencies: profit margins erode from untracked waste, popular items go out-of-stock because reorder points are guessed rather than calculated, and managers lack the BI tools to identify best sellers, peak hours, or cost anomalies. There is a clear need for a lightweight, integrated system that unifies the cashier, warehouse, and managerial reporting functions under a single web-based platform — while collecting granular data to enable future AI-powered forecasting.

### 1.2 Problem Statement

Cashiers, warehouse operators, and managers cannot efficiently coordinate daily F&B operations because sales data, inventory levels, supplier records, and customer information exist in separate, unconnected silos. This results in inaccurate stock levels that cause mid-service menu unavailability, missed reorder windows leading to emergency supplier purchases at premium prices, zero customer retention data, and delayed financial reporting that forces managers to make decisions based on outdated or incomplete information.

### 1.3 Who is Affected

* **Cashiers:** They lose time manually checking stock availability with the kitchen/warehouse before confirming orders, cannot quickly calculate change for cash payments during rush hours, and have no streamlined way to capture customer contact details for future engagement.
* **Warehouse Staff:** They rely on physical stock counts that are slow, error-prone, and only performed at end-of-day, meaning stock-outs are discovered only when a cashier tries to sell an unavailable item. Waste from spoilage or drops goes unlogged, distorting cost reports.
* **Managers / Business Owners:** They lack real-time visibility into revenue, COGS, and profit margins. Without BI dashboards, they cannot identify best-selling products, peak sales periods, or underperforming menu items. Supplier management is ad-hoc, with no centralized directory or order history to negotiate better terms.
* **Suppliers:** They receive inconsistent, informal purchase orders (often via chat messages) with no standardized format, leading to fulfillment errors and disputes over order history.

## 2. Objectives

### 2.1 Business Objectives

| # | Objective | Why it matters | Success indicator |
| :--- | :--- | :--- | :--- |
| 1 | Digitize the entire order-to-payment workflow at the cashier station to eliminate manual calculations and reduce transaction time. | Faster checkout directly increases customer throughput during peak hours, boosting daily revenue without adding staff. | System logs show the average transaction time (item selection to payment confirmation) is under 90 seconds. |
| 2 | Implement automatic, recipe-based inventory deduction to maintain real-time stock accuracy across all ingredients. | Prevents mid-service stock-outs that frustrate customers and force cashiers to void orders, and eliminates the need for daily manual stock counts. | Inventory numbers update automatically per transaction, and the system correctly reflects actual stock levels with ≥ 95% accuracy during weekly physical audits. |
| 3 | Capture customer contact data (WhatsApp number or email) at the point of sale to build a CRM database from day one. | Creates a foundation for future loyalty programs, targeted promotions, and repeat-customer analysis — capabilities that are impossible without a customer database. | Within 3 months of launch, the system has captured contact details for at least 30% of all unique transactions. |
| 4 | Provide a centralized BI dashboard with real-time Gross Revenue, Net Revenue, COGS, and Profit Margin visualizations. | Allows managers to make data-driven pricing, staffing, and menu decisions daily instead of waiting for monthly accountant reports. | The manager’s dashboard successfully displays live financial data and sales heatmaps that refresh with each new transaction. |
| 5 | Automate the Reorder Point (ROP) alerting process and generate draft Purchase Orders to streamline supplier procurement. | Reduces emergency last-minute purchases at premium prices and ensures critical ingredients are always in stock. | System triggers a low-stock alert within 30 seconds of an ingredient breaching its ROP threshold, and a draft PO can be generated in under 3 clicks. |

### 2.2 User Objectives

| Actor | What they need to accomplish | What stops them today |
| :--- | :--- | :--- |
| Customer | Process customer orders quickly, accept payments (cash and simulated QRIS), capture optional CRM data, and issue e-receipts — all from a single screen. | No integrated POS; cashiers use standalone registers with no stock visibility and no ability to record customer details. |
| Kitchen Staff | View real-time ingredient stock levels, log waste/spoilage events, and receive restocking alerts without performing manual counts. | Physical stock counts performed once daily; waste goes unlogged; stock-outs are discovered only when a cashier reports an item as unavailable. |
| Restaurant Manager | Monitor live business performance through BI dashboards, manage supplier relationships from a centralized directory, control staff access via RBAC, and review audit logs. | Relying on end-of-week manual spreadsheets cobbled from receipts and handwritten notes; no centralized supplier database; no access control or audit trail. |

## 3. Success Metrics

| Metric | Baseline (now) | Target (3 months) | How it is measured |
| :--- | :--- | :--- | :--- |
| Average transaction time per customer (item selection → payment confirmed). | 3–5 minutes (manual register, verbal stock checks). | Under 90 seconds. | Tracking system timestamps from when the first item is added to the cart until payment is confirmed. |
| Inventory accuracy rate (system stock vs. physical audit). | ~70% accurate (manual counting, often done inconsistently). | ≥ 95% accuracy. | Comparing the system’s reported stock levels against a physical audit performed at the end of each week. |
| Customer contact data capture rate. | 0% (no data captured). | ≥ 30% of transactions include a WA number or email. | Counting transactions with a non-null customer contact field divided by total transactions, measured monthly. |
| Time from ROP breach to manager notification. | N/A (no alert system exists; stock-outs are discovered reactively). | Within 30 seconds. | Measuring the elapsed time between the system detecting a stock level at or below ROP and the alert appearing on the manager dashboard. |
| Manager time spent on daily reporting. | 1–2 hours (manual spreadsheet compilation). | Under 5 minutes (automated dashboard). | Self-reported time-tracking by the manager during the first 3 months post-launch, compared against pre-launch baseline. |

## 4. Scope

### 4.1 In Scope & Out of Scope (MVP)

| ✅ IN Scope (MVP) | ❌ OUT of Scope (v1) |
| :--- | :--- |
| Web-based Cashier POS with live menu grid and real-time stock-aware item availability. | Native iOS/Android mobile applications (will use a responsive web-browser approach for Phase 1). |
| Cash payment with auto-change calculation and simulated QRIS payment (brand logo display). | Real payment gateway integration (actual QRIS, GoPay, OVO API connections). |
| Optional CRM data capture (WhatsApp number or email) at checkout. | Full-featured loyalty points system and promotional campaign engine (data capture is in scope; the loyalty program itself is deferred). |
| E-receipt specification (PDF format & WA/email dispatch planned). | Physical thermal printer integration or dedicated POS hardware connectivity. |
| Role-Based Access Control (RBAC) with Manager, Cashier, and Warehouse roles. | Biometric or NFC-based staff attendance systems. |
| Real-time master inventory with automatic recipe-based stock deduction per transaction. | Integration with third-party delivery platforms (GrabFood, GoFood, ShopeeFood). |
| Automated ROP alerts and draft Purchase Order generation. | Automated direct e-procurement to external supplier systems (POs are generated internally; actual ordering is done manually). |
| Supplier directory with contact details, specialization, and order history. | Customer self-ordering via QR code or mobile app (ordering is handled by the cashier). |
| Waste/spoilage logging with reason fields. | Kitchen Display System (KDS) for digital order routing to kitchen staff. |
| Manager BI dashboard with revenue, COGS, profit margin charts, and sales heatmaps. | AI/ML-powered demand forecasting and predictive analytics (data is collected for future use). |
| Market Basket Analysis showing best sellers and frequently co-purchased items. | Multi-branch / franchise-level operations (single-location MVP). |
| Immutable audit and security logs (cashier logins, sensitive actions). | |

### 4.2 Assumptions & Constraints

| Type | Description |
| :--- | :--- |
| Assumption | The business has at least one desktop or tablet device with a modern web browser (Chrome, Firefox, Edge) and a stable internet connection at the cashier station and warehouse area. |
| Assumption | All menu items have pre-defined digital recipes (ingredient lists with quantities) entered into the system before going live. |
| Assumption | The business has an existing supplier base whose contact information can be entered into the Supplier Directory during initial setup. |
| Constraint | The MVP must be developed and ready for academic presentation within the semester project timeline. |
| Constraint | No physical hardware integration is permitted — all hardware actions (receipt printing, QRIS scanning) are simulated via software. |
| Constraint | The system is a web-based prototype; it is not expected to handle production-level traffic or comply with financial regulatory standards (e.g., PCI-DSS). |

---

# PART 2: FUNCTIONAL REQUIREMENTS & WORKFLOWS

## 5. Functional Requirements

### 5.1 FR Table: Cashier

| FR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| FR-001 | Cashier | Display an interactive grid of all menu items showing item name, price, image thumbnail, and real-time availability status. | When the cashier opens or refreshes the POS order screen. | Critical | M | ✅ Implemented |
| FR-002 | System | Automatically gray out and disable the “Add to Cart” button for any menu item whose required ingredients have fallen to zero in the master inventory. | When the system detects that any ingredient required by the item’s digital recipe has a stock level of 0. | Critical | M | ✅ Implemented |
| FR-003 | Cashier | Allow the cashier to add multiple menu items to a cart, adjust item quantities, add per-item notes, and remove items before finalizing the order. | Allow the cashier to add multiple menu items to a cart, adjust item quantities, add per-item notes, and remove items before finalizing the order. | Critical | M | ✅ Implemented |
| FR-004 | System | Calculate the total order amount and, when cash is selected as the payment method, compute and display the exact change owed to the customer based on the amount tendered. | When the cashier clicks “Calculate” or “Finalize Payment” after entering the cash amount received. | Critical | M | ✅ Implemented |
| FR-005 | System | Generate a simulated QRIS payment screen displaying the QRIS brand logo and an immediate payment confirmation button. | When the cashier selects “QRIS” as the payment method during checkout. | Critical | M | ⚠️ Partially Implemented / Divergent (Displays QRIS brand logo instead of static QR graphic; payment completes immediately upon confirmation without a separate pending state) |
| FR-006 | Cashier | Present optional input fields for the customer’s WhatsApp number and/or email address on the checkout screen, allowing the cashier to quickly enter or skip CRM data capture. | When the cashier proceeds to the payment/checkout stage of the transaction. | High | S | ✅ Implemented |
| FR-007 | System | Generate a digital e-receipt in PDF format containing the transaction ID, itemized list with prices, total amount, payment method, date/time, and captured customer contact (if provided). | Immediately after payment is confirmed (cash accepted or QRIS marked as paid). | High | M | ❌ Not Implemented (Documented Gap — PDF generation library not integrated) |
| FR-008 | System | Display a simulated confirmation message stating “Receipt sent to [WA number / email]” when a customer contact was captured, or provide a “Download Receipt” button when no contact was entered. | After the e-receipt PDF is generated. | Medium | S | ❌ Not Implemented (Documented Gap — Checkout modal closes without receipt link or dispatch confirmation) |
| FR-009 | Cashier | Record a shift clock-in event with the cashier’s user ID, timestamp, and session start marker; and record a clock-out event with session end marker and total shift duration. | When the cashier clicks “Clock In” at the start of a shift or “Clock Out” at the end. | High | M | ❌ Not Implemented (Documented Gap — Shift model exists in database but no API endpoints or UI exist) |
| FR-010 | System | Display a shift summary showing total transactions processed, total revenue collected (split by cash and QRIS), and shift duration when a cashier clocks out. | When the cashier completes the clock-out action. | Medium | S | ❌ Not Implemented (Documented Gap — Dependent on FR-009) |

### 5.2 FR Table : Warehouse Staff

| FR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| FR-011 | System | Automatically deduct the exact quantities of each ingredient defined in the menu item’s digital recipe from the master inventory upon transaction confirmation. | When a cashier finalizes a transaction and payment is confirmed. | Critical | M | ✅ Implemented |
| FR-012 | Warehouse Staff | Display a master inventory dashboard listing all ingredients with their current stock level, unit of measure, Reorder Point (ROP) threshold, and last-updated timestamp. | When the warehouse staff navigates to the Inventory Management screen. | Critical | M | ✅ Implemented |
| FR-013 | System | Visually flag (e.g., red highlight or warning icon) any ingredient whose current stock level has reached or fallen below its predefined Reorder Point (ROP). | When the system detects an ingredient’s stock level ≤ ROP after any stock-modifying event. | High | M | ✅ Implemented |
| FR-014 | Warehouse Staff | Allow manual adjustment of ingredient stock levels (increase for received goods, decrease for corrections) with a mandatory reason field. | When the warehouse staff selects an ingredient and clicks “Adjust Stock.” | High | M | ✅ Implemented |
| FR-015 | System | Generate a pre-filled draft Purchase Order containing the flagged ingredient name, current stock, ROP, suggested reorder quantity, and the preferred supplier auto-selected from the Supplier Directory. | When a warehouse staff or manager clicks “Draft PO” on a low-stock ingredient alert. | High | S | ⚠️ Partially Implemented / Divergent (Suggested reorder quantity calculated client-side; backend accepts caller-supplied float with no server-side formula enforcement) |
| FR-016 | Warehouse Staff | Log a waste event for a specific ingredient, recording the quantity wasted, reason, and the timestamp of the event. | When the warehouse staff selects an ingredient and clicks “Log Waste.” | High | M | ⚠️ Partially Implemented / Divergent (Backend accepts free-text reason string; predefined reason code dropdown/enum is not enforced) |
| FR-017 | Manager | Maintain a Supplier Directory where each record includes: Supplier Name, Specialization, Phone Number, Email, Physical Address, and a read-only Order History log. | When a manager navigates to the Supplier Management screen and adds, edits, or views a supplier record. | High | M | ✅ Implemented |
| FR-018 | System | Append a timestamped entry to a supplier’s Order History log each time a Purchase Order referencing that supplier is marked as “Sent” or “Received.” | When the status of a Purchase Order linked to a supplier is updated. | Medium | S | ⚠️ Partially Implemented / Divergent (History is queried dynamically from PurchaseOrder records rather than a separate append-only log table) |
| FR-019 | Warehouse Staff | Perform a stock search and filter operation on the master inventory by ingredient name, category, or stock status (Normal, Low, Out of Stock). | Perform a stock search and filter operation on the master inventory by ingredient name, category, or stock status. | Medium | S | ✅ Implemented |

### 5.3 FR Table : Manager (BI & Administration)

| FR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| FR-020 | Manager | Display a BI dashboard containing real-time visualizations of: Gross Revenue, Net Revenue, COGS, and Profit Margin as numerical KPIs and trend-line charts for a selectable date range. | When the manager logs into the Manager Command Center. | Critical | M | ✅ Implemented |
| FR-021 | System | Display a sales heatmap showing transaction volume by hour-of-day and day-of-week for a selectable date range. | When the manager navigates to the “Sales Analytics” section of the BI dashboard. | High | S | ✅ Implemented |
| FR-022 | System | Display a “Best Sellers” ranked list and a “Frequently Bought Together” association table (Market Basket Analysis) based on historical transaction data. | When the manager navigates to the “Product Insights” section of the BI dashboard. | High | S | ✅ Implemented |
| FR-023 | Manager | Create, edit, deactivate, and assign roles (Manager, Cashier, Warehouse Staff) to user accounts within the system. | When the manager navigates to “User Management” and performs an account action. | Medium | M | ✅ Implemented |
| FR-024 | System | Enforce Role-Based Access Control (RBAC) ensuring: Cashiers can only access the POS module; Warehouse Staff can only access the Inventory module; Managers can access all modules. | Every time any user attempts to navigate to a system module or perform an action. | Critical | M | ✅ Implemented |
| FR-025 | System | Record an immutable audit log entry for security-sensitive events: user login, PIN auth, checkout, stock adjustment, and PO status change. | When any of the listed events occurs. | High | M | ⚠️ Partially Implemented / Divergent (Implemented for login, PIN auth, checkout, stock ops, PO ops; missing for logout, failed login, account modifications via PUT /staff/{id}) |
| FR-026 | Manager | View and filter the audit log by date range, user, and event type. | When the manager navigates to the “Audit Logs” section. | Medium | S | ❌ Not Implemented (Documented Gap — AuditLog table is write-only from API; no manager read/filter endpoint or UI exists) |
| FR-027 | Manager | Export BI dashboard data (revenue, COGS, profit, best sellers) and inventory reports as a downloadable CSV or PDF file. | When the manager selects a report type, date range, and clicks “Export Report.” | Medium | C | ❌ Not Implemented (Documented Gap — No export API or UI download function exists) |
| FR-028 | Manager | Manage the menu catalog: add new menu items (with name, price, category, image, and linked digital recipe), edit existing items, and deactivate items. | When the manager navigates to “Menu Management” and performs a catalog action. | Critical | M | ❌ Critical Gap (Frontend MenuManagement.jsx exists but calls non-existent backend API endpoints `/manager/menu`) |
| **F-029** | Manager | Display an accurate "Last Active" timestamp for each employee in the User Management list by aggregating their latest POS transaction or login event. | When the manager views the Staff list in the User Management module. | Medium | S | ✅ Implemented |
| **F-030** | System | Automatically generate structured IDs for new employees (`EMP-<ROLE>-<YY><SEQ>`), suppliers (`SUP-<HUB>-<YY><SEQ>`), and purchase orders (`PO-<YYMM>-<SEQ>`) server-side instead of default UUIDs. | When adding a new user, supplier, or drafting a Purchase Order. | High | S | ✅ Implemented |
| **F-031** | System | Restrict the permanent deletion ("Firing") of Manager accounts exclusively to a predefined Super-Admin account. | When a deletion request is sent or the Staff Management UI is rendered. | High | M | ⚠️ Partially Implemented / Known Limitation (Restricted via hardcoded check against username `"mohammed"`, documented as a known limitation pending formal SuperAdmin role refactor) |
| **F-032** | Manager | Assign a "Coverage" type (Regional/National) and a "Logistics Hub" region to suppliers to track geographical supply chain distribution. | When creating or editing a supplier record in the Supplier Directory. | Medium | S | ⚠️ Partially Implemented / Divergent (Supplier region/hub is persisted to DB; Coverage type is UI-only and not saved to database pending schema update) |
| **F-033** | System | Apply live conditional formatting to phone numbers and perform strict validation on email addresses during data entry. | When a user types in phone or email fields in CRM or Supplier modals. | Medium | S | ✅ Implemented |
| **F-034** | System | **Data Integrity Protocol:** To preserve financial accuracy and prevent PostgreSQL foreign key violations, Staff accounts with associated POS transaction histories cannot be hard-deleted. The backend enforces a 'Soft Delete' (Deactivation) workflow via HTTP 400 rejection on deletion attempts. | When a deletion request is sent for an employee with transaction history. | High | M | ✅ Implemented |
| **F-035** | System | Render non-blocking, adaptive inline notifications with a 3D stacking visual pattern, auto-dismissing after 3 seconds, whenever a critical CRUD action is performed (e.g., Add, Deactivate, Edit). | When a Manager successfully completes a CRUD action on the Supplier or Staff dashboard. | Low | W | ✅ Implemented |

### 5.4 FR Table : Proposed-but-Unbuilt Inventory Requirements

| FR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F-036** | Warehouse Staff | Track ingredient stock by distinct batches, requiring an expiration date upon receipt and automatically prioritizing the oldest batch for deduction (FIFO). | When receiving new stock or finalizing a transaction. | High | S | 💡 Proposed / Not Built |
| **F-037** | System | Calculate and display the total financial valuation of current inventory based on the moving average cost of received batches. | When the manager or warehouse staff views the master inventory dashboard. | Medium | S | 💡 Proposed / Not Built |
| **F-038** | Warehouse Staff | Perform partial cycle count reconciliations without freezing the entire inventory, automatically generating a variance report for discrepancies. | When a warehouse staff initiates a cycle count for a specific category. | Medium | C | 💡 Proposed / Not Built |
| **F-039** | System | Distinguish between a Reorder Point (trigger threshold) and a Par Level (target maximum stock), using both to accurately suggest Draft PO quantities. | When generating a Draft Purchase Order for low stock items. | High | S | 💡 Proposed / Not Built |
| **F-040** | System | Support automatic unit-of-measure conversions (e.g., purchasing by 'Box', inventorying by 'Kg', deducting by 'Grams'). | When receiving stock or deducting stock via a digital recipe. | High | M | 💡 Proposed / Not Built |

### 5.5 FR Table : New Production-Implemented Features

| FR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F-041** | System | Calculate an 11% tax on the order subtotal at checkout, rounded to IDR precision via `ROUND_HALF_UP` and stored in `Transaction.tax`. | On order subtotal calculation during checkout. | Critical | M | ✅ Implemented |
| **F-042** | Manager / Cashier | Support Item Modifiers with modifier groups, min/max selection rules, price adjustments, recipe-based modifier ingredient deductions, and per-modifier COGS tracking. | When configuring menu items or adding custom items to the cart. | High | M | ✅ Implemented |
| **F-043** | Cashier | Enforce order routing for Dine-In vs. Takeaway orders, requiring a mandatory table routing number for Dine-In orders. | On checkout submission. | High | M | ✅ Implemented |
| **F-044** | System | Manage a 6-state Purchase Order lifecycle (Draft, Sent, Partially Received, Over-Received, Received, Cancelled with mandatory reason) with a 24-hour receipt undo window. | During PO procurement processing. | High | M | ✅ Implemented |
| **F-045** | System | Store ingredient `unit_cost` and compute real-time recipe-based Cost of Goods Sold (COGS) for items and modifiers at transaction checkout. | On transaction commit. | Critical | M | ✅ Implemented |
| **F-046** | Manager | Perform Menu Engineering quadrant analysis (Star, Plowhorse, Puzzle, Dog) based on sales volume and contribution margin, gated by a 50-order data threshold. | When viewing Menu Engineering analytics. | High | S | ✅ Implemented |
| **F-047** | Manager | Calculate Average Ticket Size (ATS) KPI and display sales volume distribution across 5 spend ranges (0-50k, 50k-100k, 100k-150k, 150k-200k, 200k+ IDR). | On BI dashboard load. | Medium | S | ✅ Implemented |
| **F-048** | Manager | Provide time-series analytics for Gross Revenue, COGS, Net Revenue, Profit Margin %, and Order Velocity. | On BI analytics view. | High | S | ✅ Implemented |
| **F-049** | Manager | Provide an itemized COGS breakdown table with food cost percentage and proportion of total COGS per menu item. | When drilling down into COGS KPI. | Medium | S | ✅ Implemented |
| **F-050** | Manager | Display a paginated, filterable historical transaction table with cashier attribution, payment method, order type, subtotal, tax, and total. | When viewing Manager Order History. | High | M | ✅ Implemented |
| **F-051** | Manager / Cashier | Support Manager PIN authentication issuing a short-lived 5-minute access token with elevated scopes (`void`, `refund`) for sensitive manager authorizations. | On PIN authorization prompt. | High | M | ✅ Implemented |
| **F-052** | System | Implement dual-token JWT authentication with a 15-minute access token, 24-hour refresh token, and an HTTP 401 axios interceptor auto-refresh queue. | On API request authentication. | Critical | M | ✅ Implemented |
| **F-053** | System | Enforce rate limiting (5 requests per minute per IP) on all authentication endpoints (`/auth/token`, `/auth/refresh`, `/auth/pin-auth`). | On authentication request. | High | M | ✅ Implemented |
| **F-054** | Manager | Allow soft-deactivation and reactivation (`is_active` toggle) of supplier accounts in the Supplier Directory. | When toggling supplier status in directory. | Medium | S | ✅ Implemented |
| **F-055** | System | Enrich inventory query responses with `active_po_status` indicating whether a Draft or Sent PO is currently active for each ingredient. | On inventory query execution. | Low | S | ✅ Implemented |

---

## 6. Non-Functional Requirements

### 6.1 NFR Table · Performance

| NFR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-001 | All Users | Load any primary screen (POS grid, Inventory dashboard, BI dashboard) in under 3 seconds. | When a user navigates to any main module on a standard broadband connection (≥ 5 Mbps). | Critical | M | ⚠️ Not Verifiable |
| NFR-002 | System | Complete the full inventory deduction cycle (recipe lookup → stock update → UI refresh) in under 2 seconds per transaction. | When a cashier confirms a payment and the system triggers the recipe-based deduction. | Critical | M | ⚠️ Not Verifiable |
| NFR-003 | All Users | Support a minimum of 10 concurrent user sessions (cashiers, warehouse staff, and managers combined) without performance degradation. | During peak operating hours when multiple staff access the system simultaneously. | High | M | ⚠️ Not Verifiable |
| NFR-004 | System | Maintain a system uptime of at least 99% within any given calendar month during the prototype evaluation period. | Throughout all operating hours. | High | M | ⚠️ Not Verifiable |
| NFR-005 | All Users | Render a fully responsive interface usable on desktop screens (minimum 1024 px width) and tablet screens (minimum 768 px width). | Every time the system is accessed via a cashier workstation desktop or a warehouse tablet. | High | M | ⚠️ Partially Implemented |
| NFR-006 | All Users | Display clear, user-friendly error messages in Bahasa Indonesia or English for every system failure scenario, including a suggested corrective action. | When an error occurs during any operation. | Medium | S | ⚠️ Partially Implemented |

### 6.2 NFR Table · Cashier

| NFR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-007 | Cashier | Transmit all transaction data over HTTPS/TLS 1.2 or higher to ensure data integrity during payment processing. | Every time a cashier initiates a checkout and confirms a payment. | Critical | M | ⚠️ Infrastructure Level |
| NFR-008 | Cashier | Persist the current in-progress cart data in the browser’s local storage so that an incomplete transaction can be recovered after an accidental page refresh. | When the cashier’s browser session is interrupted by an accidental refresh or tab closure during an active transaction. | High | S | ⚠️ Partially Implemented / Divergent (Cart data persists in `localStorage` across reloads without explicit "Restore / Discard" modal prompt) |
| NFR-009 | System | Generate the e-receipt PDF and make it available for download or simulated dispatch within 5 seconds of payment confirmation. | Immediately after a transaction is confirmed. | High | M | ❌ Not Implemented (Documented Gap) |

### 6.3 NFR Table · Warehouse Staff

| NFR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-010 | Warehouse Staff | Reflect updated stock levels on the Inventory Management screen within 5 seconds of any stock-modifying event. | After any event that changes an ingredient’s stock quantity. | High | M | ⚠️ Partially Implemented |
| NFR-011 | System | Prevent race conditions during simultaneous stock modifications by enforcing a dual-layer concurrency architecture: primary row-level pessimistic locking (`SELECT FOR UPDATE`) on ingredient queries during checkout, backed by secondary ORM-level optimistic concurrency control (`version_id_col` on `Ingredient` model raising HTTP 409 `StaleDataError` on collision). | When two or more events attempt to modify the same ingredient’s stock simultaneously. | High | M | ✅ Implemented (Enhanced Dual-Layer Locking) |
| NFR-012 | System | Retain all waste log entries, stock adjustment records, and Purchase Order drafts for a minimum of 12 months for audit and historical analysis purposes. | At all times; data must not be purged or overwritten within the retention period. | High | S | ⚠️ Partially Implemented |

### 6.4 NFR Table · Manager (BI & Security)

| NFR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW | Implementation Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-013 | System | Restrict access to the Manager Command Center, User Management, and Audit Logs exclusively to users with authenticated credentials and the “Manager” role. | Every time a user attempts to access managerial pages, reports, or administrative functions. | Critical | M | ✅ Implemented |
| NFR-014 | System | Deliver a low-stock notification on the manager’s BI dashboard within 30 seconds of the system detecting that an ingredient’s stock level has reached or fallen below its Reorder Point. | When the system detects a stock level ≤ ROP after any stock-modifying event. | High | M | ⚠️ Partially Implemented (Low-stock alerts queried on demand via `GET /inventory/alerts`; active server-push/polling within 30s is not built) |
| NFR-015 | System | Store all audit log entries as append-only (immutable) records that cannot be edited or deleted by any user, including Managers. | Every time a security-sensitive event is logged. | High | M | ✅ Implemented |
| NFR-016 | System | Render BI dashboard charts (revenue trends, heatmaps, best sellers) within 5 seconds for date ranges up to 90 days. | When the manager selects a date range and the dashboard fetches and visualizes the data. | High | M | ⚠️ Not Verifiable |
| NFR-017 | System | Hash and salt all user passwords using bcrypt before storing them in the database; plaintext passwords must never be persisted. | Every time a new user account is created or a password is changed. | Critical | S | ✅ Implemented |
| NFR-018 | System | Provide structured, searchable system activity logs containing timestamp, user ID, action type, affected resource, and outcome (success/fail) for every logged event. | Every time a transaction occurs, a stock adjustment is made, or an account is modified. | Medium | S | ✅ Implemented |
| **NFR-019** | System | **Security Protocol:** The authentication service explicitly verifies the 'is_active' status flag during the login sequence. Deactivated staff members are instantly intercepted and rejected with an HTTP 401. | Every time a user attempts to log in. | Critical | M | ✅ Implemented |
| **NFR-020** | System | **Logging Infrastructure:** System maintains durable, rotating log files (`RotatingFileHandler` with 10MB max size and 5 historical backups) capturing all system events and unhandled exceptions, with optional `DB_ECHO` environment flag for detailed SQL query debugging. | Throughout system execution. | Medium | S | ✅ Implemented |

---

## 7. User Workflows

### 7.1 Workflow: Cashier Processing an Order with CRM Data Capture & Payment

| | |
| :--- | :--- |
| **Actor** | Cashier |
| **Goal** | Process a customer’s food order, optionally capture their WhatsApp number or email for CRM, finalize payment (cash or simulated QRIS), and issue an e-receipt. |
| **FRs covered** | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-011, F-041, F-042, F-043 |

#### Ideal Path

| # | Step description |
| :--- | :--- |
| 1 | Cashier logs into the POS system and opens the order screen. |
| 2 | The POS order screen displays the interactive menu grid. Items with depleted stock are visually grayed out and their “Add to Cart” button is disabled. |
| 3 | Cashier selects menu items requested by customer, configures required/optional item modifiers (heat level, toppings), adjusts quantities, and adds per-item notes. Items are added to the live cart. |
| 4 | Cashier selects order type (Dine-In with mandatory table routing number, or Takeaway). |
| 5 | Cashier clicks “Proceed to Checkout.” System displays order summary showing subtotal, 11% tax, and total amount, presenting optional CRM fields for WhatsApp/email. |
| 6 | Cashier enters optional customer contact details if provided. |
| 7 | Cashier selects payment method: Cash (system computes change owed based on amount tendered) or QRIS (displays QRIS logo, cashier clicks confirm). |
| 8 | System confirms payment, locks ingredient rows via pessimistic `SELECT FOR UPDATE`, deducts required ingredient quantities, records recipe-based COGS, and completes transaction. |

---

## 8. Revision History

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| v1 | 7 May 2026 | Farrell Abhivandya Mecca, Muhammad Daffa Fadillah, Muhlifain Abel, Mohammed Aatef Saleh, Anita Hayatunnufus | Initial draft |
| v2 | 19 June 2026 | Mohammed Aatef Saleh | Completely restructured the PRD to pivot the system focus from a QR self-ordering application to an integrated Cashier POS, Warehouse Management, and Business Intelligence (BI) system. |
| v3 | 29 June 2026 | Mohammed Aatef Saleh | Appended F-029 to F-034 and NFR-019 to formally document manager and BI features built beyond the MVP scope (Advanced IDs, Supplier Geography, Contact Validation, Last Active Tracking, Super-Admin Delete protection, Soft Delete, and Login Revocation). |
| v4 | 30 June 2026 | Mohammed Aatef Saleh | Appended F-035 to formally document the 3D inline notification queue feature built beyond the MVP scope. |
| v5 | 22 July 2026 | Mohammed Aatef Saleh | Comprehensive PRD reconciliation pass aligning spec with production codebase post-expo. Updated concurrency (NFR-011 dual-layer locking), authentication (JWT refresh, PIN auth, rate limiting), PO lifecycle, 11% tax, modifiers, and BI analytics requirements; added structured PO IDs to F-030 and log rotation NFR-020; documented implementation status and gaps across all features. |
