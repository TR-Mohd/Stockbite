from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from .models import RoleEnum, StatusEnum, POStatusEnum, PaymentMethodEnum

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[RoleEnum] = None

class UserBase(BaseModel):
    name: str
    role: RoleEnum

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class IngredientResponse(BaseModel):
    id: str
    name: str
    stock_level: float
    unit: str
    reorder_point: float
    category: Optional[str] = "Uncategorized"
    last_updated: datetime
    preferred_supplier_id: Optional[str] = None
    version_id: int
    model_config = ConfigDict(from_attributes=True)

class BulkReceiveItem(BaseModel):
    ingredient_id: str
    quantity: float

class BulkReceiveRequest(BaseModel):
    items: List[BulkReceiveItem]

class MenuItemResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    image: Optional[str] = None
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class CartItemCreate(BaseModel):
    menu_item_id: str
    quantity: int
    notes: Optional[str] = None

class TransactionCreate(BaseModel):
    payment_method: PaymentMethodEnum
    amount_tendered: Optional[float] = None
    customer_contact: Optional[str] = None
    items: List[CartItemCreate]

class TransactionResponse(BaseModel):
    id: str
    total_amount: float
    payment_method: PaymentMethodEnum
    amount_tendered: Optional[float]
    change: Optional[float]
    timestamp: datetime
    status: StatusEnum
    model_config = ConfigDict(from_attributes=True)

class SupplierResponse(BaseModel):
    id: str
    name: str
    specialization: Optional[str]
    phone: Optional[str]
    email: Optional[str]
    address: Optional[str]
    model_config = ConfigDict(from_attributes=True)
