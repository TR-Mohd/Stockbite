from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional
from datetime import datetime
from .models import RoleEnum, StatusEnum, POStatusEnum, PaymentMethodEnum, OrderTypeEnum

class PinAuthRequest(BaseModel):
    pin: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[RoleEnum] = None

class UserBase(BaseModel):
    name: str
    username: str
    role: RoleEnum
    phone_number: Optional[str] = None
    email: Optional[str] = None

class UserCreate(UserBase):
    password: str
    id: Optional[str] = None

class UserUpdate(BaseModel):
    name: str
    username: str
    role: RoleEnum
    password: Optional[str] = None
    phone_number: Optional[str] = None
    email: Optional[str] = None

class UserResponse(UserBase):
    id: str
    model_config = ConfigDict(from_attributes=True)

class StaffResponse(BaseModel):
    id: str
    name: str
    username: Optional[str] = None
    role: str
    phone_number: Optional[str] = None
    email: Optional[str] = None
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
    unit_cost: float = 0.0
    active_po_status: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class IngredientCreate(BaseModel):
    name: str
    unit: str
    stock_level: float = Field(default=0.0, ge=0.0)
    reorder_point: float = Field(default=0.0, ge=0.0)
    category: Optional[str] = "Uncategorized"
    unit_cost: float = Field(default=0.0, ge=0.0)
    preferred_supplier_id: Optional[str] = None

class IngredientUpdate(BaseModel):
    name: Optional[str] = None
    unit: Optional[str] = None
    reorder_point: Optional[float] = Field(default=None, ge=0.0)
    category: Optional[str] = None
    unit_cost: Optional[float] = Field(default=None, ge=0.0)
    preferred_supplier_id: Optional[str] = None

class BulkReceiveItem(BaseModel):
    ingredient_id: str
    quantity: float = Field(..., gt=0.0)

class BulkReceiveRequest(BaseModel):
    items: List[BulkReceiveItem]

class ModifierResponse(BaseModel):
    id: str
    name: str
    price_adjustment: float
    model_config = ConfigDict(from_attributes=True)

class ModifierGroupResponse(BaseModel):
    id: str
    name: str
    is_required: bool
    min_selections: int
    max_selections: Optional[int]
    modifiers: List[ModifierResponse] = []
    model_config = ConfigDict(from_attributes=True)

class MenuItemResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    price: float
    category: Optional[str] = None
    image: Optional[str] = None
    is_active: bool
    modifier_groups: List[ModifierGroupResponse] = []
    model_config = ConfigDict(from_attributes=True)

class CartItemCreate(BaseModel):
    menu_item_id: str
    quantity: int = Field(..., gt=0)
    notes: Optional[str] = Field(None, max_length=500)
    modifier_ids: List[str] = []

class TransactionCreate(BaseModel):
    payment_method: PaymentMethodEnum
    amount_tendered: Optional[float] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    order_type: OrderTypeEnum
    routing_number: Optional[str] = None
    items: List[CartItemCreate]

class TransactionResponse(BaseModel):
    id: str
    subtotal: float
    tax: float
    total_amount: float
    payment_method: PaymentMethodEnum
    amount_tendered: Optional[float]
    change: Optional[float]
    timestamp: datetime
    status: StatusEnum
    order_type: OrderTypeEnum
    routing_number: Optional[str]
    whatsapp: Optional[str]
    email: Optional[str]
    model_config = ConfigDict(from_attributes=True)

class OrderHistoryItem(BaseModel):
    id: str
    timestamp: datetime
    order_type: OrderTypeEnum
    routing_number: Optional[str]
    payment_method: PaymentMethodEnum
    subtotal: float
    tax: float
    total_amount: float
    status: StatusEnum
    cashier_name: Optional[str]
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedOrderHistory(BaseModel):
    items: List[OrderHistoryItem]
    total: int
    total_revenue: float
    page: int
    size: int

class SupplierBase(BaseModel):
    name: str
    specialization: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    region: Optional[str] = None

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
    confidence: Optional[float] = None

class OrderVelocityDataPoint(BaseModel):
    date: str
    orders: int

class MenuEngineeringItem(BaseModel):
    menu_item_id: str
    menu_item_name: str
    units_sold: int
    avg_contribution_margin_per_unit: float
    category: str # "Star", "Plowhorse", "Puzzle", "Dog", or "Insufficient Data"

class MenuEngineeringResponse(BaseModel):
    insufficient_data: bool
    total_orders: int
    average_volume: float
    average_margin: float
    items: List[MenuEngineeringItem]

class KPITransactionItem(BaseModel):
    id: str
    timestamp: datetime
    payment_method: str
    gross_revenue: float
    tax: float
    cogs: float
    net_revenue: float
    
    model_config = ConfigDict(from_attributes=True)

class PaginatedKPITransactions(BaseModel):
    items: List[KPITransactionItem]
    total: int
    page: int
    size: int

class COGSBreakdownItem(BaseModel):
    menu_item_id: str
    menu_item_name: str
    units_sold: int
    item_cogs: float
    modifier_cogs: float
    total_cogs: float
    percentage_of_total_cogs: float
    food_cost_percentage: float

class PaginatedCOGSBreakdown(BaseModel):
    items: List[COGSBreakdownItem]
    total: int
    page: int
    size: int
    summary_total_cogs: float

class MarginTrendItem(BaseModel):
    date: str
    gross_revenue: float
    cogs: float
    net_revenue: float
    profit_margin_percent: float

class ATSBucketItem(BaseModel):
    bucket: str
    order_count: int
    percentage: float

class PurchaseOrderResponse(BaseModel):
    id: str
    supplier_id: str
    ingredient_id: str
    supplier_name: Optional[str] = None
    ingredient_name: Optional[str] = None
    unit: Optional[str] = None
    unit_cost: Optional[float] = None
    current_stock: float
    reorder_point: float
    suggested_quantity: float
    date: datetime
    status: POStatusEnum
    notes: Optional[str] = None
    created_by_id: Optional[str] = None
    sent_by_id: Optional[str] = None
    cancelled_reason: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class ReceivePORequest(BaseModel):
    actual_quantity: float = Field(..., gt=0.0)

class CancelPORequest(BaseModel):
    reason: str