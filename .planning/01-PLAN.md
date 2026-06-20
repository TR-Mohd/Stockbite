# Stockbite Backend Tasks

- [x] Wave 1: Database Foundation
  - [x] Initialize Python environment (venv) and install dependencies (fastapi, sqlalchemy, asyncpg, alembic, pydantic)
  - [x] Create `docker-compose.yml` for local PostgreSQL instance
  - [x] Setup SQLAlchemy async database engine and session maker
  - [x] Define ORM Models (User, Shift, Supplier, PurchaseOrder, Ingredient, Recipe, MenuItem, Transaction, AuditLog)
  - [x] Initialize Alembic and generate initial migration
- [x] Wave 2: API Layer
  - [x] Set up basic FastAPI app structure and CORS
  - [x] Implement Authentication & RBAC (STRICTLY JWT Bearer tokens)
  - [x] Implement Inventory & POS endpoints
    - [x] POS Transaction checkout with OPTIMISTIC LOCKING using version numbers in SQLAlchemy (NFR-011)
    - [x] Inventory adjustments and low-stock alerts
  - [x] Implement Supplier & PO endpoints
  - [x] Implement Manager BI endpoints (Revenue, COGS)
- [x] Verification
  - [x] Write pytest cases for concurrent checkout flow
  - [x] Manually verify Swagger UI
