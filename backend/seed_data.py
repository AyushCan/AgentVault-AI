from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import hashlib


def hash_password(password: str) -> str:
    return hashlib.sha256((password + "agentvault_salt").encode()).hexdigest()


def seed_database(db: Session):
    """Seed the database with realistic demo data on first run"""
    from models import (User, Wallet, Agent, Vendor, Product, PurchaseRequest,
                        Transaction, AuditReport, RiskAssessment, Policy,
                        Approval, Delegation, PaymentRecord, AuditLedgerEntry,
                        SecurityEvent, SystemSetting)

    # Check if already seeded
    if db.query(User).count() > 0:
        return

    print("Seeding AgentVault demo data...")

    # ── System Settings ──────────────────────────────────────────────────────
    db.add(SystemSetting(id=str(uuid.uuid4()), key="kill_switch_active", value="false"))
    db.add(SystemSetting(id=str(uuid.uuid4()), key="kill_switch_activated_at", value=""))
    db.add(SystemSetting(id=str(uuid.uuid4()), key="kill_switch_reason", value=""))
    db.commit()

    # ── Users ────────────────────────────────────────────────────────────────
    demo_user = User(
        id=str(uuid.uuid4()),
        email="demo@agentvault.ai",
        password_hash=hash_password("demo123"),
        name="Alex Sharma",
        role="admin"
    )
    db.add(demo_user)
    db.commit()

    # ── Wallets ──────────────────────────────────────────────────────────────
    wallet_main = Wallet(
        id=str(uuid.uuid4()),
        name="Main Treasury",
        description="Primary organizational wallet for all procurement",
        total_balance=500000.0,
        allocated_balance=350000.0,
        available_balance=150000.0,
        status="ACTIVE"
    )
    wallet_ops = Wallet(
        id=str(uuid.uuid4()),
        name="Operations",
        description="Day-to-day operational expenses",
        total_balance=200000.0,
        allocated_balance=120000.0,
        available_balance=80000.0,
        status="ACTIVE"
    )
    wallet_rd = Wallet(
        id=str(uuid.uuid4()),
        name="R&D Budget",
        description="Research and development procurement",
        total_balance=100000.0,
        allocated_balance=60000.0,
        available_balance=40000.0,
        status="ACTIVE"
    )
    for w in [wallet_main, wallet_ops, wallet_rd]:
        db.add(w)
    db.commit()

    # ── Agents ───────────────────────────────────────────────────────────────
    agent_procurement = Agent(
        id=str(uuid.uuid4()),
        name="ProcurementBot",
        role="PROCUREMENT",
        status="ACTIVE",
        budget_limit=100000.0,
        spent_amount=42500.0,
        available_budget=57500.0,
        permissions=["PURCHASE", "RESEARCH", "DELEGATE"],
        wallet_id=wallet_main.id,
        description="Primary procurement agent for hardware and software purchases"
    )
    agent_research = Agent(
        id=str(uuid.uuid4()),
        name="ResearchBot",
        role="RESEARCH",
        status="ACTIVE",
        budget_limit=50000.0,
        spent_amount=12000.0,
        available_budget=38000.0,
        permissions=["RESEARCH", "DELEGATE"],
        wallet_id=wallet_rd.id,
        description="Researches vendors and product specifications"
    )
    agent_budget = Agent(
        id=str(uuid.uuid4()),
        name="BudgetAnalyst",
        role="BUDGET_ANALYST",
        status="ACTIVE",
        budget_limit=25000.0,
        spent_amount=5000.0,
        available_budget=20000.0,
        permissions=["RESEARCH"],
        wallet_id=wallet_ops.id,
        description="Analyzes spending patterns and budget compliance"
    )
    agent_auditor = Agent(
        id=str(uuid.uuid4()),
        name="AuditorBot",
        role="AUDITOR",
        status="ACTIVE",
        budget_limit=10000.0,
        spent_amount=0.0,
        available_budget=10000.0,
        permissions=["AUDIT", "RESEARCH"],
        wallet_id=wallet_main.id,
        description="Independent transaction auditor — reports to compliance"
    )
    for a in [agent_procurement, agent_research, agent_budget, agent_auditor]:
        db.add(a)
    db.commit()

    # ── Vendors ──────────────────────────────────────────────────────────────
    vendor_techworld = Vendor(id=str(uuid.uuid4()), name="TechWorld India", category="Electronics",
                               trust_score=92.0, is_suspicious=False, is_blocked=False,
                               avg_price=55000.0, description="Premium electronics retailer")
    vendor_global = Vendor(id=str(uuid.uuid4()), name="GlobalGadgets", category="Electronics",
                           trust_score=85.0, is_suspicious=False, is_blocked=False,
                           avg_price=48000.0, description="Competitive pricing on gadgets")
    vendor_budget = Vendor(id=str(uuid.uuid4()), name="BudgetTech", category="Electronics",
                           trust_score=62.0, is_suspicious=True, is_blocked=False,
                           avg_price=35000.0, description="Low-cost electronics — verify before purchase")
    vendor_premium = Vendor(id=str(uuid.uuid4()), name="PremiumElec", category="Electronics",
                            trust_score=96.0, is_suspicious=False, is_blocked=False,
                            avg_price=75000.0, description="High-end certified electronics")
    vendor_suspicious = Vendor(id=str(uuid.uuid4()), name="QuickDeal Sellers", category="Electronics",
                               trust_score=28.0, is_suspicious=True, is_blocked=True,
                               avg_price=20000.0, description="BLOCKED: Fraudulent activity reported")
    vendor_reliable = Vendor(id=str(uuid.uuid4()), name="ReliableSupply Co.", category="Office",
                             trust_score=88.0, is_suspicious=False, is_blocked=False,
                             avg_price=25000.0, description="Reliable office equipment supplier")
    vendor_quickship = Vendor(id=str(uuid.uuid4()), name="QuickShip Electronics", category="Electronics",
                              trust_score=79.0, is_suspicious=False, is_blocked=False,
                              avg_price=42000.0, description="Fast delivery, good prices")
    vendor_megamart = Vendor(id=str(uuid.uuid4()), name="MegaMart Online", category="Mixed",
                             trust_score=83.0, is_suspicious=False, is_blocked=False,
                             avg_price=38000.0, description="Large marketplace with verified sellers")

    all_vendors = [vendor_techworld, vendor_global, vendor_budget, vendor_premium,
                   vendor_suspicious, vendor_reliable, vendor_quickship, vendor_megamart]
    for v in all_vendors:
        db.add(v)
    db.commit()

    # ── Products ─────────────────────────────────────────────────────────────
    products = [
        Product(id=str(uuid.uuid4()), vendor_id=vendor_techworld.id, name="Dell XPS 15 (i7, 16GB, 512GB)",
                category="laptop", price=68500.0, market_price=70000.0,
                specs={"ram_gb": 16, "storage": "512GB SSD", "processor": "Intel i7-13700H", "display": "15.6 FHD"}, in_stock=True),
        Product(id=str(uuid.uuid4()), vendor_id=vendor_global.id, name="Lenovo ThinkPad E14 (Ryzen 5, 16GB)",
                category="laptop", price=52000.0, market_price=54000.0,
                specs={"ram_gb": 16, "storage": "512GB SSD", "processor": "AMD Ryzen 5 7530U"}, in_stock=True),
        Product(id=str(uuid.uuid4()), vendor_id=vendor_budget.id, name="Acer Aspire 5 (i5, 8GB, 256GB)",
                category="laptop", price=38000.0, market_price=42000.0,
                specs={"ram_gb": 8, "storage": "256GB SSD", "processor": "Intel i5-1235U"}, in_stock=True),
        Product(id=str(uuid.uuid4()), vendor_id=vendor_premium.id, name="MacBook Pro 14 (M3, 16GB)",
                category="laptop", price=84999.0, market_price=85000.0,
                specs={"ram_gb": 16, "storage": "512GB SSD", "processor": "Apple M3"}, in_stock=True),
        Product(id=str(uuid.uuid4()), vendor_id=vendor_quickship.id, name="HP Pavilion 15 (i5, 16GB)",
                category="laptop", price=55000.0, market_price=57000.0,
                specs={"ram_gb": 16, "storage": "512GB SSD", "processor": "Intel i5-12500H"}, in_stock=True),
        Product(id=str(uuid.uuid4()), vendor_id=vendor_techworld.id, name="LG UltraWide Monitor 27\"",
                category="monitor", price=28000.0, market_price=30000.0,
                specs={"size": "27 inch", "resolution": "2560x1080", "panel": "IPS"}, in_stock=True),
        Product(id=str(uuid.uuid4()), vendor_id=vendor_megamart.id, name="Samsung 24\" FHD Monitor",
                category="monitor", price=18500.0, market_price=19000.0,
                specs={"size": "24 inch", "resolution": "1920x1080", "panel": "VA"}, in_stock=True),
        Product(id=str(uuid.uuid4()), vendor_id=vendor_reliable.id, name="Ergonomic Office Chair Pro",
                category="furniture", price=22000.0, market_price=24000.0,
                specs={"material": "Mesh", "adjustable": True, "armrests": "4D"}, in_stock=True),
        Product(id=str(uuid.uuid4()), vendor_id=vendor_suspicious.id, name="Generic Laptop Bundle",
                category="laptop", price=29999.0, market_price=55000.0,
                specs={"ram_gb": 16, "storage": "1TB HDD"}, in_stock=True),
        Product(id=str(uuid.uuid4()), vendor_id=vendor_global.id, name="Sony WH-1000XM5 Headphones",
                category="audio", price=24999.0, market_price=26000.0,
                specs={"type": "Over-ear", "noise_cancellation": True, "battery_hours": 30}, in_stock=True),
    ]
    for p in products:
        db.add(p)
    db.commit()

    # ── Policies ─────────────────────────────────────────────────────────────
    policy_main = Policy(
        id=str(uuid.uuid4()),
        name="Default Procurement Policy",
        auto_approve_threshold=10000.0,
        risk_auto_reject_threshold=80.0,
        blocked_vendors=[vendor_suspicious.id],
        require_human_above=50000.0,
        is_active=True
    )
    db.add(policy_main)
    db.commit()

    # ── Purchase Requests + Transactions ────────────────────────────────────
    # Completed transaction 1
    pr1 = PurchaseRequest(
        id=str(uuid.uuid4()), agent_id=agent_procurement.id,
        vendor_id=vendor_global.id, product_id=products[1].id,
        amount=52000.0, instruction="Purchase a laptop for the dev team, budget under ₹60,000 with 16GB RAM",
        status="COMPLETED",
        actor_recommendation={"recommended_product_name": "Lenovo ThinkPad E14", "confidence_score": 0.89}
    )
    db.add(pr1); db.commit()

    tx1 = Transaction(
        id=str(uuid.uuid4()), purchase_request_id=pr1.id,
        agent_id=agent_procurement.id, vendor_id=vendor_global.id,
        amount=52000.0, status="COMPLETED",
        policy_decision="APPROVED", policy_reason="All policy rules passed",
        policy_rules_evaluated=[{"rule": "Kill Switch", "result": "PASSED"}, {"rule": "Final Authorization", "result": "APPROVED"}],
        risk_score=12.0, risk_category="LOW",
        description="Laptop purchase - Dev Team",
        created_at=datetime(2024, 11, 1, 10, 30)
    )
    db.add(tx1); db.commit()

    db.add(PaymentRecord(id=str(uuid.uuid4()), transaction_id=tx1.id,
                         payment_method="MOCK", reference="PAY-TW7K2X9M3P1Q",
                         status="SUCCESS", amount=52000.0,
                         extra_metadata={"mode": "MOCK_PAYMENT", "disclaimer": "Simulated payment"}))
    db.commit()

    # Completed transaction 2
    pr2 = PurchaseRequest(
        id=str(uuid.uuid4()), agent_id=agent_procurement.id,
        vendor_id=vendor_reliable.id, product_id=products[7].id,
        amount=22000.0, instruction="Get ergonomic chairs for the new office",
        status="COMPLETED",
        actor_recommendation={"recommended_product_name": "Ergonomic Office Chair Pro", "confidence_score": 0.92}
    )
    db.add(pr2); db.commit()

    tx2 = Transaction(
        id=str(uuid.uuid4()), purchase_request_id=pr2.id,
        agent_id=agent_procurement.id, vendor_id=vendor_reliable.id,
        amount=22000.0, status="COMPLETED",
        policy_decision="APPROVED", policy_reason="All policy rules passed — auto-approved",
        policy_rules_evaluated=[],
        risk_score=5.0, risk_category="LOW",
        description="Office chairs purchase",
        created_at=datetime(2024, 11, 3, 14, 15)
    )
    db.add(tx2); db.commit()

    db.add(PaymentRecord(id=str(uuid.uuid4()), transaction_id=tx2.id,
                         payment_method="MOCK", reference="PAY-RF8M1N4B2X7K",
                         status="SUCCESS", amount=22000.0,
                         extra_metadata={"mode": "MOCK_PAYMENT", "disclaimer": "Simulated payment"}))
    db.commit()

    # Completed transaction 3 (monitors)
    pr3 = PurchaseRequest(
        id=str(uuid.uuid4()), agent_id=agent_research.id,
        vendor_id=vendor_megamart.id, product_id=products[6].id,
        amount=18500.0, instruction="Buy monitors for the research lab",
        status="COMPLETED",
        actor_recommendation={"recommended_product_name": "Samsung 24 FHD Monitor", "confidence_score": 0.78}
    )
    db.add(pr3); db.commit()

    tx3 = Transaction(
        id=str(uuid.uuid4()), purchase_request_id=pr3.id,
        agent_id=agent_research.id, vendor_id=vendor_megamart.id,
        amount=18500.0, status="COMPLETED",
        policy_decision="APPROVED", policy_reason="All policy rules passed",
        policy_rules_evaluated=[],
        risk_score=8.0, risk_category="LOW",
        description="Research lab monitors",
        created_at=datetime(2024, 11, 5, 9, 0)
    )
    db.add(tx3); db.commit()

    db.add(PaymentRecord(id=str(uuid.uuid4()), transaction_id=tx3.id,
                         payment_method="MOCK", reference="PAY-QJ5P9L3K8D2W",
                         status="SUCCESS", amount=18500.0,
                         extra_metadata={"mode": "MOCK_PAYMENT", "disclaimer": "Simulated payment"}))
    db.commit()

    # Rejected transaction 1
    pr4 = PurchaseRequest(
        id=str(uuid.uuid4()), agent_id=agent_research.id,
        vendor_id=vendor_suspicious.id, product_id=products[8].id,
        amount=29999.0, instruction="Get cheap laptops in bulk",
        status="REJECTED",
        actor_recommendation={}
    )
    db.add(pr4); db.commit()

    tx4 = Transaction(
        id=str(uuid.uuid4()), purchase_request_id=pr4.id,
        agent_id=agent_research.id, vendor_id=vendor_suspicious.id,
        amount=29999.0, status="REJECTED",
        policy_decision="REJECTED", policy_reason="Vendor 'QuickDeal Sellers' is flagged as blocked",
        policy_rules_evaluated=[{"rule": "Kill Switch", "result": "PASSED"}, {"rule": "Vendor Restriction", "result": "FAILED", "reason": "Vendor is blocked"}],
        risk_score=78.0, risk_category="HIGH",
        description="Blocked vendor purchase attempt",
        created_at=datetime(2024, 11, 7, 11, 20)
    )
    db.add(tx4); db.commit()

    # Pending approval transaction 1
    pr5 = PurchaseRequest(
        id=str(uuid.uuid4()), agent_id=agent_procurement.id,
        vendor_id=vendor_premium.id, product_id=products[3].id,
        amount=84999.0, instruction="Purchase MacBook Pro 14 for the design team",
        status="PENDING",
        actor_recommendation={"recommended_product_name": "MacBook Pro 14 M3", "confidence_score": 0.94}
    )
    db.add(pr5); db.commit()

    tx5 = Transaction(
        id=str(uuid.uuid4()), purchase_request_id=pr5.id,
        agent_id=agent_procurement.id, vendor_id=vendor_premium.id,
        amount=84999.0, status="PENDING",
        policy_decision="REQUIRES_HUMAN_APPROVAL",
        policy_reason="Amount ₹84,999 exceeds auto-approval threshold — human review required",
        policy_rules_evaluated=[{"rule": "Kill Switch", "result": "PASSED"}, {"rule": "Amount Threshold", "result": "FAILED", "reason": "Exceeds ₹50,000 auto-approval limit"}],
        risk_score=22.0, risk_category="LOW",
        description="MacBook Pro purchase - Design Team",
        created_at=datetime(2024, 11, 10, 15, 45)
    )
    db.add(tx5); db.commit()

    approval1 = Approval(
        id=str(uuid.uuid4()), transaction_id=tx5.id,
        status="PENDING", requested_at=datetime(2024, 11, 10, 15, 45)
    )
    db.add(approval1); db.commit()

    # Pending approval transaction 2 (suspicious vendor)
    pr6 = PurchaseRequest(
        id=str(uuid.uuid4()), agent_id=agent_procurement.id,
        vendor_id=vendor_budget.id, product_id=products[2].id,
        amount=38000.0, instruction="Get budget laptops for interns",
        status="PENDING",
        actor_recommendation={"recommended_product_name": "Acer Aspire 5", "confidence_score": 0.71}
    )
    db.add(pr6); db.commit()

    tx6 = Transaction(
        id=str(uuid.uuid4()), purchase_request_id=pr6.id,
        agent_id=agent_procurement.id, vendor_id=vendor_budget.id,
        amount=38000.0, status="PENDING",
        policy_decision="REQUIRES_HUMAN_APPROVAL",
        policy_reason="Risk score 62 exceeds threshold — human review required",
        policy_rules_evaluated=[{"rule": "Kill Switch", "result": "PASSED"}, {"rule": "Risk Score", "result": "FAILED", "reason": "Score 62 >= threshold 60"}],
        risk_score=62.0, risk_category="HIGH",
        description="Intern laptops from BudgetTech",
        created_at=datetime(2024, 11, 11, 10, 0)
    )
    db.add(tx6); db.commit()

    approval2 = Approval(
        id=str(uuid.uuid4()), transaction_id=tx6.id,
        status="PENDING", requested_at=datetime(2024, 11, 11, 10, 0)
    )
    db.add(approval2); db.commit()

    # ── Audit Reports ────────────────────────────────────────────────────────
    db.add(AuditReport(
        id=str(uuid.uuid4()), purchase_request_id=pr1.id,
        risk_score=12.0, recommendation="APPROVE_RECOMMENDED",
        evidence=[{"point": "Reputable vendor", "severity": "LOW", "detail": "GlobalGadgets trust score: 85"}],
        explanation="Transaction is straightforward procurement from verified vendor within budget.",
        red_flags=[]
    ))
    db.add(AuditReport(
        id=str(uuid.uuid4()), purchase_request_id=pr5.id,
        risk_score=22.0, recommendation="REQUIRE_HUMAN_REVIEW",
        evidence=[{"point": "High value transaction", "severity": "MEDIUM", "detail": "Amount ₹84,999 exceeds auto-approval threshold"}],
        explanation="High-value purchase from reputable vendor. Requires human sign-off due to amount.",
        red_flags=["High transaction value requires human authorization"]
    ))
    db.add(AuditReport(
        id=str(uuid.uuid4()), purchase_request_id=pr4.id,
        risk_score=78.0, recommendation="REJECT_RECOMMENDED",
        evidence=[{"point": "Blocked vendor", "severity": "CRITICAL", "detail": "QuickDeal Sellers is on blocked list"},
                  {"point": "Price anomaly", "severity": "HIGH", "detail": "Price ₹29,999 vs market ₹55,000 — suspicious discount"}],
        explanation="REJECT: Vendor is blocked due to fraud reports. Price is suspiciously low compared to market value.",
        red_flags=["Vendor is in blocked list", "Price is 45% below market rate"]
    ))
    db.commit()

    # ── Delegations ──────────────────────────────────────────────────────────
    deleg1 = Delegation(
        id=str(uuid.uuid4()), from_agent_id=agent_procurement.id, to_agent_id=agent_research.id,
        task_type="RESEARCH", task_description="Research best laptop vendors for 2024 Q4 procurement",
        status="COMPLETED", result={"vendors_found": 5, "recommended": "GlobalGadgets"},
        created_at=datetime(2024, 10, 28), completed_at=datetime(2024, 10, 29)
    )
    deleg2 = Delegation(
        id=str(uuid.uuid4()), from_agent_id=agent_procurement.id, to_agent_id=agent_budget.id,
        task_type="BUDGET_CHECK", task_description="Verify Q4 budget availability for hardware procurement",
        status="COMPLETED", result={"budget_available": True, "available_amount": 150000.0},
        created_at=datetime(2024, 11, 1), completed_at=datetime(2024, 11, 1)
    )
    deleg3 = Delegation(
        id=str(uuid.uuid4()), from_agent_id=agent_research.id, to_agent_id=agent_auditor.id,
        task_type="AUDIT", task_description="Audit BudgetTech vendor credibility",
        status="PENDING", result={},
        created_at=datetime(2024, 11, 11)
    )
    for d in [deleg1, deleg2, deleg3]:
        db.add(d)
    db.commit()

    # ── Security Events ──────────────────────────────────────────────────────
    db.add(SecurityEvent(id=str(uuid.uuid4()), event_type="BLOCKED_VENDOR_ATTEMPT",
                         description="ResearchBot attempted purchase from blocked vendor QuickDeal Sellers",
                         severity="HIGH", extra_metadata={"agent": "ResearchBot", "vendor": "QuickDeal Sellers"}))
    db.add(SecurityEvent(id=str(uuid.uuid4()), event_type="HIGH_RISK_TRANSACTION",
                         description="High-risk purchase detected from BudgetTech (score: 62)",
                         severity="MEDIUM", extra_metadata={"risk_score": 62}))
    db.commit()

    # ── Audit Ledger Entries (using ledger service) ───────────────────────────
    from services.ledger_service import add_ledger_entry

    add_ledger_entry(db, "SYSTEM_STARTUP", "AgentVault system initialized with demo data", metadata={"version": "1.0.0"})
    add_ledger_entry(db, "WALLET_CREATED", "Main Treasury wallet created (₹5,00,000)", metadata={"wallet": "Main Treasury"})
    add_ledger_entry(db, "WALLET_CREATED", "Operations wallet created (₹2,00,000)", metadata={"wallet": "Operations"})
    add_ledger_entry(db, "AGENT_CREATED", "ProcurementBot agent initialized", metadata={"agent": "ProcurementBot"})
    add_ledger_entry(db, "AGENT_CREATED", "ResearchBot agent initialized", metadata={"agent": "ResearchBot"})
    add_ledger_entry(db, "PURCHASE_COMPLETED", "Lenovo ThinkPad E14 purchase completed ₹52,000",
                     transaction_ref=tx1.id, metadata={"amount": 52000, "vendor": "GlobalGadgets"})
    add_ledger_entry(db, "PURCHASE_COMPLETED", "Ergonomic chairs purchase completed ₹22,000",
                     transaction_ref=tx2.id, metadata={"amount": 22000})
    add_ledger_entry(db, "PURCHASE_REJECTED", "Purchase blocked from QuickDeal Sellers — blocked vendor",
                     transaction_ref=tx4.id, metadata={"reason": "Blocked vendor"})
    add_ledger_entry(db, "APPROVAL_PENDING", "MacBook Pro purchase awaiting human approval (₹84,999)",
                     transaction_ref=tx5.id, metadata={"amount": 84999})
    add_ledger_entry(db, "POLICY_EVALUATED", "Policy engine evaluated 6 transactions since startup",
                     metadata={"approved": 3, "rejected": 1, "pending": 2})

    print("Demo data seeded successfully!")

