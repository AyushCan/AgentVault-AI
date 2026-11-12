from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Delegation, Agent
from schemas import DelegationCreate, DelegationOut
import uuid
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[DelegationOut])
def list_delegations(db: Session = Depends(get_db)):
    return db.query(Delegation).order_by(Delegation.created_at.desc()).all()


@router.post("/")
def create_delegation(data: DelegationCreate, db: Session = Depends(get_db)):
    from_agent = db.query(Agent).filter_by(id=data.from_agent_id).first()
    to_agent = db.query(Agent).filter_by(id=data.to_agent_id).first()

    if not from_agent or not to_agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if from_agent.id == to_agent.id:
        raise HTTPException(status_code=400, detail="Agent cannot delegate to itself")
    if "DELEGATE" not in (from_agent.permissions or []):
        raise HTTPException(status_code=403, detail=f"Agent '{from_agent.name}' lacks DELEGATE permission")

    delegation = Delegation(
        id=str(uuid.uuid4()),
        from_agent_id=data.from_agent_id,
        to_agent_id=data.to_agent_id,
        task_type=data.task_type,
        task_description=data.task_description,
        status="PENDING"
    )
    db.add(delegation)
    db.commit()
    db.refresh(delegation)

    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "DELEGATION_CREATED",
                     f"'{from_agent.name}' delegated {data.task_type} task to '{to_agent.name}'",
                     metadata={"from_agent": from_agent.name, "to_agent": to_agent.name,
                               "task_type": data.task_type})

    return {"id": delegation.id, "from_agent": from_agent.name, "to_agent": to_agent.name,
            "task_type": delegation.task_type, "task_description": delegation.task_description,
            "status": delegation.status, "created_at": delegation.created_at.isoformat()}


@router.put("/{delegation_id}")
def update_delegation(delegation_id: str, status: str, result: dict = None,
                      db: Session = Depends(get_db)):
    delegation = db.query(Delegation).filter_by(id=delegation_id).first()
    if not delegation:
        raise HTTPException(status_code=404, detail="Delegation not found")

    valid_statuses = ["PENDING", "COMPLETED", "FAILED"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    delegation.status = status
    if result:
        delegation.result = result
    if status in ("COMPLETED", "FAILED"):
        delegation.completed_at = datetime.utcnow()
    db.commit()

    return {"id": delegation_id, "status": status}

