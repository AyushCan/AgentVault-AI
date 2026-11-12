from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import AuditReport, PurchaseRequest
from services.auditor_agent import run_auditor_agent
import uuid

router = APIRouter()


@router.post("/analyze/{pr_id}")
def analyze_purchase(pr_id: str, db: Session = Depends(get_db)):
    pr = db.query(PurchaseRequest).filter_by(id=pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Purchase request not found")

    result = run_auditor_agent(db, pr_id)

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    report = AuditReport(
        id=str(uuid.uuid4()),
        purchase_request_id=pr_id,
        risk_score=result.get("risk_score", 0),
        recommendation=result.get("recommendation", "REQUIRE_HUMAN_REVIEW"),
        evidence=result.get("evidence", []),
        explanation=result.get("explanation", ""),
        red_flags=result.get("red_flags", [])
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "AUDIT_COMPLETED",
                     f"Auditor analyzed PR {pr_id[:8]}... — Recommendation: {report.recommendation}",
                     transaction_ref=pr_id,
                     metadata={"risk_score": report.risk_score, "recommendation": report.recommendation,
                               "mode": result.get("_mode", "UNKNOWN")})

    return {
        "report_id": report.id,
        "purchase_request_id": pr_id,
        "risk_score": report.risk_score,
        "recommendation": report.recommendation,
        "evidence": report.evidence,
        "explanation": report.explanation,
        "red_flags": report.red_flags,
        "mode": result.get("_mode", "UNKNOWN")
    }


@router.get("/reports")
def list_reports(db: Session = Depends(get_db)):
    reports = db.query(AuditReport).order_by(AuditReport.created_at.desc()).all()
    return [{"id": r.id, "purchase_request_id": r.purchase_request_id,
             "risk_score": r.risk_score, "recommendation": r.recommendation,
             "red_flags": r.red_flags, "created_at": r.created_at.isoformat()} for r in reports]


@router.get("/reports/{report_id}")
def get_report(report_id: str, db: Session = Depends(get_db)):
    r = db.query(AuditReport).filter_by(id=report_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Report not found")
    return {"id": r.id, "purchase_request_id": r.purchase_request_id,
            "risk_score": r.risk_score, "recommendation": r.recommendation,
            "evidence": r.evidence, "explanation": r.explanation,
            "red_flags": r.red_flags, "created_at": r.created_at.isoformat()}

