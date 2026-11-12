from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models import Vendor, Product
from schemas import VendorCreate, VendorOut, ProductOut
import uuid

router = APIRouter()


@router.get("/", response_model=List[VendorOut])
def list_vendors(db: Session = Depends(get_db)):
    return db.query(Vendor).all()


@router.post("/", response_model=VendorOut)
def create_vendor(data: VendorCreate, db: Session = Depends(get_db)):
    vendor = Vendor(
        id=str(uuid.uuid4()),
        name=data.name,
        category=data.category or "General",
        trust_score=data.trust_score or 80.0,
        is_suspicious=data.is_suspicious or False,
        is_blocked=data.is_blocked or False,
        description=data.description or ""
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.get("/{vendor_id}/products", response_model=List[ProductOut])
def list_vendor_products(vendor_id: str, db: Session = Depends(get_db)):
    return db.query(Product).filter_by(vendor_id=vendor_id).all()


@router.get("/products/all", response_model=List[ProductOut])
def list_all_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

