"""
zone_classifier.py
Classifies a geocoded address into a zoning category.

Strategy:
1. Detect city from address string using alias matching
2. For top-10 cities: use Groq LLM to classify zone code within that city,
   then load hardcoded rules → detection_type = "hardcoded"
3. For other Indian cities: use Groq LLM to infer constraints
   → detection_type = "ai_estimated"
4. For unrecognized: use default mock rules
   → detection_type = "default"
"""

import json
import re
from typing import Any, Dict, Optional, Tuple

import httpx

from zoning_data import (
    CITY_ZONES,
    DEFAULT_MOCK_RULES,
    detect_city_from_address,
    is_indian_address,
    get_city_zone_codes,
    get_zone_rules,
    get_default_zone_for_city,
)


# ---------------------------------------------------------------------------
# Prompt for classifying zone within a detected top-10 city
# ---------------------------------------------------------------------------
ZONE_CLASSIFY_PROMPT = """You are an expert Indian urban planner. Given a real address and its city, classify the location into one of the zoning categories listed below.

City: {city}
Address: {address}
Available zone codes for this city: {zone_codes}

Zone definitions:
{zone_definitions}

Based on the neighborhood characteristics of the given address, return ONLY a JSON object:
{{"zone_code": "CODE"}}

Do NOT explain. Do NOT use markdown. Start with {{ and end with }}."""


# ---------------------------------------------------------------------------
# Prompt for AI-estimating zoning constraints for non-top-10 Indian cities
# ---------------------------------------------------------------------------
AI_ESTIMATE_PROMPT = """You are an expert Indian urban planner. Given a city address in India, estimate the most likely zoning constraints based on Indian building bye-laws and typical municipal regulations.

Address: {address}
City: {city_name}

Return a JSON object with realistic estimated zoning constraints:
{{"zone_code": "R2", "zone_name": "Estimated Residential", "city": "{city_name}", "authority": "Local Municipal Authority", "source": "AI-estimated based on Indian building bye-laws", "max_fsi": NUMBER, "max_floors": INTEGER, "max_height_m": NUMBER, "min_setback_front_m": NUMBER, "min_setback_side_m": NUMBER, "min_setback_rear_m": NUMBER, "max_coverage_pct": NUMBER, "permitted_uses": ["residential", "mixed"]}}

Rules:
- max_fsi typically 1.0-2.5 for Indian cities
- max_height_m typically 10-24m
- max_floors typically 3-8
- Setbacks typically 1.5-6m
- max_coverage_pct typically 40-60
- Be conservative — underestimate rather than overestimate

Start with {{ and end with }}. No markdown. No explanation."""


def _get_zone_definitions(city: str) -> str:
    """Build human-readable zone definitions for LLM prompt."""
    city_data = CITY_ZONES.get(city, {})
    lines = []
    for code, data in city_data.items():
        name = data.get("zone_name", code)
        uses = ", ".join(data.get("permitted_uses", []))
        fsi = data.get("max_fsi", "?")
        lines.append(f"- {code} = {name} (FSI: {fsi}, uses: {uses})")
    return "\n".join(lines) if lines else "R1 = Low density, R2 = Medium density, C1 = Commercial"


async def classify_zone(
    address: str,
    lat: float,
    lng: float,
    groq_api_key: str,
) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Classify address into zoning category.

    Returns a tuple of:
    - zone_rules: dict with all zoning rule fields
    - detection_info: dict with type, city, message for frontend display
    """
    # Step 1: Try to detect a top-10 city from the address string
    detected_city = detect_city_from_address(address)

    if detected_city:
        # Top-10 city detected — use hardcoded data
        zone_codes = get_city_zone_codes(detected_city)

        # Use LLM to classify which zone within the city
        zone_code = await _llm_classify_zone(
            address, detected_city, zone_codes, groq_api_key
        )

        if zone_code:
            rules = get_zone_rules(detected_city, zone_code)
            if rules:
                detection_info = {
                    "type": "hardcoded",
                    "city": detected_city,
                    "message": f"City detected: {detected_city} — real zoning data loaded",
                }
                return dict(rules), detection_info

        # Fallback to default zone for this city
        rules = get_default_zone_for_city(detected_city)
        detection_info = {
            "type": "hardcoded",
            "city": detected_city,
            "message": f"City detected: {detected_city} — real zoning data loaded",
        }
        return rules, detection_info

    # Step 2: Check if it's an Indian address (but not a top-10 city)
    if is_indian_address(address):
        # Try to extract a city name from the address for display
        city_name = _extract_city_name(address)

        # Use Groq LLM to estimate zoning constraints
        estimated_rules = await _llm_estimate_zoning(
            address, city_name, groq_api_key
        )

        if estimated_rules:
            detection_info = {
                "type": "ai_estimated",
                "city": city_name,
                "message": f"City detected: {city_name} — using AI-estimated constraints",
            }
            return estimated_rules, detection_info

        # Fallback if LLM estimation fails
        rules = dict(DEFAULT_MOCK_RULES)
        rules["city"] = city_name
        detection_info = {
            "type": "ai_estimated",
            "city": city_name,
            "message": f"City detected: {city_name} — using AI-estimated constraints",
        }
        return rules, detection_info

    # Step 3: Unrecognized address — default rules
    detection_info = {
        "type": "default",
        "city": "Unknown",
        "message": "Address set — using default zoning rules",
    }
    return dict(DEFAULT_MOCK_RULES), detection_info


def _extract_city_name(address: str) -> str:
    """Extract the most likely city name from a Nominatim display_name string."""
    parts = [p.strip() for p in address.split(",")]

    # Nominatim display_name format: "Suburb, City, District, State, Pincode, Country"
    # Try to find a part that looks like a city name (not a number, not "India", not a state)
    skip_terms = {
        "india", "maharashtra", "karnataka", "tamil nadu", "telangana",
        "andhra pradesh", "gujarat", "rajasthan", "uttar pradesh",
        "madhya pradesh", "west bengal", "kerala", "haryana",
        "punjab", "bihar", "odisha", "jharkhand", "chhattisgarh",
        "uttarakhand", "himachal pradesh", "goa", "assam",
    }

    for part in parts[1:4]:  # Check 2nd to 4th parts (skip suburb)
        lower = part.lower().strip()
        if lower in skip_terms:
            continue
        if lower.isdigit() or len(lower) < 2:
            continue
        # Skip if it looks like a pincode
        if re.match(r"^\d{6}$", lower):
            continue
        return part.strip()

    # Fallback to first non-trivial part
    if len(parts) >= 2:
        return parts[1].strip()
    return "Unknown"


async def _llm_classify_zone(
    address: str,
    city: str,
    zone_codes: list,
    groq_api_key: str,
) -> Optional[str]:
    """Use Groq LLM to classify address into a zone code within a known city."""
    zone_definitions = _get_zone_definitions(city)
    prompt = ZONE_CLASSIFY_PROMPT.format(
        city=city,
        address=address,
        zone_codes=", ".join(zone_codes),
        zone_definitions=zone_definitions,
    )

    endpoint = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": "llama-3.3-70b-versatile",
        "temperature": 0.0,
        "max_tokens": 64,
        "messages": [
            {
                "role": "system",
                "content": "You classify Indian addresses into zoning categories. Return only JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(endpoint, headers=headers, json=payload)

            # Retry without response_format if rejected
            if response.status_code in (400, 422):
                del payload["response_format"]
                response = await client.post(endpoint, headers=headers, json=payload)

            if response.status_code != 200:
                return None

            body = response.json()
            raw = body["choices"][0]["message"]["content"]

            raw = raw.strip()
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

            data = json.loads(raw)
            code = str(data.get("zone_code", "")).strip()

            # Check exact match first
            if code in zone_codes:
                return code

            # Try case-insensitive match
            for zc in zone_codes:
                if zc.lower() == code.lower():
                    return zc

    except Exception as e:
        print(f"[zone_classifier] LLM classify error: {e}")

    return None


async def _llm_estimate_zoning(
    address: str,
    city_name: str,
    groq_api_key: str,
) -> Optional[Dict[str, Any]]:
    """Use Groq LLM to estimate zoning constraints for a non-top-10 Indian city."""
    prompt = AI_ESTIMATE_PROMPT.format(address=address, city_name=city_name)

    endpoint = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": "llama-3.3-70b-versatile",
        "temperature": 0.2,
        "max_tokens": 512,
        "messages": [
            {
                "role": "system",
                "content": "You estimate zoning constraints for Indian cities. Return only JSON.",
            },
            {"role": "user", "content": prompt},
        ],
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(endpoint, headers=headers, json=payload)

            if response.status_code in (400, 422):
                del payload["response_format"]
                response = await client.post(endpoint, headers=headers, json=payload)

            if response.status_code != 200:
                return None

            body = response.json()
            raw = body["choices"][0]["message"]["content"]

            raw = raw.strip()
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

            data = json.loads(raw)

            # Validate required fields exist
            required = ["max_fsi", "max_floors", "max_height_m"]
            if not all(k in data for k in required):
                return None

            # Ensure all fields are present with defaults
            result = dict(DEFAULT_MOCK_RULES)
            result.update(data)
            result["city"] = city_name
            result["source"] = "AI-estimated based on Indian building bye-laws"

            # Clamp values to reasonable ranges
            result["max_fsi"] = max(0.5, min(5.0, float(result.get("max_fsi", 1.5))))
            result["max_floors"] = max(1, min(20, int(result.get("max_floors", 4))))
            result["max_height_m"] = max(6, min(70, float(result.get("max_height_m", 15))))
            result["min_setback_front_m"] = max(1, min(10, float(result.get("min_setback_front_m", 3))))
            result["min_setback_side_m"] = max(0.5, min(8, float(result.get("min_setback_side_m", 2))))
            result["min_setback_rear_m"] = max(1, min(10, float(result.get("min_setback_rear_m", 3))))
            result["max_coverage_pct"] = max(20, min(80, float(result.get("max_coverage_pct", 50))))

            return result

    except Exception as e:
        print(f"[zone_classifier] LLM estimate error: {e}")

    return None
