# PRODUCT REQUIREMENTS DOCUMENT

## Stockbite

An integrated Management Information System for fast-paced franchise restaurants featuring QR self-ordering, Kitchen Display System (KDS), and automated real-time inventory tracking.

| | |
| --- | --- |
| **Version** | v3 - Draft |
| **Date** | 19 June 2026 |
| **Team** | MBG (Mahasiswa Berprestasi Global) |
| **Product Owner** | Mohammed Aatef Saleh |
| **Client / Stakeholder** | Restaurant / F&B Business Owner |
| **Status** | Draft |

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

> **What counts as a real metric**
> 'User satisfaction' is not a metric. 'Average time to complete vaccine registration, measured via server-side session logs' is. Before writing any metric, ask: can I measure this before launch and again after? If the answer is no, replace it.

## 4. Scope

### 4.1 In Scope & Out of Scope (MVP)

| ✅ IN Scope (MVP) | ❌ OUT of Scope (v1) |
| :--- | :--- |
| Web-based Cashier POS with live menu grid and real-time stock-aware item availability. | Native iOS/Android mobile applications (will use a responsive web-browser approach for Phase 1). |
| Cash payment with auto-change calculation and simulated QRIS payment (dummy QR code generation). | Real payment gateway integration (actual QRIS, GoPay, OVO API connections). |
| Optional CRM data capture (WhatsApp number or email) at checkout. | Full-featured loyalty points system and promotional campaign engine (data capture is in scope; the loyalty program itself is deferred). |
| E-receipt generation as downloadable PDF; simulated routing to captured WA/email. | Physical thermal printer integration or dedicated POS hardware connectivity. |
| Cashier shift management (clock-in/clock-out with session tracking). | Biometric or NFC-based staff attendance systems. |
| Real-time master inventory with automatic recipe-based stock deduction per transaction. | Integration with third-party delivery platforms (GrabFood, GoFood, ShopeeFood). |
| Automated ROP alerts and draft Purchase Order generation. | Automated direct e-procurement to external supplier systems (POs are generated internally; actual ordering is done manually). |
| Supplier directory with contact details, specialization, and order history. | Customer self-ordering via QR code or mobile app (ordering is handled by the cashier). |
| Waste/spoilage logging with reason codes. | Kitchen Display System (KDS) for digital order routing to kitchen staff. |
| Manager BI dashboard with revenue, COGS, profit margin charts, and sales heatmaps. | AI/ML-powered demand forecasting and predictive analytics (data is collected for future use). |
| Market Basket Analysis showing best sellers and frequently co-purchased items. | Multi-branch / franchise-level operations (single-location MVP). |
| Immutable audit and security logs (cashier logins, session times, sensitive actions). | |
| Role-Based Access Control (RBAC) with Manager, Cashier, and Warehouse roles. | |

### 4.2 Assumptions & Constraints

| Type | Description |
| :--- | :--- |
| Assumption | The business has at least one desktop or tablet device with a modern web browser (Chrome, Firefox, Edge) and a stable internet connection at the cashier station and warehouse area. |
| Assumption | All menu items have pre-defined digital recipes (ingredient lists with quantities) entered into the system before going live. |
| Assumption | The business has an existing supplier base whose contact information can be entered into the Supplier Directory during initial setup. |
| Constraint | The MVP must be developed and ready for academic presentation within the semester project timeline. |
| Constraint | No physical hardware integration is permitted — all hardware actions (receipt printing, QRIS scanning) are simulated via software (PDF generation, dummy QR codes). |
| Constraint | The system is a web-based prototype; it is not expected to handle production-level traffic or comply with financial regulatory standards (e.g., PCI-DSS). |

---

# PART 2: FUNCTIONAL REQUIREMENTS & WORKFLOWS

## 5. Functional Requirements

> **Before you submit each FR, check four things**
> 1. Unambiguous: two engineers reading it independently would build the same thing.
> 2. Testable: you can write a pass/fail test case for it right now.
> 3. Feasible: it can be built within this project's constraints.
> 4. Prioritized: you have a MoSCoW label and you would defend it in a scope-cut conversation.

### 5.1 FR Table: Cashier

| FR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FR-001 | Cashier | Display an interactive grid of all menu items showing item name, price, image thumbnail, and real-time availability status. | When the cashier opens or refreshes the POS order screen. | Critical | M |
| FR-002 | System | Automatically gray out and disable the “Add to Cart” button for any menu item whose required ingredients have fallen to zero in the master inventory. | When the system detects that any ingredient required by the item’s digital recipe has a stock level of 0. | Critical | M |
| FR-003 | Cashier | Allow the cashier to add multiple menu items to a cart, adjust item quantities, add per-item notes, and remove items before finalizing the order. | Allow the cashier to add multiple menu items to a cart, adjust item quantities, add per-item notes, and remove items before finalizing the order. | Critical | M |
| FR-004 | System | Calculate the total order amount and, when cash is selected as the payment method, compute and display the exact change owed to the customer based on the amount tendered. | When the cashier clicks “Calculate” or “Finalize Payment” after entering the cash amount received. | Critical | M |
| FR-005 | System | Generate a simulated QRIS payment screen displaying a dummy QR code image and a manual “Mark as Paid” button for the cashier to confirm payment. | When the cashier selects “QRIS” as the payment method during checkout. | Critical | M |
| FR-006 | Cashier | Present optional input fields for the customer’s WhatsApp number and/or email address on the checkout screen, allowing the cashier to quickly enter or skip CRM data capture. | When the cashier proceeds to the payment/checkout stage of the transaction. | High | S |
| FR-007 | System | Generate a digital e-receipt in PDF format containing the transaction ID, itemized list with prices, total amount, payment method, date/time, and captured customer contact (if provided). | Immediately after payment is confirmed (cash accepted or QRIS marked as paid). | High | M |
| FR-008 | System | Display a simulated confirmation message stating “Receipt sent to [WA number / email]” when a customer contact was captured, or provide a “Download Receipt” button when no contact was entered. | After the e-receipt PDF is generated. | Medium | S |
| FR-009 | Cashier | Record a shift clock-in event with the cashier’s user ID, timestamp, and session start marker; and record a clock-out event with session end marker and total shift duration. | When the cashier clicks “Clock In” at the start of a shift or “Clock Out” at the end. | High | M |
| FR-010 | System | Display a shift summary showing total transactions processed, total revenue collected (split by cash and QRIS), and shift duration when a cashier clocks out. | When the cashier completes the clock-out action. | Medium | S |

### 5.2 FR Table : Warehouse Staff

| FR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FR-011 | System | Automatically deduct the exact quantities of each ingredient defined in the menu item’s digital recipe from the master inventory upon transaction confirmation. | When a cashier finalizes a transaction and payment is confirmed. | Critical | M |
| FR-012 | Warehouse Staff | Display a master inventory dashboard listing all ingredients with their current stock level, unit of measure, Reorder Point (ROP) threshold, and last-updated timestamp. | When the warehouse staff navigates to the Inventory Management screen. | Critical | M |
| FR-013 | System | Visually flag (e.g., red highlight or warning icon) any ingredient whose current stock level has reached or fallen below its predefined Reorder Point (ROP). | When the system detects an ingredient’s stock level ≤ ROP after any stock-modifying event (sale, waste log, or manual adjustment). | High | M |
| FR-014 | Warehouse Staff | Allow manual adjustment of ingredient stock levels (increase for received goods, decrease for corrections) with a mandatory reason field. | When the warehouse staff selects an ingredient and clicks “Adjust Stock.” | High | M |
| FR-015 | System | Generate a pre-filled draft Purchase Order containing the flagged ingredient name, current stock, ROP, suggested reorder quantity, and the preferred supplier auto-selected from the Supplier Directory. | When a warehouse staff or manager clicks “Draft PO” on a low-stock ingredient alert. | High | S |
| FR-016 | Warehouse Staff | Log a waste event for a specific ingredient, recording the quantity wasted, reason code (Expired, Dropped, Spoiled, Other), and the timestamp of the event. | When the warehouse staff selects an ingredient and clicks “Log Waste.” | High | M |
| FR-017 | Manager | Maintain a Supplier Directory where each record includes: Supplier Name, Specialization (what they supply), Phone Number, Email, Physical Address, and a read-only Order History log. | When a manager navigates to the Supplier Management screen and adds, edits, or views a supplier record. | High | M |
| FR-018 | System | Append a timestamped entry to a supplier’s Order History log each time a Purchase Order referencing that supplier is marked as “Sent” or “Received.” | When the status of a Purchase Order linked to a supplier is updated. | Medium | S |
| FR-019 | Warehouse Staff | Perform a stock search and filter operation on the master inventory by ingredient name, category, or stock status (Normal, Low, Out of Stock). | Perform a stock search and filter operation on the master inventory by ingredient name, category, or stock status (Normal, Low, Out of Stock). | Medium | S |

### 5.3 FR Table : Manager (BI & Administration)

| FR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW |
| :--- | :--- | :--- | :--- | :--- | :--- |
| FR-020 | Manager | Display a BI dashboard containing real-time visualizations of: Gross Revenue, Net Revenue, COGS, and Profit Margin as numerical KPIs and trend-line charts for a selectable date range. | When the manager logs into the Manager Command Center. | Critical | M |
| FR-021 | System | Display a sales heatmap showing transaction volume by hour-of-day and day-of-week for a selectable date range. | When the manager navigates to the “Sales Analytics” section of the BI dashboard. | High | S |
| FR-022 | System | Display a “Best Sellers” ranked list and a “Frequently Bought Together” association table (Market Basket Analysis) based on historical transaction data. | When the manager navigates to the “Product Insights” section of the BI dashboard. | High | S |
| FR-023 | Manager | Create, edit, deactivate, and assign roles (Manager, Cashier, Warehouse Staff) to user accounts within the system. | When the manager navigates to “User Management” and performs an account action. | Medium | M |
| FR-024 | System | Enforce Role-Based Access Control (RBAC) ensuring: Cashiers can only access the POS module; Warehouse Staff can only access the Inventory module; Managers can access all modules. | Every time any user attempts to navigate to a system module or perform an action. | Critical | M |
| FR-025 | System | Record an immutable audit log entry for every security-sensitive event: user login, user logout, failed login attempt, shift clock-in/out, stock adjustment, PO status change, and user account modification. | When any of the listed events occurs. | High | M |
| FR-026 | Manager | View and filter the audit log by date range, user, and event type. | When the manager navigates to the “Audit Logs” section. | Medium | S |
| FR-027 | Manager | Export BI dashboard data (revenue, COGS, profit, best sellers) and inventory reports as a downloadable CSV or PDF file. | When the manager selects a report type, date range, and clicks “Export Report.” | Medium | C |
| FR-028 | Manager | Manage the menu catalog: add new menu items (with name, price, category, image, and linked digital recipe), edit existing items, and deactivate items. | When the manager navigates to “Menu Management” and performs a catalog action. | Critical | M |
| **F-029** | Manager | Display an accurate "Last Active" timestamp for each employee in the User Management list by aggregating their latest POS transaction or login event. | When the manager views the Staff list in the User Management module. | Medium | S |
| **F-030** | System | Automatically generate structured IDs for new employees (`EMP-<ROLE>-<YY><SEQ>`) and suppliers (`SUP-<HUB>-<YY><SEQ>`) instead of default UUIDs. | When adding a new user or supplier via the management modals. | High | S |
| **F-031** | System | Restrict the permanent deletion ("Firing") of User accounts exclusively to a predefined Super-Admin or Founder account, blocking standard Managers. | When a deletion request is sent or the Staff Management UI is rendered. | High | M |
| **F-032** | Manager | Assign a "Coverage" type (Regional/National) and a "Logistics Hub" region to suppliers to track geographical supply chain distribution. | When creating or editing a supplier record in the Supplier Directory. | Medium | S |
| **F-033** | System | Apply live conditional formatting to phone numbers and perform strict validation on email addresses during data entry. | When a user types in phone or email fields in CRM or Supplier modals. | Medium | S |

> **MoSCoW reference**
> * **M** Must Have: the product does not ship without this.
> * **S** Should Have: significant value, expected in the next sprint or release.
> * **C** Could Have: nice to have; only included when higher-priority items are done.
> * **W** Won't Have (this time): deferred. Write it here so it cannot silently re-enter scope.

## 6. Non-Functional Requirements

### 6.1 NFR Table · Performance

| NFR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW |
| :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-001 | All Users | Load any primary screen (POS grid, Inventory dashboard, BI dashboard) in under 3 seconds. | When a user navigates to any main module on a standard broadband connection (≥ 5 Mbps). | Critical | M |
| NFR-002 | System | Complete the full inventory deduction cycle (recipe lookup → stock update → UI refresh) in under 2 seconds per transaction. | When a cashier confirms a payment and the system triggers the recipe-based deduction. | Critical | M |
| NFR-003 | All Users | Support a minimum of 10 concurrent user sessions (cashiers, warehouse staff, and managers combined) without performance degradation. | During peak operating hours when multiple staff access the system simultaneously. | High | M |
| NFR-004 | System | Maintain a system uptime of at least 99% within any given calendar month during the prototype evaluation period. | Throughout all operating hours. | High | M |
| NFR-005 | All Users | Render a fully responsive interface usable on desktop screens (minimum 1024 px width) and tablet screens (minimum 768 px width). | Every time the system is accessed via a cashier workstation desktop or a warehouse tablet. | High | M |
| NFR-006 | All Users | Display clear, user-friendly error messages in Bahasa Indonesia or English for every system failure scenario, including a suggested corrective action. | When an error occurs during any operation (ordering, payment, stock update, login). | Medium | S |

### 6.2 NFR Table · Cashier

| NFR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW |
| :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-007 | Cashier | Transmit all transaction data over HTTPS/TLS 1.2 or higher to ensure data integrity during payment processing. | Every time a cashier initiates a checkout and confirms a payment. | Critical | M |
| NFR-008 | Cashier | Persist the current in-progress cart data in the browser’s local storage so that an incomplete transaction can be recovered after an accidental page refresh. | When the cashier’s browser session is interrupted by an accidental refresh or tab closure during an active transaction. | High | S |
| NFR-009 | System | Generate the e-receipt PDF and make it available for download or simulated dispatch within 5 seconds of payment confirmation. | Immediately after a transaction is confirmed. | High | M |

### 6.3 NFR Table · Warehouse Staff

| NFR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW |
| :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-010 | Warehouse Staff | Reflect updated stock levels on the Inventory Management screen within 5 seconds of any stock-modifying event (transaction, waste log, manual adjustment). | After any event that changes an ingredient’s stock quantity. | High | M |
| NFR-011 | System | Prevent race conditions when simultaneous stock modifications target the same ingredient by applying database-level optimistic locking or equivalent concurrency control. | When two or more events (e.g., a cashier transaction and a warehouse manual adjustment) attempt to modify the same ingredient’s stock at the same time. | High | M |
| NFR-012 | System | Retain all waste log entries, stock adjustment records, and Purchase Order drafts for a minimum of 12 months for audit and historical analysis purposes. | At all times; data must not be purged or overwritten within the retention period. | High | S |

### 6.4 NFR Table · Manager (BI & Security)

| NFR ID | Actor | The system shall… | Condition / Trigger | Priority | MoSCoW |
| :--- | :--- | :--- | :--- | :--- | :--- |
| NFR-013 | System | Restrict access to the Manager Command Center, User Management, and Audit Logs exclusively to users with authenticated credentials and the “Manager” role. | Every time a user attempts to access managerial pages, reports, or administrative functions. | Critical | M |
| NFR-014 | System | Deliver a low-stock notification on the manager’s BI dashboard within 30 seconds of the system detecting that an ingredient’s stock level has reached or fallen below its Reorder Point. | When the system detects a stock level ≤ ROP after any stock-modifying event. | High | M |
| NFR-015 | System | Store all audit log entries as append-only (immutable) records that cannot be edited or deleted by any user, including Managers. | Every time a security-sensitive event is logged. | High | M |
| NFR-016 | System | Render BI dashboard charts (revenue trends, heatmaps, best sellers) within 5 seconds for date ranges up to 90 days. | When the manager selects a date range and the dashboard fetches and visualizes the data. | High | M |
| NFR-017 | System | Hash and salt all user passwords using bcrypt (or equivalent) before storing them in the database; plaintext passwords must never be persisted. | Every time a new user account is created or a password is changed. | Critical | S |
| NFR-018 | System | Provide structured, searchable system activity logs containing timestamp, user ID, action type, affected resource, and outcome (success/fail) for every logged event. | Every time a transaction occurs, a stock adjustment is made, or an account is modified. | Medium | S |

## 7. User Workflows

### 7.1 Workflow: Cashier Processing an Order with CRM Data Capture & Payment

| | |
| :--- | :--- |
| **Actor** | Cashier |
| **Goal** | Process a customer’s food order, optionally capture their WhatsApp number or email for CRM, finalize payment (cash or simulated QRIS), and issue an e-receipt. |
| **FRs covered** | FR-001, FR-002, FR-003, FR-004, FR-005, FR-006, FR-007, FR-008, FR-009, FR-011 |

#### Ideal Path

| # | Step description |
| :--- | :--- |
| 1 | Cashier logs into the POS system and clocks in for their shift. The system records the clock-in timestamp and session start marker. |
| 2 | The POS order screen displays the interactive menu grid. Items with depleted stock are visually grayed out and their “Add to Cart” button is disabled. |
| 3 | Cashier selects menu items the customer requests, adjusts quantities, and adds any per-item notes (e.g., “no ice”, “extra spicy”). Items are added to the live cart. |
| 4 | Cashier clicks “Proceed to Checkout.” The system displays the order summary with the total amount, and presents optional CRM fields for the customer’s WhatsApp number and/or email. |
| 5 | Cashier asks the customer if they’d like to provide their contact for a digital receipt. If yes, the cashier enters the WA number or email. If the customer declines, the fields are left blank. |
| 6 | Cashier selects the payment method: Cash — enters the amount tendered, and the system calculates and displays the change owed; QRIS — the system displays a dummy QR code image, and the cashier clicks “Mark as Paid” after the customer scans. |
| 7 | The system confirms payment, deducts all required ingredients from the master inventory via the digital recipe, generates an e-receipt PDF, and displays a “Transaction Successful” confirmation. |
| 8 | If CRM data was captured, the system shows a simulated “Receipt sent to [contact]” confirmation. If no CRM data, a “Download Receipt” button is displayed. |

#### Decision Points

| Decision Point | YES / Success path | NO / Error path |
| :--- | :--- | :--- |
| Is the menu item in stock? | The system enables the “Add to Cart” button, allowing the cashier to add the item to the order. | The system grays out the item tile and disables the “Add to Cart” button, displaying an “Out of Stock” badge on the item. |
| Did the customer provide a WA number or email? | The system stores the contact in the CRM database and simulates sending the e-receipt to the provided contact. | The system skips CRM capture, marks the contact fields as null, and provides a downloadable PDF receipt instead. |
| Is the payment successful? (Cash: sufficient amount tendered; QRIS: “Mark as Paid” clicked) | The system confirms the transaction, triggers inventory deduction, and generates the e-receipt. | Cash: The system displays “Insufficient amount. Please collect [remaining amount] from the customer.” QRIS: The transaction remains pending until “Mark as Paid” is clicked or the cashier clicks “Cancel Transaction.” |

#### Edge Cases

| Edge Case | What the system must do |
| :--- | :--- |
| A menu item’s stock is depleted by another transaction while the current cashier has it in their cart but has not yet finalized payment. | The system must perform a final stock availability check against the master inventory at the moment of payment confirmation. If any item in the cart is now out of stock, the system must block the payment and display: “Sorry, [Item Name] is no longer available. Please remove it from the cart to continue.” |
| The cashier accidentally refreshes the browser page during an active transaction (items in cart, but payment not yet confirmed). | The system must persist the in-progress cart data in the browser’s local storage. Upon page reload, the system must detect the saved session and prompt: “You have an unsaved transaction. Would you like to restore it?” with “Restore” and “Discard” options. |
| A cash transaction is completed but the cashier entered the wrong tender amount, resulting in an incorrect change calculation. | The system must allow the cashier to void the transaction within a configurable window (e.g., 5 minutes) by clicking “Void Last Transaction.” The void action must: reverse the inventory deduction, log the void event in the audit trail with the cashier’s user ID, and require a manager PIN for authorization. |
| The cashier enters an invalid WhatsApp number format (e.g., too few digits, contains letters). | The system must perform client-side validation on the WA field (numeric only, minimum 10 digits, maximum 15 digits with optional “+” country code prefix). If invalid, the system must display an inline error: “Invalid phone number format. Please correct or leave blank to skip.” The transaction must not be blocked — the cashier can clear the field and proceed without CRM capture. |

### 7.2 Workflow: Manager Analyzing a Low-Stock Alert, Viewing Supplier Directory & Drafting a Purchase Order

| | |
| :--- | :--- |
| **Actor** | Manager |
| **Goal** | Respond to a system-generated low-stock alert, review the affected ingredient’s details, look up the preferred supplier in the Supplier Directory, and generate a draft Purchase Order (PO). |
| **FRs covered** | FR-012, FR-013, FR-015, FR-017, FR-018, FR-020, FR-025 |

#### Ideal Path

| # | Step description |
| :--- | :--- |
| 1 | Manager logs into the Manager Command Center. The BI dashboard loads, displaying real-time KPIs (revenue, COGS, profit margin) and a notification badge indicating pending low-stock alerts. |
| 2 | Manager clicks the notification badge. The system displays a list of all ingredients currently at or below their Reorder Point (ROP), each showing: ingredient name, current stock level, ROP threshold, and last deduction timestamp. |
| 3 | Manager selects a specific ingredient (e.g., “Chicken Breast – 2 kg remaining, ROP: 5 kg”). The system displays the ingredient’s detail card with stock history, recent consumption rate, linked menu items, and the preferred supplier name. |
| 4 | Manager clicks “View Supplier.” The system navigates to the Supplier Directory and displays the supplier’s full record: Name, Specialization, Phone Number, Email, Address, and Order History. |
| 5 | Manager reviews the supplier’s past order history (dates, items ordered, quantities, PO statuses) to understand typical lead times and pricing. |
| 6 | Manager clicks “Draft Purchase Order.” The system generates a pre-filled PO containing: supplier details, ingredient name, current stock, ROP, a suggested reorder quantity (calculated as 2× the difference between ROP and current stock, or a configurable multiplier), and today’s date. |
| 7 | Manager reviews the draft PO, adjusts the quantity if needed, adds optional notes (e.g., “Urgent – needed by tomorrow AM”), and clicks “Confirm & Save PO.” |
| 8 | The system saves the PO with a status of “Draft,” appends a timestamped entry to the supplier’s Order History log, and records the action in the immutable audit log. |

#### Decision Points

| Decision Point | YES / Success path | NO / Error path |
| :--- | :--- | :--- |
| Are there any ingredients currently at or below ROP? | The system displays the notification badge with the count of flagged ingredients and provides a clickable alert list. | The notification badge shows zero alerts. The manager proceeds to use the BI dashboard normally with no ROP action required. |
| Does the flagged ingredient have a preferred supplier assigned in the Supplier Directory? | The system auto-fills the supplier details into the draft PO and enables the “View Supplier” link. | The system displays: “No preferred supplier assigned for [Ingredient Name]. Please assign a supplier in the Supplier Directory before drafting a PO.” The “Draft PO” button is disabled until a supplier is linked. |
| Does the manager approve the draft PO as-is? | The manager clicks “Confirm & Save PO,” and the PO is saved with “Draft” status. | The manager can edit the quantity, change the supplier, add notes, or click “Cancel” to discard the draft entirely. All edits are reflected in the final saved PO. |

#### Edge Cases

| Edge Case | What the system must do |
| :--- | :--- |
| Multiple ingredients from the same supplier all breach their ROP simultaneously. | The system must allow the manager to select multiple low-stock ingredients and generate a single consolidated draft PO to the shared supplier, listing all ingredients and their respective reorder quantities. This avoids sending multiple separate POs to the same supplier. |
| A supplier’s phone number or email in the directory is outdated or empty. | The system must display a warning icon next to the supplier’s name on the PO draft screen: “⚠ Supplier contact information may be incomplete. Please verify before sending.” The PO can still be saved as a draft, but the warning is logged. |
| The manager drafts a PO for an ingredient, but before confirming, another transaction further reduces the stock to zero. | The system must refresh the ingredient’s current stock level on the PO draft screen in real-time. If the stock has changed since the draft was opened, the system must display an inline notification: “Stock level has changed since this PO was drafted (was [old], now [new]). Suggested quantity updated.” The suggested reorder quantity must recalculate automatically. |
| A manager accidentally creates a duplicate PO for the same ingredient and supplier within the same day. | The system must check for existing draft POs with the same ingredient-supplier combination dated today. If a duplicate is detected, the system must display a confirmation dialog: “A draft PO for [Ingredient] from [Supplier] already exists today (PO-[ID]). Do you want to open the existing PO or create a new one?” |

## Revision History

| Version | Date | Author | Changes |
| :--- | :--- | :--- | :--- |
| v1 | 7 May 2026 | Farrell Abhivandya Mecca, Muhammad Daffa Fadillah, Muhlifain Abel, Mohammed Aatef Saleh, Anita Hayatunnufus | Initial draft |
| v2 | 19 June 2026 | Mohammed Aatef Saleh | Completely restructured the PRD to pivot the system focus from a QR self-ordering application to an integrated Cashier POS, Warehouse Management, and Business Intelligence (BI) system. |
| v3 | 29 June 2026 | Mohammed Aatef Saleh | Appended F-029 to F-033 to formally document manager and BI features built beyond the MVP scope (Advanced IDs, Supplier Geography, Contact Validation, Last Active Tracking, and Super-Admin Delete protection). |
