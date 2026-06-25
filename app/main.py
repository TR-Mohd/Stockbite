# pyrefly: ignore [missing-import]
from fastapi import FastAPI
# pyrefly: ignore [missing-import]
from fastapi.middleware.cors import CORSMiddleware
from .routers import pos, inventory, suppliers, manager

app = FastAPI(title="Stockbite Backend API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from .auth import router as auth_router

app.include_router(auth_router)
app.include_router(pos.router)
app.include_router(inventory.router)
app.include_router(suppliers.router)
app.include_router(manager.router)

@app.get("/")
def read_root():
    return {"message": "Welcome to Stockbite API"}
