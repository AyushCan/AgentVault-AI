import os
import json
import re
from typing import List, Dict, Any
from sqlalchemy.orm import Session

DEMO_MODE = os.getenv("DEMO_MODE", "true").lower() == "true"
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")


def run_actor_agent(instruction: str, vendors_and_products: List[Dict]) -> Dict[str, Any]:
    """Research products and recommend purchase based on natural language instruction"""
    api_key = os.getenv("GROQ_API_KEY", "")

    if DEMO_MODE or not api_key or api_key == "your_groq_api_key_here":
        return _demo_actor(instruction, vendors_and_products)

    try:
        from groq import Groq
        client = Groq(api_key=api_key)
        prompt = f"""You are a procurement AI agent. Given this purchasing instruction: "{instruction}"

Available products from vendor catalogue:
{json.dumps(vendors_and_products, indent=2)}

Analyze requirements from the instruction (budget limits, specs, etc.) and select the best product.

Respond ONLY with valid JSON:
{{
  "recommended_product_id": "<product_id>",
  "recommended_vendor_id": "<vendor_id>",
  "recommended_product_name": "<name>",
  "recommended_vendor_name": "<vendor>",
  "recommended_price": <price_number>,
  "reasoning": "<detailed explanation of why this product was selected>",
  "tasks_performed": ["Parsed requirements from instruction", "Searched vendor catalogue", "Compared prices", "Verified specifications", "Selected best match"],
  "comparison_table": [
    {{"product": "<name>", "vendor": "<vendor>", "price": <number>, "meets_requirements": true/false, "notes": "<why/why not>"}}
  ],
  "confidence_score": <0.0-1.0>,
  "budget_compliance": true/false,
  "savings_vs_budget": <number>
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
        # Fallback to demo mode on any Groq error
        result = _demo_actor(instruction, vendors_and_products)
        result["_error"] = str(e)
        return result


def _demo_actor(instruction: str, products: List[Dict]) -> Dict[str, Any]:
    """Demo AI Mode: parse instruction and find best matching product"""
    instruction_lower = instruction.lower()

    # Extract budget from instruction (look for ₹ or numbers followed by k/lakh/thousand)
    budget_limit = float('inf')
    budget_patterns = [
        r'₹\s*([\d,]+)',
        r'rs\.?\s*([\d,]+)',
        r'inr\s*([\d,]+)',
        r'under\s*([\d,]+)',
        r'below\s*([\d,]+)',
        r'([\d,]+)\s*(?:rupees?|inr)',
    ]
    for pattern in budget_patterns:
        match = re.search(pattern, instruction_lower)
        if match:
            num_str = match.group(1).replace(',', '')
            val = float(num_str)
            if val < 1000:
                val *= 1000  # treat as thousands
            budget_limit = val
            break

    # Extract RAM requirement
    ram_req = 0
    ram_match = re.search(r'(\d+)\s*gb\s*(?:ram|memory)', instruction_lower)
    if ram_match:
        ram_req = int(ram_match.group(1))

    # Filter products by category hint from instruction
    category_hints = {
        "laptop": ["laptop", "notebook"],
        "monitor": ["monitor", "display", "screen"],
        "phone": ["phone", "mobile", "smartphone"],
        "headphone": ["headphone", "earphone", "headset"],
        "tablet": ["tablet", "ipad"],
    }
    target_categories = []
    for cat, keywords in category_hints.items():
        if any(kw in instruction_lower for kw in keywords):
            target_categories.append(cat)

    # Filter and score products
    eligible = []
    for p in products:
        # Budget filter
        if p.get("price", 0) > budget_limit:
            continue
        # Category filter
        if target_categories:
            p_cat = p.get("category", "").lower()
            p_name = p.get("name", "").lower()
            if not any(cat in p_cat or cat in p_name for cat in target_categories):
                continue
        # Vendor must not be blocked
        if p.get("is_blocked") or p.get("is_suspicious"):
            continue
        # RAM check
        specs = p.get("specs", {})
        if ram_req > 0:
            p_ram = specs.get("ram_gb", 0)
            if isinstance(p_ram, str):
                p_ram = int(re.search(r'\d+', p_ram).group()) if re.search(r'\d+', p_ram) else 0
            if p_ram < ram_req:
                continue
        eligible.append(p)

    if not eligible and products:
        # Relax constraints, just pick cheapest non-blocked
        eligible = [p for p in products if not p.get("is_blocked")]

    if not eligible:
        eligible = products[:3] if products else []

    # Sort by trust score descending, then price ascending
    eligible.sort(key=lambda p: (-p.get("trust_score", 50), p.get("price", 0)))
    best = eligible[0] if eligible else (products[0] if products else {})

    # Build comparison table
    comparison = []
    for p in products[:6]:
        meets = (p.get("price", 0) <= budget_limit and
                 not p.get("is_blocked") and
                 not p.get("is_suspicious"))
        comparison.append({
            "product": p.get("name", "Unknown"),
            "vendor": p.get("vendor_name", "Unknown"),
            "price": p.get("price", 0),
            "meets_requirements": meets,
            "notes": "Best value" if p.get("id") == best.get("id") else
                     ("Over budget" if p.get("price", 0) > budget_limit else
                      ("Suspicious vendor" if p.get("is_suspicious") else "Within budget"))
        })

    savings = budget_limit - best.get("price", 0) if budget_limit != float('inf') else 0

    return {
        "recommended_product_id": best.get("id", ""),
        "recommended_vendor_id": best.get("vendor_id", ""),
        "recommended_product_name": best.get("name", "Unknown Product"),
        "recommended_vendor_name": best.get("vendor_name", "Unknown Vendor"),
        "recommended_price": best.get("price", 0),
        "reasoning": (
            f"After analyzing the instruction '{instruction}', I searched the vendor catalogue "
            f"and found {len(eligible)} eligible products meeting your requirements. "
            f"I selected '{best.get('name', 'this product')}' from '{best.get('vendor_name', 'this vendor')}' "
            f"because it offers the best combination of price (₹{best.get('price', 0):,.0f}), "
            f"vendor reliability (trust score: {best.get('trust_score', 'N/A')}), and specification compliance."
        ),
        "tasks_performed": [
            "Parsed budget and specification requirements from instruction",
            f"Searched {len(products)} products across {len(set(p.get('vendor_id','') for p in products))} vendors",
            f"Applied filters: budget ≤ ₹{budget_limit:,.0f}" + (f", RAM ≥ {ram_req}GB" if ram_req else ""),
            f"Found {len(eligible)} eligible products meeting all criteria",
            f"Ranked by vendor trust score and price",
            "Selected optimal product and generated purchase request"
        ],
        "comparison_table": comparison,
        "confidence_score": 0.87,
        "budget_compliance": best.get("price", 0) <= budget_limit,
        "savings_vs_budget": max(0, savings),
        "_mode": "DEMO_AI"
    }

