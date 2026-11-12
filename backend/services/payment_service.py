import uuid
import random
import string
from datetime import datetime
from sqlalchemy.orm import Session
from typing import Optional


def process_mock_payment(db: Session, transaction_id: str, amount: float) -> dict:
    """Simulate payment processing with realistic behavior"""
    reference = "PAY-" + "".join(random.choices(string.ascii_uppercase + string.digits, k=12))
    
    # Simulate processing delay (in real app would be async)
    success_rate = 0.97  # 97% success rate for mock
    success = random.random() < success_rate

    return {
        "payment_method": "MOCK",
        "reference": reference,
        "status": "SUCCESS" if success else "FAILED",
        "amount": amount,
        "currency": "INR",
        "timestamp": datetime.utcnow().isoformat(),
        "processor_response": {
            "code": "00" if success else "51",
            "message": "Payment Approved" if success else "Payment Declined - Simulation",
            "authorization_code": reference[:6] if success else None
        },
        "metadata": {
            "mode": "MOCK_PAYMENT",
            "disclaimer": "This is a simulated payment. No real money was transferred.",
            "simulation_id": str(uuid.uuid4())
        }
    }


def process_paypal_payment(db: Session, transaction_id: str, amount: float) -> dict:
    """Optional PayPal Sandbox payment processing"""
    import os
    import httpx

    client_id = os.getenv("PAYPAL_CLIENT_ID", "")
    client_secret = os.getenv("PAYPAL_CLIENT_SECRET", "")
    mode = os.getenv("PAYPAL_MODE", "sandbox")

    if not client_id or not client_secret:
        return {
            "error": "PayPal credentials not configured",
            "fallback": "Use Mock Payment mode instead"
        }

    base_url = "https://api-m.sandbox.paypal.com" if mode == "sandbox" else "https://api-m.paypal.com"

    try:
        # Get access token
        with httpx.Client() as client:
            token_response = client.post(
                f"{base_url}/v1/oauth2/token",
                auth=(client_id, client_secret),
                data={"grant_type": "client_credentials"}
            )
            token_data = token_response.json()
            access_token = token_data.get("access_token")

            if not access_token:
                raise Exception("Failed to get PayPal access token")

            # Create order
            headers = {
                "Authorization": f"Bearer {access_token}",
                "Content-Type": "application/json"
            }
            order_data = {
                "intent": "CAPTURE",
                "purchase_units": [{
                    "amount": {
                        "currency_code": "USD",
                        "value": str(round(amount / 83.0, 2))  # INR to USD approx
                    },
                    "description": f"AgentVault Transaction {transaction_id}"
                }]
            }
            order_response = client.post(
                f"{base_url}/v2/checkout/orders",
                headers=headers,
                json=order_data
            )
            order = order_response.json()

            return {
                "payment_method": "PAYPAL_SANDBOX",
                "reference": order.get("id", ""),
                "status": "PENDING",
                "amount": amount,
                "currency": "INR",
                "paypal_order_id": order.get("id"),
                "approval_url": next(
                    (link["href"] for link in order.get("links", []) if link["rel"] == "approve"),
                    None
                ),
                "metadata": {
                    "mode": "PAYPAL_SANDBOX",
                    "disclaimer": "This is a PayPal Sandbox transaction. No real money was transferred.",
                    "order_status": order.get("status")
                }
            }
    except Exception as e:
        return {
            "error": str(e),
            "payment_method": "PAYPAL_SANDBOX",
            "status": "FAILED",
            "amount": amount
        }

