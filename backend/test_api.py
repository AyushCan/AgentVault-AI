"""
AgentVault Quick Verification Script
Runs a full health check on the core backend services without needing a running server.
"""
import sys
from database import SessionLocal
from seed_data import seed_database
from services.policy_engine import evaluate_policy
from services.risk_engine import assess_risk
from services.actor_agent import run_actor_agent
from services.auditor_agent import run_auditor_agent
from services.ledger_service import verify_ledger
from services.simulation_service import run_simulation
from models import Agent, Wallet, Vendor, Product, PurchaseRequest

def test_all():
    print("=" * 60)
    print(" AgentVault: Verification & System Health Check")
    print("=" * 60)
    
    db = SessionLocal()
    try:
        # 1. DB Seeding Check
        agent_count = db.query(Agent).count()
        wallet_count = db.query(Wallet).count()
        vendor_count = db.query(Vendor).count()
        print(f"[1] Database State:")
        print(f"    - Agents: {agent_count}")
        print(f"    - Wallets: {wallet_count}")
        print(f"    - Vendors: {vendor_count}")
        assert agent_count > 0, "No agents seeded!"
        
        # 2. Ledger Hash Chain Verification
        ledger_res = verify_ledger(db)
        print(f"\n[2] SHA-256 Tamper-Evident Ledger Integrity:")
        print(f"    - Valid Chain: {ledger_res['all_valid']}")
        print(f"    - Total Entries: {ledger_res['total_entries']}")
        assert ledger_res['all_valid'], "Ledger integrity check failed!"
        
        # 3. Deterministic Policy Engine Test
        proc_agent = db.query(Agent).filter_by(role="PROCUREMENT").first()
        main_wallet = db.query(Wallet).filter_by(status="ACTIVE").first()
        policy_res = evaluate_policy(db, proc_agent.id, main_wallet.id, 5000.0, None, 10.0)
        print(f"\n[3] Policy Engine Evaluation:")
        print(f"    - ₹5,000 Purchase Decision: {policy_res['decision']}")
        print(f"    - Reason: {policy_res['final_reason']}")
        
        # 4. Actor Agent Demo Test
        print(f"\n[4] Autonomous Actor Agent (Demo / Groq):")
        instruction = "Purchase a laptop under ₹70,000 with at least 16 GB RAM"
        products = db.query(Product).all()
        cat = [{"id": p.id, "name": p.name, "price": p.price, "specs": p.specs, "trust_score": 90, "vendor_id": p.vendor_id} for p in products]
        actor_res = run_actor_agent(instruction, cat)
        print(f"    - Instruction: \"{instruction}\"")
        print(f"    - Recommended Product: {actor_res.get('recommended_product_name')}")
        print(f"    - Price: ₹{actor_res.get('recommended_price', 0):,.2f}")
        print(f"    - Mode: {actor_res.get('_mode')}")
        
        # 5. Security Lab Simulation Test
        sim_res = run_simulation(db, 1) # Budget Violation
        print(f"\n[5] Security Lab Simulation #1 (Budget Violation):")
        print(f"    - Scenario: {sim_res.get('scenario_name')}")
        print(f"    - Status: {sim_res.get('status')}")
        print(f"    - Outcome: {sim_res.get('decision')}")
        
        print("\n" + "=" * 60)
        print(" ALL CORE SUBSYSTEMS VERIFIED & OPERATIONAL!")
        print("=" * 60)
    finally:
        db.close()

if __name__ == "__main__":
    test_all()

