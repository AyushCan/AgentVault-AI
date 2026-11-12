from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import PurchaseRequest, Transaction, Agent, Approval
from schemas import PurchaseRequestCreate, PurchaseRequestOut
from services.policy_engine import evaluate_policy
from services.risk_engine import assess_risk
import uuid
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[PurchaseRequestOut])
def list_purchases(db: Session = Depends(get_db)):
    return db.query(PurchaseRequest).order_by(PurchaseRequest.created_at.desc()).all()


@router.post("/")
def create_purchase(data: PurchaseRequestCreate, db: Session = Depends(get_db)):
    """Create purchase request, run risk engine, run policy engine"""
    agent = db.query(Agent).filter_by(id=data.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    # Create purchase request
    pr = PurchaseRequest(
        id=str(uuid.uuid4()),
        agent_id=data.agent_id,
        vendor_id=data.vendor_id,
        product_id=data.product_id,
        amount=data.amount,
        instruction=data.instruction or "",
        status="PENDING",
        actor_recommendation=data.actor_recommendation or {}
    )
    db.add(pr)
    db.commit()

    # Run risk engine
    risk_result = assess_risk(db, data.agent_id, data.vendor_id, data.amount, data.product_id)

    # Run policy engine
    policy_result = evaluate_policy(
        db, data.agent_id, agent.wallet_id, data.amount,
        data.vendor_id, risk_result["score"]
    )

    # Create transaction
    tx = Transaction(
        id=str(uuid.uuid4()),
        purchase_request_id=pr.id,
        agent_id=data.agent_id,
        vendor_id=data.vendor_id,
        amount=data.amount,
        status="PENDING",
        policy_decision=policy_result["decision"],
        policy_reason=policy_result["final_reason"],
        policy_rules_evaluated=policy_result["rules_evaluated"],
        risk_score=risk_result["score"],
        risk_category=risk_result["category"],
        description=data.instruction[:100] if data.instruction else "Purchase request"
    )
    db.add(tx)
    db.commit()

    # Store risk assessment
    from models import RiskAssessment
    ra = RiskAssessment(
        id=str(uuid.uuid4()),
        transaction_id=tx.id,
        score=risk_result["score"],
        category=risk_result["category"],
        indicators=risk_result["indicators"]
    )
    db.add(ra)
    db.commit()

    # Handle decision outcomes
    if policy_result["decision"] == "APPROVED":
        tx.status = "PENDING"  # ready for payment
        pr.status = "APPROVED"
        # Deduct from agent budget
        agent.spent_amount += data.amount
        agent.available_budget = max(0, agent.available_budget - data.amount)
        db.commit()

    elif policy_result["decision"] == "REQUIRES_HUMAN_APPROVAL":
        tx.status = "PENDING"
        pr.status = "PENDING"
        approval = Approval(
            id=str(uuid.uuid4()),
            transaction_id=tx.id,
            status="PENDING",
            requested_at=datetime.utcnow()
        )
        db.add(approval)
        db.commit()

    elif policy_result["decision"] in ("REJECTED", "BLOCKED_BY_KILL_SWITCH"):
        tx.status = "REJECTED" if policy_result["decision"] == "REJECTED" else "BLOCKED"
        pr.status = "REJECTED"
        db.commit()

    db.refresh(tx)
    db.refresh(pr)

    # Ledger
    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "PURCHASE_REQUESTED",
                     f"Purchase request ₹{data.amount:,.2f} — Policy: {policy_result['decision']}",
                     transaction_ref=tx.id,
                     metadata={"agent": agent.name, "amount": data.amount, "decision": policy_result["decision"]})

    return {
        "purchase_request": {
            "id": pr.id, "status": pr.status, "amount": pr.amount,
            "agent_id": pr.agent_id, "vendor_id": pr.vendor_id
        },
        "transaction": {
            "id": tx.id, "status": tx.status,
            "policy_decision": tx.policy_decision,
            "policy_reason": tx.policy_reason,
            "policy_rules_evaluated": tx.policy_rules_evaluated
        },
        "risk_assessment": risk_result,
        "policy_result": policy_result
    }


@router.get("/{pr_id}")
def get_purchase(pr_id: str, db: Session = Depends(get_db)):
    pr = db.query(PurchaseRequest).filter_by(id=pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase request not found")

    from models import AuditReport
    audit_reports = db.query(AuditReport).filter_by(purchase_request_id=pr_id).all()
    transactions = pr.transactions

    return {
        "id": pr.id, "agent_id": pr.agent_id, "vendor_id": pr.vendor_id,
        "product_id": pr.product_id, "amount": pr.amount, "instruction": pr.instruction,
        "status": pr.status, "actor_recommendation": pr.actor_recommendation,
        "created_at": pr.created_at.isoformat(),
        "transactions": [{"id": t.id, "status": t.status, "policy_decision": t.policy_decision,
                          "risk_score": t.risk_score, "risk_category": t.risk_category} for t in transactions],
        "audit_reports": [{"id": r.id, "risk_score": r.risk_score, "recommendation": r.recommendation,
                           "red_flags": r.red_flags} for r in audit_reports]
    }

