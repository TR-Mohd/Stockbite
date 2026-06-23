# Stockbite 🍔📈

An integrated Management Information System for fast-paced franchise restaurants featuring QR self-ordering, Kitchen Display System (KDS), and automated real-time inventory tracking.

## 🌟 About The Project

Many F&B business owners struggle to assess real-time profitability, control warehouse costs, or build customer relationships due to disconnected cashier registers and manual stock counting. This fragmentation results in stock-outs, untracked waste, and delayed financial reporting.

**Stockbite** solves this by unifying cashier operations, warehouse management, and managerial reporting into a single web-based platform. 

### Key Objectives
- **Lightning-Fast Checkout:** Digitize the order-to-payment workflow to reduce transaction time to under 90 seconds.
- **Real-Time Inventory:** Automatic, recipe-based stock deduction to maintain ≥95% inventory accuracy and prevent mid-service stock-outs.
- **CRM Integration:** Capture customer contact data (WhatsApp/Email) right at the point of sale.
- **Managerial BI Dashboards:** Provide live Gross Revenue, Net Revenue, COGS, and Profit Margin visualizations.
- **Automated Procurement:** Generate draft Purchase Orders instantly when ingredients breach their Reorder Point (ROP).

## 👥 Target Users
- **Cashiers:** Quick order processing, auto-change calculation, and CRM data capture.
- **Warehouse Staff:** Live inventory visibility and waste/spoilage logging without daily manual counts.
- **Managers / Owners:** Live business performance dashboards, role-based access control, and centralized supplier management.

## 🛠️ Technology Stack
- **Frontend:** React + Vite
- **Backend:** FastAPI (Python)
- **Database:** PostgreSQL (with asyncpg & SQLAlchemy)
- **Authentication:** JWT Bearer tokens with Role-Based Access Control (RBAC)

## 🚀 Getting Started

### Prerequisites
Make sure you have [Docker](https://www.docker.com/) and Python installed.

### 1. Start the Database
Run the PostgreSQL database via Docker Compose:
```bash
docker compose up -d
```

### 2. Start the Backend (FastAPI)
Activate your Python environment and run the Uvicorn server:
```bash
# Windows
.\.venv\Scripts\activate
# Mac/Linux
source .venv/bin/activate

# Run the server
uvicorn app.main:app --reload
```

### 3. Start the Frontend (React)
Open a new terminal window, navigate to the `frontend` directory, and start the Vite dev server:
```bash
cd frontend
npm install
npm run dev
```

## 📝 Team
Developed by MBG (Mahasiswa Berprestasi Global).
- Mohammed Aatef Saleh
- Muhlifain Abel
- Anita Hayatunnufus
- Farrell Abhivandya Mecca
- Muhammad Daffa Fadillah
