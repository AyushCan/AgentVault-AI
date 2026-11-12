from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Agent, Vendor, Product
from schemas import AgentCreate, AgentUpdate, AgentOut, InstructRequest
from services.actor_agent import run_actor_agent
import uuid

router = APIRouter()


@router.get("/", response_model=List[AgentOut])
def list_agents(db: Session = Depends(get_db)):
    return db.query(Agent).all()


@router.post("/", response_model=AgentOut)
def create_agent(data: AgentCreate, db: Session = Depends(get_db)):
    agent = Agent(
        id=str(uuid.uuid4()),
        name=data.name,
        role=data.role,
        budget_limit=data.budget_limit,
        available_budget=data.budget_limit,
        spent_amount=0.0,
        permissions=data.permissions,
        wallet_id=data.wallet_id,
        description=data.description or ""
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "AGENT_CREATED", f"Agent '{agent.name}' ({agent.role}) created",
                     metadata={"agent_id": agent.id, "budget_limit": agent.budget_limit})
    return agent


@router.get("/{agent_id}", response_model=AgentOut)
def get_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter_by(id=agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    return agent


@router.put("/{agent_id}", response_model=AgentOut)
def update_agent(agent_id: str, data: AgentUpdate, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter_by(id=agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if data.name is not None:
        agent.name = data.name
    if data.status is not None:
        agent.status = data.status
    if data.budget_limit is not None:
        diff = data.budget_limit - agent.budget_limit
        agent.budget_limit = data.budget_limit
        agent.available_budget = max(0, agent.available_budget + diff)
    if data.permissions is not None:
        agent.permissions = data.permissions
    if data.description is not None:
        agent.description = data.description
    db.commit()
    db.refresh(agent)
    return agent


@router.post("/{agent_id}/activate")
def activate_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter_by(id=agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.status = "ACTIVE"
    db.commit()
    return {"status": "ACTIVE", "agent_id": agent_id}


@router.post("/{agent_id}/deactivate")
def deactivate_agent(agent_id: str, db: Session = Depends(get_db)):
    agent = db.query(Agent).filter_by(id=agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    agent.status = "INACTIVE"
    db.commit()
    return {"status": "INACTIVE", "agent_id": agent_id}


@router.post("/instruct")
def instruct_agent(data: InstructRequest, db: Session = Depends(get_db)):
    """Run Actor Agent with natural language instruction"""
    agent = db.query(Agent).filter_by(id=data.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    if agent.status != "ACTIVE":
        raise HTTPException(status_code=400, detail=f"Agent is {agent.status} — cannot process instructions")

    # Detect prompt injection
    injection_patterns = [
        "ignore previous", "system:", "override policy", "bypass security",
        "</instruction>", "transfer all funds", "new instruction", "ignore all"
    ]
    instruction_lower = data.instruction.lower()
    for pattern in injection_patterns:
        if pattern in instruction_lower:
            from services.ledger_service import add_ledger_entry
            add_ledger_entry(db, "SECURITY_ALERT",
                             f"Prompt injection attempt detected in agent instruction",
                             metadata={"agent_id": data.agent_id, "pattern": pattern})
            raise HTTPException(status_code=400,
                                detail=f"Prompt injection detected: '{pattern}' found in instruction. Request blocked.")

    # Build product catalogue for agent
    products = db.query(Product).join(Vendor).filter(
        Vendor.is_blocked == False
    ).all()

    catalogue = []
    for p in products:
        catalogue.append({
            "id": p.id,
            "vendor_id": p.vendor_id,
            "vendor_name": p.vendor.name if p.vendor else "Unknown",
            "name": p.name,
            "category": p.category,
            "price": p.price,
            "market_price": p.market_price,
            "specs": p.specs or {},
            "in_stock": p.in_stock,
            "trust_score": p.vendor.trust_score if p.vendor else 50,
            "is_suspicious": p.vendor.is_suspicious if p.vendor else False,
            "is_blocked": p.vendor.is_blocked if p.vendor else False,
        })

    result = run_actor_agent(data.instruction, catalogue)

    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "AGENT_TASK",
                     f"Agent '{agent.name}' processed instruction: '{data.instruction[:60]}...'",
                     metadata={"agent_id": agent.id, "mode": result.get("_mode", "UNKNOWN")})

    return {
        "agent_id": data.agent_id,
        "agent_name": agent.name,
        "instruction": data.instruction,
        "result": result
    }

