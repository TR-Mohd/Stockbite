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
    id: Optional[str] = None

class UserUpdate(BaseModel):
    name: str
    role: RoleEnum
    password: Optional[str] = None

class UserResponse(UserBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class StaffResponse(BaseModel):
    id: str
    name: str
    role: str
    last_active: Optional[datetime] = None
    status: str
    has_transactions: bool = False

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

class SupplierBase(BaseModel):
    name: str
    specialization: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None

class SupplierCreate(SupplierBase):
    id: Optional[str] = None

class SupplierUpdate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: str
    is_active: bool
    model_config = ConfigDict(from_attributes=True)

class RevenueTrendItem(BaseModel):
    date: str
    revenue: float

class BestSellerItem(BaseModel):
    menu_item_name: str
    total_sold: int

class HeatmapDataPoint(BaseModel):
    day_of_week: int
    hour_of_day: int
    transaction_count: int

class BasketAnalysisItem(BaseModel):
    item1_name: str
    item2_name: str
    frequency: int

