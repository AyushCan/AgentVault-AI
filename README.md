# AgentVault
### *Autonomous Intelligence. Human-Controlled Finance.*

AgentVault provides a robust financial governance layer between autonomous AI agents and real/simulated payment execution systems.

---

## Quick Start (Run The App)

You can launch both servers simultaneously or separately:

### Method 1: One-Click Launch (Windows)
Double-click `run_all.bat` in the project root. This opens two windows:
1. **Backend Server:** [http://127.0.0.1:8000](http://127.0.0.1:8000) (Interactive API Docs: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs))
2. **Frontend UI:** [http://localhost:5173](http://localhost:5173)

---

### Method 2: Manual Terminal Commands

#### Terminal 1 — Start the Backend (FastAPI):
```powershell
cd backend
python -m uvicorn main:app --reload --port 8000
```

#### Terminal 2 — Start the Frontend (Vite + React):
```powershell
cd frontend
npm.cmd run dev
```

Open your browser to [http://localhost:5173](http://localhost:5173).

---

## Judge Demonstration Credentials
- **One-Click Login:** Click the **"One-Click Demo Login (Judge Mode)"** button on the login screen.
- **Manual Credentials:**
  - Email: `demo@agentvault.ai`
  - Password: `demo123`

---

## 12 Core Implemented Features

1. **Autonomous Actor Agent:** Understands natural-language instructions (e.g. *"Purchase a laptop under ₹70,000 with at least 16 GB RAM"*), compares catalog products, explains selection, and generates purchase requests.
2. **Independent AI Auditor Agent:** Evaluates vendor reliability, price anomalies vs. market value, budget compliance, and issues an independent report with recommendations.
3. **Agent-to-Agent Delegation:** Multi-agent role coordination (ProcurementBot, ResearchBot, BudgetAnalyst, AuditorBot) with capability limits and delegation ledger.
4. **Programmable Wallets & Budgets:** Simulated treasury pools in INR (₹) with budget allocation and freeze/unfreeze controls.
5. **Deterministic Financial Policy Engine:** 10-rule non-LLM execution hierarchy (Kill switch, Wallet frozen, Permissions, Limits, Blacklists, Risk score, Human approval thresholds).
6. **Human Approval Workflow:** Review center displaying pending requests, risk analysis, and working Approve/Reject actions.
7. **Explainable Fraud & Risk Detection:** 0–100 risk score with LOW, MEDIUM, HIGH, and CRITICAL categories and explainable indicator flags.
8. **Emergency Kill Switch:** Immediate circuit breaker that blocks all autonomous purchasing and records the event in the audit ledger.
9. **Tamper-Evident Audit Ledger:** Cryptographic SHA-256 hash chain with a **"Verify Ledger Integrity"** tool and interactive tamper detection test.
10. **Payment Gateway Adapters:** Default Mock Payment Mode with realistic bank response simulation + optional PayPal Sandbox integration.
11. **Real-Time Monitoring Dashboard:** Telemetry on wallet allocation, spending trajectory, agent breakdown, outcome distributions, and live ledger stream.
12. **Interactive Security Simulation Lab:** 6 interactive live attack/failure simulations (Budget Violation, Suspicious Vendor, Prompt Injection, Duplicate Purchase, Unauthorized Agent, Kill Switch).

