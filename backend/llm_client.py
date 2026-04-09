"""
llm_client.py
Groq-only client for extracting structured architectural parameters.
"""

import json
import re
from typing import Any, Dict

import httpx

DEFAULTS: Dict[str, Any] = {
    "plot_width": 15,
    "plot_length": 20,
    "floors": 2,
    "bedrooms": 3,
    "bathrooms": 2,
    "kitchen": True,
    "building_type": "residential",
    "parking": False,
}

DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"

SYSTEM_PROMPT = (
    "You are an architectural parameter extractor. "
    "Your ONLY job is to output a single raw JSON object.\n\n"
    "CRITICAL RULES:\n"
    "- Output ONLY the JSON object. Nothing before it, nothing after it.\n"
    "- Do NOT use markdown. Do NOT use ```json or ```. Do NOT write any explanation.\n"
    "- Start your response with { and end with }\n\n"
    "Extract parameters from the user request and return this exact structure:\n"
    '{"plot_width":NUMBER,"plot_length":NUMBER,"floors":INTEGER,"bedrooms":INTEGER,'
    '"bathrooms":INTEGER,"kitchen":true_or_false,"building_type":"residential_or_commercial",'
    '"parking":true_or_false}\n\n'
    "Defaults if not mentioned: plot_width=15, plot_length=20, floors=2, bedrooms=3, bathrooms=2, "
    'kitchen=true, building_type="residential", parking=false\n'
    "For commercial buildings set bedrooms=0.\n"
    "All numbers must be plain numbers, never null.\n\n"
    "User request: "
)


def _extract_json(text: str) -> Dict[str, Any]:
    if not text or not text.strip():
        raise ValueError("Groq returned an empty response")

    original = text

    try:
        stripped = text.strip()
        stripped = re.sub(r"^```(?:json)?\s*", "", stripped)
        stripped = re.sub(r"\s*```$", "", stripped)
        stripped = stripped.strip()
        return json.loads(stripped)
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[^{}]*\}", text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass

    for m in re.finditer(r"\{", text):
        start = m.start()
        depth = 0
        for i, ch in enumerate(text[start:]):
            if ch == "{":
                depth += 1
            elif ch == "}":
                depth -= 1
                if depth == 0:
                    candidate = text[start : start + i + 1]
                    try:
                        return json.loads(candidate)
                    except json.JSONDecodeError:
                        break

    kv = _extract_kv_fallback(text)
    if kv:
        return kv

    raise ValueError(f"No JSON found in model response. Raw output: {original[:300]!r}")


def _extract_kv_fallback(text: str) -> Dict[str, Any]:
    result: Dict[str, Any] = {}
    patterns = {
        "plot_width": r"plot_width[\"']?\s*[:=]\s*([0-9.]+)",
        "plot_length": r"plot_length[\"']?\s*[:=]\s*([0-9.]+)",
        "floors": r"floors[\"']?\s*[:=]\s*([0-9]+)",
        "bedrooms": r"bedrooms[\"']?\s*[:=]\s*([0-9]+)",
        "bathrooms": r"bathrooms[\"']?\s*[:=]\s*([0-9]+)",
        "kitchen": r"kitchen[\"']?\s*[:=]\s*(true|false|True|False|1|0)",
        "building_type": r"building_type[\"']?\s*[:=]\s*[\"']?(residential|commercial)[\"']?",
        "parking": r"parking[\"']?\s*[:=]\s*(true|false|True|False|1|0)",
    }

    for key, pattern in patterns.items():
        m = re.search(pattern, text, re.IGNORECASE)
        if not m:
            continue

        val = m.group(1)
        if key in ("kitchen", "parking"):
            result[key] = val.lower() in ("true", "1")
        elif key == "building_type":
            result[key] = val.lower()
        elif key in ("floors", "bedrooms", "bathrooms"):
            result[key] = int(val)
        else:
            result[key] = float(val)

    return result if len(result) >= 3 else {}


def _apply_defaults(data: Dict[str, Any]) -> Dict[str, Any]:
    result = dict(DEFAULTS)

    for key, default in DEFAULTS.items():
        val = data.get(key, default)
        if val is None:
            val = default
        result[key] = val

    result["plot_width"] = max(8, min(100, float(result["plot_width"])))
    result["plot_length"] = max(8, min(100, float(result["plot_length"])))
    result["floors"] = max(1, min(10, int(result["floors"])))
    result["bedrooms"] = max(0, min(10, int(result["bedrooms"])))
    result["bathrooms"] = max(1, min(6, int(result["bathrooms"])))
    result["kitchen"] = bool(result["kitchen"])
    result["parking"] = bool(result["parking"])
    result["building_type"] = str(result["building_type"]).lower()

    if result["building_type"] not in ("residential", "commercial"):
        result["building_type"] = "residential"

    return result


def _extract_content(message_content: Any) -> str:
    if isinstance(message_content, str):
        return message_content

    if isinstance(message_content, list):
        chunks = []
        for part in message_content:
            if isinstance(part, dict) and part.get("type") == "text":
                chunks.append(str(part.get("text", "")))
        return "\n".join(c for c in chunks if c)

    return str(message_content)


async def interpret_prompt(user_prompt: str, groq_api_key: str) -> Dict[str, Any]:
    endpoint = "https://api.groq.com/openai/v1/chat/completions"
    base_payload = {
        "model": DEFAULT_GROQ_MODEL,
        "temperature": 0.0,
        "max_tokens": 256,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You extract architecture parameters and return a single raw JSON object. "
                    "No markdown. No explanations."
                ),
            },
            {"role": "user", "content": SYSTEM_PROMPT + user_prompt},
        ],
    }

    payload = dict(base_payload)
    payload["response_format"] = {"type": "json_object"}

    headers = {
        "Authorization": f"Bearer {groq_api_key}",
        "Content-Type": "application/json",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.post(endpoint, headers=headers, json=payload)
        except httpx.ConnectError as e:
            raise ValueError(
                "Could not reach Groq API (DNS/network error). "
                "Check internet, DNS, VPN/proxy, and firewall settings."
            ) from e
        except httpx.TimeoutException as e:
            raise ValueError(
                "Groq API request timed out. Please retry in a moment."
            ) from e

        # Some models may reject response_format, retry without it.
        if response.status_code in (400, 404, 422):
            try:
                response = await client.post(endpoint, headers=headers, json=base_payload)
            except httpx.ConnectError as e:
                raise ValueError(
                    "Could not reach Groq API (DNS/network error). "
                    "Check internet, DNS, VPN/proxy, and firewall settings."
                ) from e
            except httpx.TimeoutException as e:
                raise ValueError(
                    "Groq API request timed out. Please retry in a moment."
                ) from e

    if response.status_code in (401, 403):
        raise ValueError("Groq API key is invalid or missing permissions")
    if response.status_code != 200:
        raise ValueError(f"Groq request failed ({response.status_code}): {response.text[:300]}")

    body = response.json()
    try:
        raw_text = _extract_content(body["choices"][0]["message"]["content"])
    except (KeyError, IndexError) as e:
        raise ValueError(f"Unexpected Groq response shape: {json.dumps(body)[:300]}") from e

    parsed = _extract_json(raw_text)
    params = _apply_defaults(parsed)

    return {
        "params": params,
        "raw_text": raw_text,
        "interpreted": {
            "plot_size": f"{params['plot_width']}m x {params['plot_length']}m",
            "floors": params["floors"],
            "bedrooms": params["bedrooms"],
            "bathrooms": params["bathrooms"],
            "kitchen": params["kitchen"],
            "building_type": params["building_type"].capitalize(),
            "parking": params["parking"],
        },
        "llm": {
            "provider": "groq",
            "model": DEFAULT_GROQ_MODEL,
        },
    }
