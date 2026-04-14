"""
zone_classifier.py
Classifies a geocoded address into a zoning category using
coordinate lookup + LLM-based neighbourhood classification.
"""

import json
import re
from typing import Any, Dict, Optional

import httpx

from zoning_data import (
    ZONE_DATABASE,
    DEFAULT_MOCK_RULES,
    detect_city,
    is_india_coordinate,
    get_zone,
    get_city_zones,
    get_default_zone,
)


ZONE_CLASSIFY_PROMPT = """You are an expert Indian urban planner. Given a real address and its city, classify the location into one of the zoning categories listed below.

City: {city}
Address: {address}
Available zone codes for this city: {zone_codes}

Zone definitions:
- R1 = Low-density residential (independent houses, villas, quiet suburbs)
- R2 = Medium/high-density residential (apartments, group housing, urban neighborhoods)
- C1 = Local commercial (market areas, shop-lined streets, local business districts)
- C2 = Central commercial / CBD (major commercial hubs, IT parks, malls, corporate areas)
- I  = Industrial (factory areas, industrial estates, MIDC, warehousing zones)

Based on the neighborhood characteristics of the given address, return ONLY a JSON object:
{{"zone_code": "CODE"}}

Do NOT explain. Do NOT use markdown. Start with {{ and end with }}.
"""


async def classify_zone(
    address: str,
    lat: float,
    lng: float,
    groq_api_key: str,
) -> Dict[str, Any]:
    """
    Classify a geocoded address into a zoning category.

    Strategy:
    1. Detect city from lat/lng bounding boxes
    2. Ask the LLM to classify the neighbourhood into a zone code
    3. Look up real zoning rules from the database
    4. Fall back to R2/default if classification fails

    Returns the full zone rules dict with zone_info.
    """
    # Step 1: Detect city
    city = detect_city(lat, lng)
    if not city:
        # Try to infer city from address string
        addr_lower = address.lower()
        for c in ("pune", "mumbai", "bangalore", "bengaluru"):
            if c in addr_lower:
                city = "bangalore" if c == "bengaluru" else c
                break

    if not city and is_india_coordinate(lat, lng):
        city = "india"

    if not city and "india" in address.lower():
        city = "india"

    if not city:
        result = dict(DEFAULT_MOCK_RULES)
        result["_detection"] = "unknown_country"
        return result

    # Step 2: Get available zone codes for this city
    zone_codes = get_city_zones(city)
    if not zone_codes:
        # Fall back to pan-India rules if city-specific set is missing.
        city = "india"
        zone_codes = get_city_zones(city)
        if not zone_codes:
            return dict(DEFAULT_MOCK_RULES)

    # Step 3: Ask the LLM to classify the zone
    zone_code = await _llm_classify(address, city, zone_codes, groq_api_key)

    # Step 4: Look up rules
    if zone_code:
        rules = get_zone(city, zone_code)
        if rules:
            result = dict(rules)
            result["_detection"] = "llm_classified"
            return result

    # Fallback to default zone for city
    result = get_default_zone(city)
    result["_detection"] = "default_fallback"
    return result


async def _llm_classify(
    address: str,
    city: str,
    zone_codes: list,
    groq_api_key: str,
) -> Optional[str]:
    """Use Groq LLM to classify address into a zone code."""
    prompt = ZONE_CLASSIFY_PROMPT.format(
        city=city.capitalize(),
        address=address,
        zone_codes=", ".join(zone_codes),
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

            # Parse zone_code from response
            raw = raw.strip()
            raw = re.sub(r"^```(?:json)?\s*", "", raw)
            raw = re.sub(r"\s*```$", "", raw)

            data = json.loads(raw)
            code = data.get("zone_code", "").upper().strip()
            if code in zone_codes:
                return code

    except Exception:
        pass

    return None
