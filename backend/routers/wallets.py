from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Wallet, Agent
from schemas import WalletCreate, WalletUpdate, WalletOut, AllocateBudgetRequest
import uuid

router = APIRouter()


@router.get("/", response_model=List[WalletOut])
def list_wallets(db: Session = Depends(get_db)):
    return db.query(Wallet).all()


@router.post("/", response_model=WalletOut)
def create_wallet(data: WalletCreate, db: Session = Depends(get_db)):
    wallet = Wallet(
        id=str(uuid.uuid4()),
        name=data.name,
        description=data.description or "",
        total_balance=data.total_balance,
        allocated_balance=0.0,
        available_balance=data.total_balance
    )
    db.add(wallet)
    db.commit()
    db.refresh(wallet)
    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "WALLET_CREATED", f"Wallet '{wallet.name}' created with balance ₹{wallet.total_balance:,.2f}",
                     metadata={"wallet_id": wallet.id, "balance": wallet.total_balance})
    return wallet


@router.get("/{wallet_id}", response_model=WalletOut)
def get_wallet(wallet_id: str, db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter_by(id=wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    return wallet


@router.put("/{wallet_id}", response_model=WalletOut)
def update_wallet(wallet_id: str, data: WalletUpdate, db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter_by(id=wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    if data.name is not None:
        wallet.name = data.name
    if data.description is not None:
        wallet.description = data.description
    if data.total_balance is not None:
        diff = data.total_balance - wallet.total_balance
        wallet.total_balance = data.total_balance
        wallet.available_balance = max(0, wallet.available_balance + diff)
    db.commit()
    db.refresh(wallet)
    return wallet


@router.post("/{wallet_id}/freeze")
def freeze_wallet(wallet_id: str, db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter_by(id=wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    wallet.status = "FROZEN"
    db.commit()
    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "WALLET_FROZEN", f"Wallet '{wallet.name}' has been frozen",
                     metadata={"wallet_id": wallet_id})
    return {"status": "frozen", "wallet_id": wallet_id, "wallet_name": wallet.name}


@router.post("/{wallet_id}/unfreeze")
def unfreeze_wallet(wallet_id: str, db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter_by(id=wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    wallet.status = "ACTIVE"
    db.commit()
    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "WALLET_UNFROZEN", f"Wallet '{wallet.name}' has been unfrozen",
                     metadata={"wallet_id": wallet_id})
    return {"status": "active", "wallet_id": wallet_id, "wallet_name": wallet.name}


@router.post("/{wallet_id}/allocate")
def allocate_budget(wallet_id: str, data: AllocateBudgetRequest, db: Session = Depends(get_db)):
    wallet = db.query(Wallet).filter_by(id=wallet_id).first()
    if not wallet:
        raise HTTPException(status_code=404, detail="Wallet not found")
    if wallet.available_balance < data.amount:
        raise HTTPException(status_code=400, detail=f"Insufficient wallet balance: ₹{wallet.available_balance:,.2f} available")

    agent = db.query(Agent).filter_by(id=data.agent_id).first()
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")

    wallet.allocated_balance += data.amount
    wallet.available_balance -= data.amount
    agent.budget_limit += data.amount
    agent.available_budget += data.amount
    agent.wallet_id = wallet_id
    db.commit()

    from services.ledger_service import add_ledger_entry
    add_ledger_entry(db, "BUDGET_ALLOCATED",
                     f"₹{data.amount:,.2f} allocated from '{wallet.name}' to agent '{agent.name}'",
                     metadata={"wallet_id": wallet_id, "agent_id": data.agent_id, "amount": data.amount})

    return {"status": "allocated", "amount": data.amount, "agent": agent.name, "wallet": wallet.name}

