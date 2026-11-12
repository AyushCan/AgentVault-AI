from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import RiskAssessment, PurchaseRequest, Transaction
from schemas import RiskAssessmentOut
from services.risk_engine import assess_risk
import uuid

router = APIRouter()


@router.post("/assess")
def assess_purchase_risk(purchase_request_id: str, db: Session = Depends(get_db)):
    pr = db.query(PurchaseRequest).filter_by(id=purchase_request_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase request not found")

    risk_result = assess_risk(db, pr.agent_id, pr.vendor_id, pr.amount, pr.product_id)
    return risk_result


@router.get("/assessments", response_model=List[RiskAssessmentOut])
def list_risk_assessments(db: Session = Depends(get_db)):
    return db.query(RiskAssessment).order_by(RiskAssessment.created_at.desc()).all()


@router.get("/stats")
def risk_stats(db: Session = Depends(get_db)):
    assessments = db.query(RiskAssessment).all()
    categories = {"LOW": 0, "MEDIUM": 0, "HIGH": 0, "CRITICAL": 0}
    for a in assessments:
        categories[a.category] = categories.get(a.category, 0) + 1

    return {
        "total_assessments": len(assessments),
        "distribution": categories
    }

