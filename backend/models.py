from sqlalchemy import Column, String, Float, Boolean, Integer, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from database import Base
import uuid
from datetime import datetime


def gen_id():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=gen_id)
    email = Column(String, unique=True, nullable=False)
    password_hash = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="admin")
    created_at = Column(DateTime, default=datetime.utcnow)


class Wallet(Base):
    __tablename__ = "wallets"
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    description = Column(String, default="")
    total_balance = Column(Float, default=0.0)
    allocated_balance = Column(Float, default=0.0)
    available_balance = Column(Float, default=0.0)
    status = Column(String, default="ACTIVE")  # ACTIVE, FROZEN
    created_at = Column(DateTime, default=datetime.utcnow)
    agents = relationship("Agent", back_populates="wallet")


class Agent(Base):
    __tablename__ = "agents"
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)  # PROCUREMENT, RESEARCH, BUDGET_ANALYST, AUDITOR
    status = Column(String, default="ACTIVE")  # ACTIVE, INACTIVE, FLAGGED
    budget_limit = Column(Float, default=50000.0)
    spent_amount = Column(Float, default=0.0)
    available_budget = Column(Float, default=50000.0)
    permissions = Column(JSON, default=list)  # ["PURCHASE", "RESEARCH", "DELEGATE", "AUDIT"]
    wallet_id = Column(String, ForeignKey("wallets.id"), nullable=True)
    description = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    wallet = relationship("Wallet", back_populates="agents")
    delegations_sent = relationship("Delegation", foreign_keys="Delegation.from_agent_id", back_populates="from_agent")
    delegations_received = relationship("Delegation", foreign_keys="Delegation.to_agent_id", back_populates="to_agent")


class Vendor(Base):
    __tablename__ = "vendors"
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    category = Column(String, default="General")
    trust_score = Column(Float, default=80.0)
    is_suspicious = Column(Boolean, default=False)
    is_blocked = Column(Boolean, default=False)
    avg_price = Column(Float, default=0.0)
    description = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    products = relationship("Product", back_populates="vendor")


class Product(Base):
    __tablename__ = "products"
    id = Column(String, primary_key=True, default=gen_id)
    vendor_id = Column(String, ForeignKey("vendors.id"))
    name = Column(String, nullable=False)
    category = Column(String, default="Electronics")
    price = Column(Float, nullable=False)
    specs = Column(JSON, default=dict)
    in_stock = Column(Boolean, default=True)
    market_price = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    vendor = relationship("Vendor", back_populates="products")


class PurchaseRequest(Base):
    __tablename__ = "purchase_requests"
    id = Column(String, primary_key=True, default=gen_id)
    agent_id = Column(String, ForeignKey("agents.id"))
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=True)
    product_id = Column(String, ForeignKey("products.id"), nullable=True)
    amount = Column(Float, nullable=False)
    instruction = Column(Text, default="")
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED, PROCESSING, COMPLETED
    actor_recommendation = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    agent = relationship("Agent")
    vendor = relationship("Vendor")
    product = relationship("Product")
    transactions = relationship("Transaction", back_populates="purchase_request")
    audit_reports = relationship("AuditReport", back_populates="purchase_request")


class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(String, primary_key=True, default=gen_id)
    purchase_request_id = Column(String, ForeignKey("purchase_requests.id"), nullable=True)
    agent_id = Column(String, ForeignKey("agents.id"))
    vendor_id = Column(String, ForeignKey("vendors.id"), nullable=True)
    amount = Column(Float, nullable=False)
    status = Column(String, default="PENDING")  # PENDING, COMPLETED, REJECTED, BLOCKED
    policy_decision = Column(String, default="PENDING")
    policy_reason = Column(String, default="")
    policy_rules_evaluated = Column(JSON, default=list)
    risk_score = Column(Float, default=0.0)
    risk_category = Column(String, default="LOW")
    description = Column(String, default="")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    purchase_request = relationship("PurchaseRequest", back_populates="transactions")
    agent = relationship("Agent")
    vendor = relationship("Vendor")
    approval = relationship("Approval", back_populates="transaction", uselist=False)
    payment_records = relationship("PaymentRecord", back_populates="transaction")
    risk_assessments = relationship("RiskAssessment", back_populates="transaction")


class AuditReport(Base):
    __tablename__ = "audit_reports"
    id = Column(String, primary_key=True, default=gen_id)
    purchase_request_id = Column(String, ForeignKey("purchase_requests.id"))
    risk_score = Column(Float, default=0.0)
    recommendation = Column(String, default="REQUIRE_HUMAN_REVIEW")
    evidence = Column(JSON, default=list)
    explanation = Column(Text, default="")
    red_flags = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    purchase_request = relationship("PurchaseRequest", back_populates="audit_reports")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    id = Column(String, primary_key=True, default=gen_id)
    transaction_id = Column(String, ForeignKey("transactions.id"))
    score = Column(Float, default=0.0)
    category = Column(String, default="LOW")
    indicators = Column(JSON, default=list)
    created_at = Column(DateTime, default=datetime.utcnow)
    transaction = relationship("Transaction", back_populates="risk_assessments")


class Policy(Base):
    __tablename__ = "policies"
    id = Column(String, primary_key=True, default=gen_id)
    name = Column(String, nullable=False)
    auto_approve_threshold = Column(Float, default=10000.0)
    risk_auto_reject_threshold = Column(Float, default=80.0)
    blocked_vendors = Column(JSON, default=list)
    require_human_above = Column(Float, default=50000.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Approval(Base):
    __tablename__ = "approvals"
    id = Column(String, primary_key=True, default=gen_id)
    transaction_id = Column(String, ForeignKey("transactions.id"))
    status = Column(String, default="PENDING")  # PENDING, APPROVED, REJECTED
    requested_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    approved_by = Column(String, nullable=True)
    notes = Column(Text, default="")
    transaction = relationship("Transaction", back_populates="approval")


class Delegation(Base):
    __tablename__ = "delegations"
    id = Column(String, primary_key=True, default=gen_id)
    from_agent_id = Column(String, ForeignKey("agents.id"))
    to_agent_id = Column(String, ForeignKey("agents.id"))
    task_type = Column(String, default="RESEARCH")
    task_description = Column(Text, default="")
    status = Column(String, default="PENDING")  # PENDING, COMPLETED, FAILED
    result = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    from_agent = relationship("Agent", foreign_keys=[from_agent_id], back_populates="delegations_sent")
    to_agent = relationship("Agent", foreign_keys=[to_agent_id], back_populates="delegations_received")


class PaymentRecord(Base):
    __tablename__ = "payment_records"
    id = Column(String, primary_key=True, default=gen_id)
    transaction_id = Column(String, ForeignKey("transactions.id"))
    payment_method = Column(String, default="MOCK")  # MOCK, PAYPAL_SANDBOX
    reference = Column(String, default="")
    status = Column(String, default="PENDING")  # SUCCESS, FAILED, PENDING
    amount = Column(Float, nullable=False)
    extra_metadata = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    transaction = relationship("Transaction", back_populates="payment_records")


class AuditLedgerEntry(Base):
    __tablename__ = "audit_ledger_entries"
    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(String, unique=True, nullable=False)
    timestamp = Column(String, nullable=False)
    event_type = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    transaction_ref = Column(String, nullable=True)
    data_hash = Column(String, nullable=False)
    prev_hash = Column(String, nullable=False)
    chain_hash = Column(String, nullable=False)
    extra_metadata = Column(JSON, default=dict)


class SecurityEvent(Base):
    __tablename__ = "security_events"
    id = Column(String, primary_key=True, default=gen_id)
    event_type = Column(String, nullable=False)
    description = Column(Text, default="")
    severity = Column(String, default="LOW")
    created_at = Column(DateTime, default=datetime.utcnow)
    extra_metadata = Column(JSON, default=dict)


class SystemSetting(Base):
    __tablename__ = "system_settings"
    id = Column(String, primary_key=True, default=gen_id)
    key = Column(String, unique=True, nullable=False)
    value = Column(String, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

