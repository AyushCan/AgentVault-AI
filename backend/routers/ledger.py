from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import AuditLedgerEntry
from schemas import AuditLedgerEntryOut
from services.ledger_service import verify_ledger, add_ledger_entry

router = APIRouter()


@router.get("/", response_model=List[AuditLedgerEntryOut])
def get_ledger_entries(
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    return (
        db.query(AuditLedgerEntry)
        .order_by(AuditLedgerEntry.id.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )


@router.get("/verify")
def verify_hash_chain(db: Session = Depends(get_db)):
    """Recomputes SHA-256 hash chain and checks for any tampering"""
    return verify_ledger(db)


@router.post("/tamper-test")
def simulate_tampering(entry_id: str, db: Session = Depends(get_db)):
    """Simulate manual unauthorized modification to demonstrate tamper detection"""
    entry = db.query(AuditLedgerEntry).filter_by(event_id=entry_id).first()
    if not entry:
        entry = db.query(AuditLedgerEntry).first()
    if entry:
        entry.description += " [UNAUTHORIZED TAMPERING DETECTED]"
        db.commit()
        return {"status": "tampered", "tampered_entry_id": entry.event_id}
    return {"status": "not_found"}
