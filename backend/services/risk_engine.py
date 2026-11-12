from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional
import statistics


def assess_risk(db: Session, agent_id: str, vendor_id: Optional[str],
                amount: float, product_id: Optional[str] = None) -> dict:
    from models import Agent, Vendor, Transaction

    score = 0.0
    indicators = []

    # Check 1: Suspicious vendor
    if vendor_id:
        vendor = db.query(Vendor).filter_by(id=vendor_id).first()
        if vendor:
            if vendor.is_suspicious:
                score += 30
                indicators.append({
                    "type": "SUSPICIOUS_VENDOR",
                    "severity": "HIGH",
                    "detail": f"Vendor '{vendor.name}' is flagged as suspicious (trust score: {vendor.trust_score})",
                    "score_added": 30
                })
            if vendor.trust_score < 50:
                score += 15
                indicators.append({
                    "type": "LOW_TRUST_VENDOR",
                    "severity": "MEDIUM",
                    "detail": f"Vendor '{vendor.name}' has low trust score: {vendor.trust_score}",
                    "score_added": 15
                })
            if not vendor.is_suspicious and vendor.trust_score < 70:
                score += 10
                indicators.append({
                    "type": "UNVERIFIED_VENDOR",
                    "severity": "LOW",
                    "detail": f"Vendor '{vendor.name}' is not fully verified",
                    "score_added": 10
                })

    # Check 2: Amount vs agent median
    agent = db.query(Agent).filter_by(id=agent_id).first()
    if agent:
        past_txns = db.query(Transaction).filter_by(
            agent_id=agent_id, status="COMPLETED"
        ).all()
        if past_txns:
            amounts = [t.amount for t in past_txns]
            median_amount = statistics.median(amounts)
            if amount > median_amount * 2:
                score += 20
                indicators.append({
                    "type": "UNUSUAL_AMOUNT",
                    "severity": "MEDIUM",
                    "detail": f"Amount ₹{amount:,.2f} is {amount/median_amount:.1f}x the median ₹{median_amount:,.2f}",
                    "score_added": 20
                })

    # Check 3: Duplicate purchase (same vendor within 24h)
    if vendor_id:
        cutoff = datetime.utcnow() - timedelta(hours=24)
        recent_dupes = db.query(Transaction).filter(
            Transaction.agent_id == agent_id,
            Transaction.vendor_id == vendor_id,
            Transaction.created_at >= cutoff
        ).count()
        if recent_dupes > 0:
            score += 25
            indicators.append({
                "type": "DUPLICATE_PURCHASE",
                "severity": "HIGH",
                "detail": f"Found {recent_dupes} purchase(s) from same vendor in last 24 hours",
                "score_added": 25
            })

    # Check 4: Price vs market price
    if product_id:
        from models import Product
        product = db.query(Product).filter_by(id=product_id).first()
        if product and product.market_price > 0:
            if amount > product.market_price * 1.3:
                score += 20
                overpay_pct = ((amount - product.market_price) / product.market_price) * 100
                indicators.append({
                    "type": "PRICE_MISMATCH",
                    "severity": "HIGH",
                    "detail": f"Price ₹{amount:,.2f} is {overpay_pct:.1f}% above market price ₹{product.market_price:,.2f}",
                    "score_added": 20
                })

    # Check 5: Budget utilization
    if agent:
        if agent.budget_limit > 0:
            utilization = (agent.spent_amount + amount) / agent.budget_limit
            if utilization > 0.9:
                score += 15
                indicators.append({
                    "type": "BUDGET_NEAR_LIMIT",
                    "severity": "MEDIUM",
                    "detail": f"Transaction would bring budget utilization to {utilization*100:.1f}%",
                    "score_added": 15
                })

    # Check 6: Agent flagged
    if agent and agent.status == "FLAGGED":
        score += 40
        indicators.append({
            "type": "FLAGGED_AGENT",
            "severity": "CRITICAL",
            "detail": f"Agent '{agent.name}' is currently flagged for suspicious activity",
            "score_added": 40
        })

    # Cap at 100
    score = min(100.0, score)

    # Categorize
    if score <= 25:
        category = "LOW"
    elif score <= 50:
        category = "MEDIUM"
    elif score <= 75:
        category = "HIGH"
    else:
        category = "CRITICAL"

    return {
        "score": score,
        "category": category,
        "indicators": indicators,
        "total_flags": len(indicators)
    }

