from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Policy, Transaction
from schemas import PolicyCreate, PolicyUpdate, PolicyOut
from services.policy_engine import evaluate_policy
import uuid

router = APIRouter()


@router.get("/", response_model=List[PolicyOut])
def list_policies(db: Session = Depends(get_db)):
    return db.query(Policy).all()


@router.post("/", response_model=PolicyOut)
def create_policy(data: PolicyCreate, db: Session = Depends(get_db)):
    # Deactivate existing active policies
    db.query(Policy).filter_by(is_active=True).update({"is_active": False})
    policy = Policy(
        id=str(uuid.uuid4()),
        name=data.name,
        auto_approve_threshold=data.auto_approve_threshold,
        risk_auto_reject_threshold=data.risk_auto_reject_threshold,
        blocked_vendors=data.blocked_vendors,
        require_human_above=data.require_human_above,
        is_active=True
    )
    db.add(policy)
    db.commit()
    db.refresh(policy)
    return policy


@router.put("/{policy_id}", response_model=PolicyOut)
def update_policy(policy_id: str, data: PolicyUpdate, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter_by(id=policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    if data.name is not None:
        policy.name = data.name
    if data.auto_approve_threshold is not None:
        policy.auto_approve_threshold = data.auto_approve_threshold
    if data.risk_auto_reject_threshold is not None:
        policy.risk_auto_reject_threshold = data.risk_auto_reject_threshold
    if data.blocked_vendors is not None:
        policy.blocked_vendors = data.blocked_vendors
    if data.require_human_above is not None:
        policy.require_human_above = data.require_human_above
    if data.is_active is not None:
        policy.is_active = data.is_active
    db.commit()
    db.refresh(policy)

    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "POLICY_UPDATED",
                     f"Policy '{policy.name}' updated",
                     metadata={"policy_id": policy_id, "auto_approve_threshold": policy.auto_approve_threshold})
    return policy


@router.get("/evaluate")
def test_policy(agent_id: str, wallet_id: str = None, amount: float = 10000,
                vendor_id: str = None, risk_score: float = 0,
                db: Session = Depends(get_db)):
    result = evaluate_policy(db, agent_id, wallet_id, amount, vendor_id, risk_score)
    return result


@router.get("/decisions")
def recent_decisions(db: Session = Depends(get_db)):
    txns = db.query(Transaction).order_by(Transaction.created_at.desc()).limit(10).all()
    return [{"transaction_id": t.id, "amount": t.amount, "decision": t.policy_decision,
             "reason": t.policy_reason, "rules_evaluated": t.policy_rules_evaluated,
             "created_at": t.created_at.isoformat()} for t in txns]

