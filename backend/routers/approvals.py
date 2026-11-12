from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Approval, Transaction, Agent, Vendor
from schemas import ApprovalAction
from datetime import datetime

router = APIRouter()


@router.get("/")
def list_approvals(status: str = None, db: Session = Depends(get_db)):
    q = db.query(Approval)
    if status:
        q = q.filter_by(status=status)
    approvals = q.order_by(Approval.requested_at.desc()).all()

    result = []
    for a in approvals:
        tx = a.transaction
        agent = db.query(Agent).filter_by(id=tx.agent_id).first() if tx else None
        vendor = db.query(Vendor).filter_by(id=tx.vendor_id).first() if tx and tx.vendor_id else None
        from models import AuditReport, PurchaseRequest
        audit = None
        if tx and tx.purchase_request_id:
            audit = db.query(AuditReport).filter_by(purchase_request_id=tx.purchase_request_id).order_by(AuditReport.created_at.desc()).first()

        result.append({
            "id": a.id,
            "transaction_id": a.transaction_id,
            "status": a.status,
            "requested_at": a.requested_at.isoformat(),
            "resolved_at": a.resolved_at.isoformat() if a.resolved_at else None,
            "approved_by": a.approved_by,
            "notes": a.notes,
            "transaction": {
                "id": tx.id if tx else None,
                "amount": tx.amount if tx else 0,
                "policy_decision": tx.policy_decision if tx else "",
                "policy_reason": tx.policy_reason if tx else "",
                "risk_score": tx.risk_score if tx else 0,
                "risk_category": tx.risk_category if tx else "LOW",
                "description": tx.description if tx else "",
                "status": tx.status if tx else "",
            } if tx else None,
            "agent": {"id": agent.id, "name": agent.name, "role": agent.role} if agent else None,
            "vendor": {"id": vendor.id, "name": vendor.name, "trust_score": vendor.trust_score} if vendor else None,
            "audit_report": {
                "risk_score": audit.risk_score,
                "recommendation": audit.recommendation,
                "red_flags": audit.red_flags,
                "explanation": audit.explanation
            } if audit else None,
        })
    return result


@router.get("/pending")
def pending_approvals(db: Session = Depends(get_db)):
    return list_approvals(status="PENDING", db=db)


@router.post("/{approval_id}/approve")
def approve_transaction(approval_id: str, data: ApprovalAction, db: Session = Depends(get_db)):
    approval = db.query(Approval).filter_by(id=approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if approval.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Approval is already {approval.status}")

    approval.status = "APPROVED"
    approval.resolved_at = datetime.utcnow()
    approval.approved_by = data.approved_by or "Admin"
    approval.notes = data.notes or ""

    tx = approval.transaction
    if tx:
        tx.status = "PENDING"  # ready for payment
        # Deduct from agent budget
        from models import Agent
        agent = db.query(Agent).filter_by(id=tx.agent_id).first()
        if agent:
            agent.spent_amount += tx.amount
            agent.available_budget = max(0, agent.available_budget - tx.amount)

        from models import PurchaseRequest
        if tx.purchase_request_id:
            pr = db.query(PurchaseRequest).filter_by(id=tx.purchase_request_id).first()
            if pr:
                pr.status = "APPROVED"

    db.commit()

    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "APPROVAL_GRANTED",
                     f"Transaction ₹{tx.amount:,.2f} approved by {approval.approved_by}",
                     transaction_ref=tx.id if tx else None,
                     metadata={"approval_id": approval_id, "approved_by": approval.approved_by})

    return {"status": "approved", "approval_id": approval_id, "transaction_id": approval.transaction_id}


@router.post("/{approval_id}/reject")
def reject_transaction(approval_id: str, data: ApprovalAction, db: Session = Depends(get_db)):
    approval = db.query(Approval).filter_by(id=approval_id).first()
    if not approval:
        raise HTTPException(status_code=404, detail="Approval not found")
    if approval.status != "PENDING":
        raise HTTPException(status_code=400, detail=f"Approval is already {approval.status}")

    approval.status = "REJECTED"
    approval.resolved_at = datetime.utcnow()
    approval.approved_by = data.approved_by or "Admin"
    approval.notes = data.notes or "Rejected by administrator"

    tx = approval.transaction
    if tx:
        tx.status = "REJECTED"
        from models import PurchaseRequest
        if tx.purchase_request_id:
            pr = db.query(PurchaseRequest).filter_by(id=tx.purchase_request_id).first()
            if pr:
                pr.status = "REJECTED"

    db.commit()

    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "APPROVAL_REJECTED",
                     f"Transaction ₹{tx.amount:,.2f} rejected — {data.notes or 'No reason given'}",
                     transaction_ref=tx.id if tx else None,
                     metadata={"approval_id": approval_id, "reason": data.notes})

    return {"status": "rejected", "approval_id": approval_id, "transaction_id": approval.transaction_id}

