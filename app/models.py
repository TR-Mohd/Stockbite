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

class POStatusEnum(str, enum.Enum):
    Draft = "Draft"
    Sent = "Sent"
    Received = "Received"

class PaymentMethodEnum(str, enum.Enum):
    Cash = "Cash"
    QRIS = "QRIS"

class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), nullable=False)
    hashed_password = Column(String, nullable=False)
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

class Ingredient(Base):
    __tablename__ = "ingredients"
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    stock_level = Column(Float, default=0.0)
    unit = Column(String, nullable=False)
    reorder_point = Column(Float, default=0.0)
    category = Column(String, default="Uncategorized")
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
    total_amount = Column(Float, nullable=False)
    payment_method = Column(Enum(PaymentMethodEnum), nullable=False)
    amount_tendered = Column(Float, nullable=True)
    change = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    customer_contact = Column(String, nullable=True)
    cashier_id = Column(String, ForeignKey("users.id"))
    status = Column(Enum(StatusEnum), default=StatusEnum.Completed)

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

    transaction = relationship("Transaction", back_populates="items")
    menu_item = relationship("MenuItem")

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"
    id = Column(String, primary_key=True, default=generate_uuid)
    supplier_id = Column(String, ForeignKey("suppliers.id"))
    ingredient_id = Column(String, ForeignKey("ingredients.id"))
    current_stock = Column(Float, nullable=False)
    reorder_point = Column(Float, nullable=False)
    suggested_quantity = Column(Float, nullable=False)
    date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum(POStatusEnum), default=POStatusEnum.Draft)
    notes = Column(String, nullable=True)

    supplier = relationship("Supplier")
    ingredient = relationship("Ingredient")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(String, primary_key=True, default=generate_uuid)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_id = Column(String, nullable=True) # Can be 'system'
    action = Column(String, nullable=False)
    resource = Column(String, nullable=False)
    outcome = Column(String, nullable=False)
