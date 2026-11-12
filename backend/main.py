import os
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import json

from database import engine, SessionLocal
from models import Base
from seed_data import seed_database

# Import routers
from routers import (
    auth, wallets, agents, purchases, auditor,
    delegation, policy, approvals, payments,
    risk, security, ledger, dashboard, vendors
)

app = FastAPI(
    title="AgentVault API",
    description="A Financial Governance Platform for Autonomous AI Agents",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for connection in list(self.active_connections):
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                self.disconnect(connection)


manager = ConnectionManager()


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Echo or handle incoming messages
            await websocket.send_text(json.dumps({"type": "PONG", "data": data}))
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Startup Event: DB Migration & Seeding
@app.on_event("startup")
async def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()


# Mount Routers under /api
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(wallets.router, prefix="/api/wallets", tags=["Wallets"])
app.include_router(agents.router, prefix="/api/agents", tags=["AI Agents"])
app.include_router(purchases.router, prefix="/api/purchases", tags=["Purchases"])
app.include_router(auditor.router, prefix="/api/auditor", tags=["Auditor Agent"])
app.include_router(delegation.router, prefix="/api/delegations", tags=["Delegation"])
app.include_router(policy.router, prefix="/api/policy", tags=["Policy Engine"])
app.include_router(approvals.router, prefix="/api/approvals", tags=["Approval Center"])
app.include_router(payments.router, prefix="/api/payments", tags=["Payment Processing"])
app.include_router(risk.router, prefix="/api/risk", tags=["Risk Management"])
app.include_router(security.router, prefix="/api/security", tags=["Security & Kill Switch"])
app.include_router(ledger.router, prefix="/api/ledger", tags=["Audit Ledger"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(vendors.router, prefix="/api/vendors", tags=["Vendors & Catalogue"])


@app.get("/")
def root():
    return {
        "platform": "AgentVault",
        "tagline": "Autonomous Intelligence. Human-Controlled Finance.",
        "status": "OPERATIONAL",
        "docs_url": "/docs",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

