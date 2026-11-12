from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import SystemSetting, SecurityEvent
from schemas import SimulationRequest, KillSwitchStatus
from services.simulation_service import run_simulation
from services.ledger_service import add_ledger_entry
from datetime import datetime
import uuid

router = APIRouter()


@router.get("/kill-switch", response_model=KillSwitchStatus)
def get_kill_switch_status(db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter_by(key="kill_switch_active").first()
    act_time = db.query(SystemSetting).filter_by(key="kill_switch_activated_at").first()
    reason = db.query(SystemSetting).filter_by(key="kill_switch_reason").first()

    return KillSwitchStatus(
        active=(setting.value == "true") if setting else False,
        activated_at=act_time.value if act_time else None,
        reason=reason.value if reason else None
    )


@router.post("/kill-switch/activate")
def activate_kill_switch(reason: str = "Administrator Emergency Override", db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter_by(key="kill_switch_active").first()
    if not setting:
        setting = SystemSetting(id=str(uuid.uuid4()), key="kill_switch_active", value="true")
        db.add(setting)
    else:
        setting.value = "true"

    act_time = db.query(SystemSetting).filter_by(key="kill_switch_activated_at").first()
    now_str = datetime.utcnow().isoformat()
    if not act_time:
        db.add(SystemSetting(id=str(uuid.uuid4()), key="kill_switch_activated_at", value=now_str))
    else:
        act_time.value = now_str

    reason_setting = db.query(SystemSetting).filter_by(key="kill_switch_reason").first()
    if not reason_setting:
        db.add(SystemSetting(id=str(uuid.uuid4()), key="kill_switch_reason", value=reason))
    else:
        reason_setting.value = reason

    sec_event = SecurityEvent(
        id=str(uuid.uuid4()),
        event_type="KILL_SWITCH_ACTIVATED",
        description=f"Emergency kill switch activated: {reason}",
        severity="CRITICAL",
        extra_metadata={"reason": reason, "timestamp": now_str}
    )
    db.add(sec_event)
    db.commit()

    add_ledger_entry(
        db,
        "KILL_SWITCH_ACTIVATED",
        f"Emergency Kill Switch engaged by Admin. Reason: {reason}",
        metadata={"reason": reason, "activated_at": now_str}
    )

    return {"status": "ACTIVE", "reason": reason, "activated_at": now_str}


@router.post("/kill-switch/deactivate")
def deactivate_kill_switch(db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).filter_by(key="kill_switch_active").first()
    if setting:
        setting.value = "false"

    reason_setting = db.query(SystemSetting).filter_by(key="kill_switch_reason").first()
    if reason_setting:
        reason_setting.value = ""

    sec_event = SecurityEvent(
        id=str(uuid.uuid4()),
        event_type="KILL_SWITCH_DEACTIVATED",
        description="Emergency kill switch deactivated by Administrator",
        severity="HIGH",
        extra_metadata={"timestamp": datetime.utcnow().isoformat()}
    )
    db.add(sec_event)
    db.commit()

    add_ledger_entry(
        db,
        "KILL_SWITCH_DEACTIVATED",
        "Emergency Kill Switch deactivated by Admin. Autonomous operations resumed.",
        metadata={"deactivated_at": datetime.utcnow().isoformat()}
    )

    return {"status": "INACTIVE"}


@router.get("/events")
def list_security_events(db: Session = Depends(get_db)):
    events = db.query(SecurityEvent).order_by(SecurityEvent.created_at.desc()).limit(50).all()
    return [{
        "id": e.id,
        "event_type": e.event_type,
        "description": e.description,
        "severity": e.severity,
        "metadata": e.extra_metadata,
        "created_at": e.created_at.isoformat()
    } for e in events]


@router.post("/simulate")
def simulate_scenario(data: SimulationRequest, db: Session = Depends(get_db)):
    result = run_simulation(db, data.scenario_id)
    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    add_ledger_entry(
        db,
        "SECURITY_SIMULATION_EXECUTED",
        f"Security Simulation #{data.scenario_id} executed ({result.get('scenario_name')}) — Result: {result.get('status')}",
        metadata={"scenario_id": data.scenario_id, "status": result.get("status")}
    )

    return result
