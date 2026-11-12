import os
import json
from typing import Dict, Any
from sqlalchemy.orm import Session

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def run_auditor_agent(db: Session, purchase_request_id: str) -> Dict[str, Any]:
    """Independent auditor agent that examines purchase requests"""
    from models import PurchaseRequest, Vendor, Product, Agent, Transaction

    pr = db.query(PurchaseRequest).filter_by(id=purchase_request_id).first()
    if not pr:
        return {"error": "Purchase request not found"}

    agent = db.query(Agent).filter_by(id=pr.agent_id).first()
    vendor = db.query(Vendor).filter_by(id=pr.vendor_id).first() if pr.vendor_id else None
    product = db.query(Product).filter_by(id=pr.product_id).first() if pr.product_id else None

    context = {
        "purchase_request_id": purchase_request_id,
        "amount": pr.amount,
        "instruction": pr.instruction,
        "agent_name": agent.name if agent else "Unknown",
        "agent_role": agent.role if agent else "Unknown",
        "agent_budget_limit": agent.budget_limit if agent else 0,
        "agent_spent": agent.spent_amount if agent else 0,
        "vendor_name": vendor.name if vendor else "Unknown",
        "vendor_trust_score": vendor.trust_score if vendor else 0,
        "vendor_is_suspicious": vendor.is_suspicious if vendor else False,
        "product_name": product.name if product else "Unknown",
        "product_price": product.price if product else pr.amount,
        "product_market_price": product.market_price if product else 0,
    }

    api_key = os.getenv("GROQ_API_KEY", "")

    if DEMO_MODE or not api_key or api_key == "your_groq_api_key_here":
        return _demo_auditor(context)

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        prompt = f"""You are an independent AI auditor for financial transactions. Examine this purchase request:

{json.dumps(context, indent=2)}

Provide an independent audit assessment. Consider:
1. Vendor reliability (trust score, suspicious flags)
2. Price accuracy (vs market price)
3. Budget compliance (vs agent limits)
4. Suspicious indicators
5. Overall risk

Respond ONLY with valid JSON:
{{
  "risk_score": <0-100>,
  "recommendation": "<APPROVE_RECOMMENDED|REQUIRE_HUMAN_REVIEW|REJECT_RECOMMENDED>",
  "explanation": "<detailed audit findings>",
  "evidence": [
    {{"point": "<finding>", "severity": "<LOW|MEDIUM|HIGH|CRITICAL>", "detail": "<explanation>"}}
  ],
  "red_flags": ["<flag1>", "<flag2>"],
  "vendor_assessment": "<assessment>",
  "price_assessment": "<assessment>",
  "budget_compliance": true/false
}}"""

        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3
        )
        result = json.loads(response.choices[0].message.content)
        result["_mode"] = "GROQ_AI"
        return result
    except Exception as e:
        result = _demo_auditor(context)
        result["_error"] = str(e)
        return result


def _demo_auditor(context: Dict) -> Dict[str, Any]:
    """Demo AI Mode: rule-based audit analysis"""
    risk_score = 0.0
    evidence = []
    red_flags = []

    # Check vendor
    if context.get("vendor_is_suspicious"):
        risk_score += 35
        red_flags.append("Vendor is flagged as suspicious in the system")
        evidence.append({
            "point": "Suspicious Vendor Detected",
            "severity": "HIGH",
            "detail": f"Vendor '{context.get('vendor_name')}' is marked as suspicious with trust score {context.get('vendor_trust_score')}"
        })
    elif context.get("vendor_trust_score", 100) < 60:
        risk_score += 20
        evidence.append({
            "point": "Low Vendor Trust Score",
            "severity": "MEDIUM",
            "detail": f"Vendor trust score of {context.get('vendor_trust_score')} is below acceptable threshold of 60"
        })
    else:
        evidence.append({
            "point": "Vendor Reliability Check",
            "severity": "LOW",
            "detail": f"Vendor '{context.get('vendor_name')}' has acceptable trust score: {context.get('vendor_trust_score')}"
        })

    # Check price vs market
    market_price = context.get("product_market_price", 0)
    amount = context.get("amount", 0)
    if market_price > 0:
        ratio = amount / market_price
        if ratio > 1.3:
            risk_score += 25
            red_flags.append(f"Price is {((ratio-1)*100):.1f}% above market rate")
            evidence.append({
                "point": "Price Anomaly Detected",
                "severity": "HIGH",
                "detail": f"Request price ₹{amount:,.2f} is {((ratio-1)*100):.1f}% above market price ₹{market_price:,.2f}"
            })
        elif ratio < 0.7:
            risk_score += 15
            evidence.append({
                "point": "Unusually Low Price",
                "severity": "MEDIUM",
                "detail": f"Price ₹{amount:,.2f} is significantly below market price — verify product authenticity"
            })
        else:
            evidence.append({
                "point": "Price Verification",
                "severity": "LOW",
                "detail": f"Price ₹{amount:,.2f} is within acceptable range of market price ₹{market_price:,.2f}"
            })

    # Budget compliance
    budget_limit = context.get("agent_budget_limit", 0)
    budget_compliant = amount <= budget_limit
    if not budget_compliant:
        risk_score += 30
        red_flags.append("Transaction exceeds agent budget limit")
        evidence.append({
            "point": "Budget Violation",
            "severity": "CRITICAL",
            "detail": f"Amount ₹{amount:,.2f} exceeds agent budget limit ₹{budget_limit:,.2f}"
        })
    else:
        spent = context.get("agent_spent", 0)
        remaining = budget_limit - spent
        utilization = ((spent + amount) / budget_limit * 100) if budget_limit > 0 else 0
        evidence.append({
            "point": "Budget Compliance",
            "severity": "LOW",
            "detail": f"Transaction is within budget. Would utilize {utilization:.1f}% of agent's budget limit."
        })

    # Risk score cap
    risk_score = min(100.0, risk_score)

    # Recommendation logic
    if risk_score >= 70 or len(red_flags) >= 2:
        recommendation = "REJECT_RECOMMENDED"
    elif risk_score >= 40 or len(red_flags) >= 1:
        recommendation = "REQUIRE_HUMAN_REVIEW"
    else:
        recommendation = "APPROVE_RECOMMENDED"

    explanation = (
        f"Independent audit of purchase request for ₹{amount:,.2f} from vendor "
        f"'{context.get('vendor_name')}'. "
        f"Risk score: {risk_score:.0f}/100. "
        f"Found {len(red_flags)} red flag(s). "
        f"Vendor trust score: {context.get('vendor_trust_score', 'N/A')}. "
        f"Budget compliance: {'Yes' if budget_compliant else 'No'}. "
        f"Recommendation: {recommendation.replace('_', ' ')}."
    )

    return {
        "risk_score": risk_score,
        "recommendation": recommendation,
        "explanation": explanation,
        "evidence": evidence,
        "red_flags": red_flags,
        "vendor_assessment": (
            "SUSPICIOUS - Requires manual verification" if context.get("vendor_is_suspicious")
            else f"ACCEPTABLE - Trust score {context.get('vendor_trust_score', 'N/A')}"
        ),
        "price_assessment": (
            "ANOMALOUS" if market_price > 0 and amount > market_price * 1.3
            else "ACCEPTABLE"
        ),
        "budget_compliance": budget_compliant,
        "_mode": "DEMO_AI"
    }

