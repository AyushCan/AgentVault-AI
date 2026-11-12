import hashlib
import json
import uuid
from datetime import datetime
from sqlalchemy.orm import Session


def add_ledger_entry(db: Session, event_type: str, description: str,
                     transaction_ref: str = None, metadata: dict = None) -> object:
    from models import AuditLedgerEntry

    if metadata is None:
        metadata = {}

    last = db.query(AuditLedgerEntry).order_by(AuditLedgerEntry.id.desc()).first()
    prev_hash = last.chain_hash if last else "0" * 64

    event_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().isoformat()

    data = json.dumps({
        "event_type": event_type,
        "description": description,
        "transaction_ref": transaction_ref,
        "metadata": metadata
    }, sort_keys=True)

    data_hash = hashlib.sha256(data.encode()).hexdigest()
    chain_hash = hashlib.sha256((prev_hash + data_hash + timestamp).encode()).hexdigest()

    entry = AuditLedgerEntry(
        event_id=event_id,
        timestamp=timestamp,
        event_type=event_type,
        description=description,
        transaction_ref=transaction_ref,
        data_hash=data_hash,
        prev_hash=prev_hash,
        chain_hash=chain_hash,
        extra_metadata=metadata
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def verify_ledger(db: Session) -> dict:
    from models import AuditLedgerEntry

    entries = db.query(AuditLedgerEntry).order_by(AuditLedgerEntry.id.asc()).all()
    results = []
    prev_hash = "0" * 64
    all_valid = True

    for entry in entries:
        data = json.dumps({
            "event_type": entry.event_type,
            "description": entry.description,
            "transaction_ref": entry.transaction_ref,
            "metadata": entry.extra_metadata or {}
        }, sort_keys=True)

        data_hash = hashlib.sha256(data.encode()).hexdigest()
        expected_chain = hashlib.sha256(
            (prev_hash + data_hash + entry.timestamp).encode()
        ).hexdigest()

        valid = (expected_chain == entry.chain_hash) and (entry.prev_hash == prev_hash)
        if not valid:
            all_valid = False

        results.append({
            "event_id": entry.event_id,
            "timestamp": entry.timestamp,
            "event_type": entry.event_type,
            "valid": valid,
            "computed_hash": expected_chain,
            "stored_hash": entry.chain_hash
        })
        prev_hash = entry.chain_hash

    return {
        "all_valid": all_valid,
        "total_entries": len(entries),
        "valid_entries": sum(1 for r in results if r["valid"]),
        "tampered_entries": sum(1 for r in results if not r["valid"]),
        "entries": results
    }

