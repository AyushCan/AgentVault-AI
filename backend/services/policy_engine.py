from sqlalchemy.orm import Session
from typing import Optional


def evaluate_policy(db: Session, agent_id: str, wallet_id: Optional[str],
                    amount: float, vendor_id: Optional[str], risk_score: float) -> dict:
    from models import SystemSetting, Wallet, Agent, Vendor, Policy

    rules_evaluated = []

    def rule_pass(rule, reason):
        rules_evaluated.append({"rule": rule, "result": "PASSED", "reason": reason})

    def rule_fail(rule, reason):
        rules_evaluated.append({"rule": rule, "result": "FAILED", "reason": reason})

    # Rule 1: Kill switch
    ks = db.query(SystemSetting).filter_by(key="kill_switch_active").first()
    if ks and ks.value == "true":
        rule_fail("Kill Switch", "Emergency kill switch is currently active")
        return {
            "decision": "BLOCKED_BY_KILL_SWITCH",
            "rules_evaluated": rules_evaluated,
            "final_reason": "Emergency kill switch is active — all autonomous transactions are blocked"
        }
    rule_pass("Kill Switch", "Kill switch is not active")

    # Rule 2: Wallet status
    if wallet_id:
        wallet = db.query(Wallet).filter_by(id=wallet_id).first()
        if wallet and wallet.status == "FROZEN":
            rule_fail("Wallet Status", f"Wallet '{wallet.name}' is frozen")
            return {
                "decision": "REJECTED",
                "rules_evaluated": rules_evaluated,
                "final_reason": f"Wallet '{wallet.name}' is frozen and cannot be used for transactions"
            }
        rule_pass("Wallet Status", "Wallet is active")
    else:
        rule_pass("Wallet Status", "No wallet restriction applied")

    # Rule 3: Agent status
    agent = db.query(Agent).filter_by(id=agent_id).first()
    if not agent:
        rule_fail("Agent Status", "Agent not found")
        return {"decision": "REJECTED", "rules_evaluated": rules_evaluated, "final_reason": "Agent not found"}

    if agent.status != "ACTIVE":
        rule_fail("Agent Status", f"Agent '{agent.name}' is {agent.status}")
        return {
            "decision": "REJECTED",
            "rules_evaluated": rules_evaluated,
            "final_reason": f"Agent '{agent.name}' is not active (status: {agent.status})"
        }
    rule_pass("Agent Status", f"Agent '{agent.name}' is active")

    # Rule 4: Agent permissions
    permissions = agent.permissions or []
    if "PURCHASE" not in permissions:
        rule_fail("Agent Permissions", f"Agent '{agent.name}' lacks PURCHASE permission")
        return {
            "decision": "REJECTED",
            "rules_evaluated": rules_evaluated,
            "final_reason": f"Agent '{agent.name}' does not have PURCHASE permission"
        }
    rule_pass("Agent Permissions", "Agent has PURCHASE permission")

    # Rule 5: Agent budget limit
    if amount > agent.budget_limit:
        rule_fail("Agent Budget Limit",
                  f"Amount ₹{amount:,.2f} exceeds agent limit ₹{agent.budget_limit:,.2f}")
        return {
            "decision": "REJECTED",
            "rules_evaluated": rules_evaluated,
            "final_reason": f"Transaction amount ₹{amount:,.2f} exceeds agent's budget limit of ₹{agent.budget_limit:,.2f}"
        }
    rule_pass("Agent Budget Limit", f"Amount ₹{amount:,.2f} within agent limit ₹{agent.budget_limit:,.2f}")

    # Rule 6: Available wallet balance
    if wallet_id:
        wallet = db.query(Wallet).filter_by(id=wallet_id).first()
        if wallet and amount > wallet.available_balance:
            rule_fail("Available Balance",
                      f"Insufficient balance: ₹{wallet.available_balance:,.2f} available, need ₹{amount:,.2f}")
            return {
                "decision": "REJECTED",
                "rules_evaluated": rules_evaluated,
                "final_reason": f"Insufficient wallet balance: ₹{wallet.available_balance:,.2f} available"
            }
    rule_pass("Available Balance", "Sufficient funds available")

    # Rule 7: Blocked vendors
    active_policy = db.query(Policy).filter_by(is_active=True).first()
    blocked = active_policy.blocked_vendors if active_policy else []

    if vendor_id and vendor_id in blocked:
        rule_fail("Vendor Restriction", "Vendor is in the blocked vendors list")
        return {
            "decision": "REJECTED",
            "rules_evaluated": rules_evaluated,
            "final_reason": "Vendor is blocked by policy"
        }

    # Also check vendor is_blocked flag
    if vendor_id:
        vendor = db.query(Vendor).filter_by(id=vendor_id).first()
        if vendor and vendor.is_blocked:
            rule_fail("Vendor Restriction", f"Vendor '{vendor.name}' is marked as blocked")
            return {
                "decision": "REJECTED",
                "rules_evaluated": rules_evaluated,
                "final_reason": f"Vendor '{vendor.name}' is flagged as blocked"
            }
    rule_pass("Vendor Restriction", "Vendor is not blocked")

    # Rule 8: Risk score threshold
    risk_threshold = active_policy.risk_auto_reject_threshold if active_policy else 80.0
    if risk_score >= risk_threshold:
        rule_fail("Risk Score",
                  f"Risk score {risk_score:.0f} >= threshold {risk_threshold:.0f}")
        rules_evaluated.append({"rule": "Human Approval Required",
                                 "result": "TRIGGERED",
                                 "reason": "High risk score requires human review"})
        return {
            "decision": "REQUIRES_HUMAN_APPROVAL",
            "rules_evaluated": rules_evaluated,
            "final_reason": f"Risk score {risk_score:.0f} exceeds threshold — human review required"
        }
    rule_pass("Risk Score", f"Risk score {risk_score:.0f} below threshold {risk_threshold:.0f}")

    # Rule 9: Amount threshold for auto-approve
    auto_approve_limit = active_policy.auto_approve_threshold if active_policy else 10000.0
    require_human_above = active_policy.require_human_above if active_policy else 50000.0

    if amount > require_human_above:
        rule_fail("Amount Threshold",
                  f"Amount ₹{amount:,.2f} exceeds human-approval threshold ₹{require_human_above:,.2f}")
        rules_evaluated.append({"rule": "Human Approval Required",
                                 "result": "TRIGGERED",
                                 "reason": "Amount requires human approval"})
        return {
            "decision": "REQUIRES_HUMAN_APPROVAL",
            "rules_evaluated": rules_evaluated,
            "final_reason": f"Amount ₹{amount:,.2f} exceeds auto-approval threshold — human review required"
        }
    rule_pass("Amount Threshold",
              f"Amount ₹{amount:,.2f} within auto-approval limit ₹{require_human_above:,.2f}")

    # Rule 10: All passed
    rules_evaluated.append({"rule": "Final Authorization",
                             "result": "APPROVED",
                             "reason": "All policy rules satisfied"})
    return {
        "decision": "APPROVED",
        "rules_evaluated": rules_evaluated,
        "final_reason": "All policy rules passed — transaction automatically approved"
    }

