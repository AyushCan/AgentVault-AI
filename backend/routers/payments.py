from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import PaymentRecord, Transaction, PurchaseRequest
from schemas import PaymentProcessRequest, PaymentRecordOut
from services.payment_service import process_mock_payment, process_paypal_payment
from services.ledger_service import add_ledger_entry
import uuid

router = APIRouter()


@router.post("/process")
def process_payment(data: PaymentProcessRequest, db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter_by(id=data.transaction_id).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if tx.status == "COMPLETED":
        raise HTTPException(status_code=400, detail="Transaction has already been paid")

    if tx.policy_decision not in ("APPROVED", "REQUIRES_HUMAN_APPROVAL"):
        raise HTTPException(
            status_code=400, 
            detail=f"Cannot process payment: policy decision was '{tx.policy_decision}'"
        )

    if tx.policy_decision == "REQUIRES_HUMAN_APPROVAL":
        if not tx.approval or tx.approval.status != "APPROVED":
            raise HTTPException(
                status_code=400, 
                detail="Transaction requires human approval before payment can be processed"
            )

    method = data.payment_method.upper() if data.payment_method else "MOCK"

    if method == "PAYPAL_SANDBOX":
        pay_res = process_paypal_payment(db, tx.id, tx.amount)
        if "error" in pay_res and pay_res.get("status") != "PENDING":
            # fallback or return error
            return pay_res
    else:
        pay_res = process_mock_payment(db, tx.id, tx.amount)

    payment_record = PaymentRecord(
        id=str(uuid.uuid4()),
        transaction_id=tx.id,
        payment_method=pay_res.get("payment_method", "MOCK"),
        reference=pay_res.get("reference", ""),
        status=pay_res.get("status", "SUCCESS"),
        amount=tx.amount,
        extra_metadata=pay_res.get("metadata", {})
    )
    db.add(payment_record)

    if pay_res.get("status") == "SUCCESS":
        tx.status = "COMPLETED"
        if tx.purchase_request_id:
            pr = db.query(PurchaseRequest).filter_by(id=tx.purchase_request_id).first()
            if pr:
                pr.status = "COMPLETED"

    db.commit()
    db.refresh(payment_record)

    add_ledger_entry(
        db,
        "PAYMENT_EXECUTED",
        f"Payment of ₹{tx.amount:,.2f} executed via {method} (Ref: {payment_record.reference})",
        transaction_ref=tx.id,
        metadata={
            "payment_id": payment_record.id,
            "method": method,
            "reference": payment_record.reference,
            "status": payment_record.status
        }
    )

    return {
        "status": payment_record.status,
        "payment_record_id": payment_record.id,
        "reference": payment_record.reference,
        "method": payment_record.payment_method,
        "amount": payment_record.amount,
        "details": pay_res
    }


@router.get("/", response_model=List[PaymentRecordOut])
def list_payments(db: Session = Depends(get_db)):
    return db.query(PaymentRecord).order_by(PaymentRecord.created_at.desc()).all()


@router.get("/{payment_id}", response_model=PaymentRecordOut)
def get_payment(payment_id: str, db: Session = Depends(get_db)):
    rec = db.query(PaymentRecord).filter_by(id=payment_id).first()
    if not rec:
        raise HTTPException(status_code=404, detail="Payment record not found")
    return rec
