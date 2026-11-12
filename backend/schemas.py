from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any, Dict
from datetime import datetime


# Auth
class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Dict[str, Any]

class UserOut(BaseModel):
    id: str
    email: str
    name: str
    role: str
    created_at: datetime
    class Config:
        from_attributes = True


# Wallet
class WalletCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    total_balance: float

class WalletUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    total_balance: Optional[float] = None

class WalletOut(BaseModel):
    id: str
    name: str
    description: str
    total_balance: float
    allocated_balance: float
    available_balance: float
    status: str
    created_at: datetime
    class Config:
        from_attributes = True

class AllocateBudgetRequest(BaseModel):
    agent_id: str
    amount: float


# Agent
class AgentCreate(BaseModel):
    name: str
    role: str
    budget_limit: float = 50000.0
    permissions: List[str] = ["RESEARCH"]
    wallet_id: Optional[str] = None
    description: Optional[str] = ""

class AgentUpdate(BaseModel):
    name: Optional[str] = None
    status: Optional[str] = None
    budget_limit: Optional[float] = None
    permissions: Optional[List[str]] = None
    description: Optional[str] = None

class AgentOut(BaseModel):
    id: str
    name: str
    role: str
    status: str
    budget_limit: float
    spent_amount: float
    available_budget: float
    permissions: List[str]
    wallet_id: Optional[str]
    description: str
    created_at: datetime
    class Config:
        from_attributes = True

class InstructRequest(BaseModel):
    agent_id: str
    instruction: str


# Vendor
class VendorCreate(BaseModel):
    name: str
    category: Optional[str] = "General"
    trust_score: Optional[float] = 80.0
    is_suspicious: Optional[bool] = False
    is_blocked: Optional[bool] = False
    description: Optional[str] = ""

class VendorOut(BaseModel):
    id: str
    name: str
    category: str
    trust_score: float
    is_suspicious: bool
    is_blocked: bool
    avg_price: float
    description: str
    created_at: datetime
    class Config:
        from_attributes = True

class ProductOut(BaseModel):
    id: str
    vendor_id: str
    name: str
    category: str
    price: float
    specs: Dict[str, Any]
    in_stock: bool
    market_price: float
    created_at: datetime
    class Config:
        from_attributes = True


# Purchase Request
class PurchaseRequestCreate(BaseModel):
    agent_id: str
    vendor_id: Optional[str] = None
    product_id: Optional[str] = None
    amount: float
    instruction: Optional[str] = ""
    actor_recommendation: Optional[Dict[str, Any]] = {}

class PurchaseRequestOut(BaseModel):
    id: str
    agent_id: str
    vendor_id: Optional[str]
    product_id: Optional[str]
    amount: float
    instruction: str
    status: str
    actor_recommendation: Dict[str, Any]
    created_at: datetime
    class Config:
        from_attributes = True


# Transaction
class TransactionOut(BaseModel):
    id: str
    purchase_request_id: Optional[str]
    agent_id: str
    vendor_id: Optional[str]
    amount: float
    status: str
    policy_decision: str
    policy_reason: str
    policy_rules_evaluated: List[Any]
    risk_score: float
    risk_category: str
    description: str
    created_at: datetime
    updated_at: datetime
    class Config:
        from_attributes = True


# Policy
class PolicyCreate(BaseModel):
    name: str
    auto_approve_threshold: float = 10000.0
    risk_auto_reject_threshold: float = 80.0
    blocked_vendors: List[str] = []
    require_human_above: float = 50000.0

class PolicyUpdate(BaseModel):
    name: Optional[str] = None
    auto_approve_threshold: Optional[float] = None
    risk_auto_reject_threshold: Optional[float] = None
    blocked_vendors: Optional[List[str]] = None
    require_human_above: Optional[float] = None
    is_active: Optional[bool] = None

class PolicyOut(BaseModel):
    id: str
    name: str
    auto_approve_threshold: float
    risk_auto_reject_threshold: float
    blocked_vendors: List[str]
    require_human_above: float
    is_active: bool
    created_at: datetime
    class Config:
        from_attributes = True


# Approval
class ApprovalOut(BaseModel):
    id: str
    transaction_id: str
    status: str
    requested_at: datetime
    resolved_at: Optional[datetime]
    approved_by: Optional[str]
    notes: str
    class Config:
        from_attributes = True

class ApprovalAction(BaseModel):
    notes: Optional[str] = ""
    approved_by: Optional[str] = "Admin"


# Delegation
class DelegationCreate(BaseModel):
    from_agent_id: str
    to_agent_id: str
    task_type: str = "RESEARCH"
    task_description: str

class DelegationOut(BaseModel):
    id: str
    from_agent_id: str
    to_agent_id: str
    task_type: str
    task_description: str
    status: str
    result: Dict[str, Any]
    created_at: datetime
    completed_at: Optional[datetime]
    class Config:
        from_attributes = True


# Payment
class PaymentProcessRequest(BaseModel):
    transaction_id: str
    payment_method: Optional[str] = "MOCK"

class PaymentRecordOut(BaseModel):
    id: str
    transaction_id: str
    payment_method: str
    reference: str
    status: str
    amount: float
    extra_metadata: Optional[Dict[str, Any]] = {}
    created_at: datetime
    class Config:
        from_attributes = True


# Audit Report
class AuditReportOut(BaseModel):
    id: str
    purchase_request_id: str
    risk_score: float
    recommendation: str
    evidence: List[Any]
    explanation: str
    red_flags: List[Any]
    created_at: datetime
    class Config:
        from_attributes = True


# Risk Assessment
class RiskAssessmentOut(BaseModel):
    id: str
    transaction_id: str
    score: float
    category: str
    indicators: List[Any]
    created_at: datetime
    class Config:
        from_attributes = True


# Audit Ledger
class AuditLedgerEntryOut(BaseModel):
    id: Any
    event_id: str
    timestamp: str
    event_type: str
    description: str
    transaction_ref: Optional[str]
    data_hash: str
    prev_hash: str
    chain_hash: str
    extra_metadata: Optional[Dict[str, Any]] = {}
    class Config:
        from_attributes = True


# Security
class SimulationRequest(BaseModel):
    scenario_id: int  # 1-6

class KillSwitchStatus(BaseModel):
    active: bool
    activated_at: Optional[str]
    reason: Optional[str]


# Dashboard
class DashboardStats(BaseModel):
    total_allocation: float
    available_balance: float
    total_spending: float
    active_agents: int
    pending_approvals: int
    completed_transactions: int
    rejected_transactions: int
    risk_alerts: int
    kill_switch_active: bool

