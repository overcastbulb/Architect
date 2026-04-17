"""
reasoning_client.py
Generates plain-English AI reasoning for each zoning rule check
using a second Groq LLM call.
"""

import json
import re
from typing import Any, Dict, Optional

import httpx

DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"

REASONING_SYSTEM_PROMPT = (
    "You are an expert architectural zoning advisor. "
    "You explain zoning compliance results in clear, concise plain English. "
    "Your tone is professional but approachable — like a knowledgeable colleague. "
    "Output ONLY a JSON object. No markdown, no explanation outside the JSON."
)

REASONING_USER_PROMPT_TEMPLATE = """Given the following building design and zoning compliance results, provide:
1. A 1-2 sentence explanation for EACH rule check result explaining WHY it passed, warned, or violated, and what the designer could do about it.
2. A 2-3 sentence overall summary verdict on the entire design.

Building Parameters:
- Plot: {plot_width}m x {plot_length}m (area: {plot_area:.0f} m²)
- Building footprint: {building_width}m x {building_length}m
- Floors: {floors}
- Building height: {building_height}m
- FSI (actual): {fsi}
- Coverage: {coverage}%
- Building type: {building_type}

Zone Information:
- Zone: {zone_code} — {zone_name}
- City: {city}
- Authority: {authority}

Zoning Rule Results:
{rules_text}

Return this exact JSON structure:
{{"rule_reasoning": {{{rules_keys}}}, "summary": "Overall 2-3 sentence verdict..."}}

Rules for writing:
- Each rule_reasoning value must be 1-2 sentences max.
- For OK results: mention the headroom/margin available.
- For WARNING results: mention how close to the limit and suggest a minor fix.
- For VIOLATION results: explain the excess and suggest a specific correction (e.g., "reduce by 1 floor").
- The summary should assess overall feasibility and mention any critical issues.
- Be specific with numbers. Reference actual values and limits.
- Start with {{ and end with }}. No markdown. No extra text."""


def _build_prompt(
    zoning: Dict[str, Any],
    params: Dict[str, Any],
) -> str:
    """Build the reasoning prompt from zoning results and building params."""
    rules = zoning.get("rules", [])
    zone_info = zoning.get("zone_info") or {}

    plot_width = params.get("plot_width", 15)
    plot_length = params.get("plot_length", 20)
    plot_area = plot_width * plot_length

    rules_text_lines = []
    rules_keys_parts = []
    for rule in rules:
        name = rule.get("rule_name", "Unknown")
        status = rule.get("status", "OK")
        message = rule.get("message", "")
        limit = rule.get("limit", "")
        actual = rule.get("actual", "")
        unit = rule.get("unit", "")
        rules_text_lines.append(
            f"- {name}: {status} — {message} (actual: {actual}{unit}, limit: {limit}{unit})"
        )
        rules_keys_parts.append(f'"{name}": "explanation here"')

    rules_text = "\n".join(rules_text_lines) if rules_text_lines else "No rules available."
    rules_keys = ", ".join(rules_keys_parts) if rules_keys_parts else '"rule": "explanation"'

    return REASONING_USER_PROMPT_TEMPLATE.format(
        plot_width=plot_width,
        plot_length=plot_length,
        plot_area=plot_area,
        building_width=0,
        building_length=0,
        floors=params.get("floors", 2),
        building_height=zoning.get("building_height", 0),
        fsi=zoning.get("fsi", 0),
        coverage=zoning.get("coverage", 0),
        building_type=params.get("building_type", "residential"),
        zone_code=zone_info.get("zone_code", "Default"),
        zone_name=zone_info.get("zone_name", "Default Zone"),
        city=zone_info.get("city", "Unknown"),
        authority=zone_info.get("authority", "Unknown"),
        rules_text=rules_text,
        rules_keys=rules_keys,
    )


def _parse_reasoning(raw_text: str, rule_names: list) -> Dict[str, Any]:
    """Parse reasoning JSON from LLM response."""
    if not raw_text or not raw_text.strip():
        return _empty_reasoning()

    text = raw_text.strip()
    # Strip markdown code fences if present
    text = re.sub(r"^```(?:json)?\s*", "", text)
    text = re.sub(r"\s*```$", "", text)
    text = text.strip()

    try:
        data = json.loads(text)
    except json.JSONDecodeError:
        # Try to find JSON object in text
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            try:
                data = json.loads(match.group())
            except json.JSONDecodeError:
                return _empty_reasoning()
        else:
            return _empty_reasoning()

    rule_reasoning = data.get("rule_reasoning", {})
    summary = data.get("summary", "")

    # Ensure all rule names have entries
    if isinstance(rule_reasoning, dict):
        for name in rule_names:
            if name not in rule_reasoning:
                rule_reasoning[name] = ""
    else:
        rule_reasoning = {name: "" for name in rule_names}

    return {
        "rule_reasoning": rule_reasoning,
        "summary": str(summary) if summary else "",
    }


def _empty_reasoning() -> Dict[str, Any]:
    """Return empty reasoning as graceful fallback."""
    return {
        "rule_reasoning": {},
        "summary": "",
    }


async def generate_reasoning(
    zoning: Dict[str, Any],
    params: Dict[str, Any],
    layout: Dict[str, Any],
    groq_api_key: str,
) -> Dict[str, Any]:
    """
    Generate AI reasoning for zoning compliance results.

    Makes a second Groq LLM call to explain each rule check in plain English.
    On any failure, returns empty reasoning (graceful degradation).
    """
    rules = zoning.get("rules", [])
    rule_names = [r.get("rule_name", "") for r in rules]

    if not rules:
        return _empty_reasoning()

    # Inject layout dimensions into prompt building
    building_width = layout.get("building_width", 0)
    building_length = layout.get("building_length", 0)

    # Build prompt
    prompt_text = _build_prompt(zoning, params)
    # Fix building dimensions placeholder in prompt
    prompt_text = prompt_text.replace(
        "Building footprint: 0m x 0m",
        f"Building footprint: {building_width}m x {building_length}m",
    )

    endpoint = "https://api.groq.com/openai/v1/chat/completions"
    payload = {
        "model": DEFAULT_GROQ_MODEL,
        "temperature": 0.3,
        "max_tokens": 1024,
        "messages": [
            {"role": "system", "content": REASONING_SYSTEM_PROMPT},
            {"role": "user", "content": prompt_text},
        ],
        "response_format": {"type": "json_object"},
    }

    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(endpoint, headers=headers, json=payload)

            # Retry without response_format if rejected
            if response.status_code in (400, 422):
                del payload["response_format"]
                response = await client.post(endpoint, headers=headers, json=payload)

            if response.status_code != 200:
                print(f"[reasoning_client] Groq returned {response.status_code}: {response.text[:200]}")
                return _empty_reasoning()

            body = response.json()
            raw_text = body["choices"][0]["message"]["content"]
            return _parse_reasoning(raw_text, rule_names)

    except Exception as e:
        print(f"[reasoning_client] Error generating reasoning: {e}")
        return _empty_reasoning()
