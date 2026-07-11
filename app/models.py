from sqlalchemy import Column, String, Float, Integer, Boolean, ForeignKey, DateTime, Enum, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
import uuid

from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class RoleEnum(str, enum.Enum):
    Manager = "Manager"
    Cashier = "Cashier"
    Warehouse = "Warehouse"

class StatusEnum(str, enum.Enum):
    Completed = "Completed"
    Voided = "Voided"

class OrderTypeEnum(str, enum.Enum):
    DineIn = "Dine-In"
    Takeaway = "Takeaway"

class POStatusEnum(str, enum.Enum):
    Draft = "Draft"
    Sent = "Sent"
    Partially_Received = "Partially Received"
    Received = "Received"
    Over_Received = "Over-Received"
    Cancelled = "Cancelled"

class PaymentMethodEnum(str, enum.Enum):
    Cash = "Cash"
    QRIS = "QRIS"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    username = Column(String, nullable=True)
    role = Column(Enum(RoleEnum), nullable=False)
    hashed_password = Column(String, nullable=False)
    hashed_pin = Column(String, nullable=True)
    phone_number = Column(String, nullable=True)
    email = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

class Shift(Base):
    __tablename__ = "shifts"
    id = Column(String, primary_key=True, default=generate_uuid)
    cashier_id = Column(String, ForeignKey("users.id"))
    start_time = Column(DateTime, default=datetime.utcnow)
    end_time = Column(DateTime, nullable=True)
    total_transactions = Column(Integer, default=0)
    total_revenue = Column(Float, default=0.0)

    cashier = relationship("User")

class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    specialization = Column(String)
    phone = Column(String)
    email = Column(String)
    address = Column(String)
    contact_person = Column(String)
    is_active = Column(Boolean, default=True)
    region = Column(String, nullable=True)

class Ingredient(Base):
    __tablename__ = "ingredients"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    stock_level = Column(Float, default=0.0)
    unit = Column(String, nullable=False)
    reorder_point = Column(Float, default=0.0)
    category = Column(String, default="Uncategorized")
    unit_cost = Column(Float, default=0.0)
    last_updated = Column(DateTime, default=datetime.utcnow)
    preferred_supplier_id = Column(String, ForeignKey("suppliers.id"), nullable=True)
    version_id = Column(Integer, nullable=False, default=1)

    supplier = relationship("Supplier")

    __mapper_args__ = {
        "version_id_col": version_id
    }

class MenuItem(Base):
    __tablename__ = "menu_items"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    image = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)

    recipes = relationship("Recipe", back_populates="menu_item")
    modifier_groups = relationship("ItemModifierGroup", back_populates="menu_item")

class ItemModifierGroup(Base):
    __tablename__ = "item_modifier_groups"
    id = Column(String, primary_key=True, default=generate_uuid)
    menu_item_id = Column(String, ForeignKey("menu_items.id"), nullable=False)
    name = Column(String, nullable=False)
    is_required = Column(Boolean, default=False)
    min_selections = Column(Integer, default=0)
    max_selections = Column(Integer, nullable=True)

    menu_item = relationship("MenuItem", back_populates="modifier_groups")
    modifiers = relationship("ItemModifier", back_populates="group", cascade="all, delete-orphan")

class ItemModifier(Base):
    __tablename__ = "item_modifiers"
    id = Column(String, primary_key=True, default=generate_uuid)
    group_id = Column(String, ForeignKey("item_modifier_groups.id"), nullable=False)
    name = Column(String, nullable=False)
    price_adjustment = Column(Float, default=0.0)
    
    group = relationship("ItemModifierGroup", back_populates="modifiers")
    modifier_recipes = relationship("ModifierRecipe", back_populates="modifier")

class ModifierRecipe(Base):
    __tablename__ = "modifier_recipes"
    id = Column(String, primary_key=True, default=generate_uuid)
    modifier_id = Column(String, ForeignKey("item_modifiers.id"))
    ingredient_id = Column(String, ForeignKey("ingredients.id"))
    quantity = Column(Float, nullable=False)

    modifier = relationship("ItemModifier", back_populates="modifier_recipes")
    ingredient = relationship("Ingredient")

class Recipe(Base):
    __tablename__ = "recipes"
    id = Column(String, primary_key=True, default=generate_uuid)
    menu_item_id = Column(String, ForeignKey("menu_items.id"))
    ingredient_id = Column(String, ForeignKey("ingredients.id"))
    quantity = Column(Float, nullable=False)

    menu_item = relationship("MenuItem", back_populates="recipes")
    ingredient = relationship("Ingredient")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True, default=generate_uuid)
    subtotal = Column(Float, nullable=False, server_default="0.0")
    tax = Column(Float, nullable=False, server_default="0.0")
    total_amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethodEnum), nullable=False)
    amount_tendered = Column(Float, nullable=True)
    change = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    whatsapp = Column(String, nullable=True)
    email = Column(String, nullable=True)
    cashier_id = Column(String, ForeignKey("users.id"))
    status = Column(Enum(StatusEnum), default=StatusEnum.Completed)
    order_type = Column(Enum(OrderTypeEnum, values_callable=lambda obj: [e.value for e in obj]), nullable=False, default=OrderTypeEnum.Takeaway)
    routing_number = Column(String, nullable=True)

    items = relationship("TransactionItem", back_populates="transaction")
    cashier = relationship("User")

class TransactionItem(Base):
    __tablename__ = "transaction_items"
    id = Column(String, primary_key=True, default=generate_uuid)
    transaction_id = Column(String, ForeignKey("transactions.id"))
    menu_item_id = Column(String, ForeignKey("menu_items.id"))
    quantity = Column(Integer, nullable=False)
    notes = Column(String, nullable=True)
    price_at_time = Column(Float, nullable=False)
    cogs_per_unit = Column(Float, nullable=False, server_default="0.0")

    transaction = relationship("Transaction", back_populates="items")
    menu_item = relationship("MenuItem")
    selected_modifiers = relationship("TransactionItemModifier", back_populates="transaction_item")

class TransactionItemModifier(Base):
    __tablename__ = "transaction_item_modifiers"
    id = Column(String, primary_key=True, default=generate_uuid)
    transaction_item_id = Column(String, ForeignKey("transaction_items.id"), nullable=False)
    modifier_id = Column(String, ForeignKey("item_modifiers.id"), nullable=False)
    price_at_time = Column(Float, nullable=False)
    cogs_per_unit = Column(Float, nullable=False, server_default="0.0")

    transaction_item = relationship("TransactionItem", back_populates="selected_modifiers")
    modifier = relationship("ItemModifier")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(String, primary_key=True, default=generate_uuid)
    supplier_id = Column(String, ForeignKey("suppliers.id"))
    ingredient_id = Column(String, ForeignKey("ingredients.id"))
    current_stock = Column(Float, nullable=False)
    reorder_point = Column(Float, nullable=False)
    suggested_quantity = Column(Float, nullable=False)
    actual_received_quantity = Column(Float, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(POStatusEnum), default=POStatusEnum.Draft)
    notes = Column(String, nullable=True)
    created_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    sent_by_id = Column(String, ForeignKey("users.id"), nullable=True)
    cancelled_reason = Column(String, nullable=True)

    supplier = relationship("Supplier")
    ingredient = relationship("Ingredient")
    created_by = relationship("User", foreign_keys=[created_by_id])
    sent_by = relationship("User", foreign_keys=[sent_by_id])

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, nullable=True) # Can be 'system'
    action = Column(String, nullable=False)
    resource = Column(String, nullable=False)
    outcome = Column(String, nullable=False)
    details = Column(JSON, nullable=True)
