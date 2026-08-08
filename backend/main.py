from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
from typing import Optional
import os
from pathlib import Path
from dotenv import load_dotenv

# Load keys from project root .env file
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from layout_generator import generate_layout
from zoning_checker import check_zoning
from llm_client import interpret_prompt
from zone_classifier import classify_zone
from reasoning_client import generate_reasoning

app = FastAPI(title="AI Architecture API", version="3.0.0")


# ---------------------------------------------------------------------------
# Error sanitization — maps raw internal errors to clean user-facing messages
# ---------------------------------------------------------------------------
def _clean_error(message: str) -> str:
    """Map internal error strings to friendly user-facing messages."""
    m = message.lower()
    if "timed out" in m or "timeout" in m:
        return "The AI service is taking too long. Please try again in a moment."
    if "could not reach" in m or "dns" in m or "network" in m:
        return "Could not connect to the AI service. Please check your connection and try again."
    if "key is not configured" in m or "configuration error" in m:
        return "Server configuration error. Please contact support."
    if "invalid or missing" in m or "401" in m or "403" in m:
        return "Server configuration error. Please contact support."
    if "could not understand" in m or "please rephrase" in m or "no json" in m:
        return "Could not understand the building description. Please rephrase and try again."
    if "prompt cannot be empty" in m or "prompt is empty" in m:
        return "Please enter a building description."
    # Generic fallback — never expose raw API text
    return "Something went wrong. Please try again."


allowed_origins = [origin.strip() for origin in os.getenv("ALLOWED_ORIGINS", "*").split(",") if origin.strip()]
if not allowed_origins:
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class BuildingInput(BaseModel):
    plot_width: float
    plot_length: float
    floors: int
    bedrooms: int
    bathrooms: int
    kitchen: bool


class PromptInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    prompt: str


class GenerateInput(BaseModel):
    """Unified input for the combined generate endpoint."""
    prompt: str
    address: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None


@app.get("/")
def root():
    return {"status": "AI Architecture API v3 running"}


@app.post("/api/interpret")
async def interpret(data: PromptInput):
    """Legacy endpoint — interprets prompt only."""
    if not data.prompt.strip():
        raise HTTPException(status_code=400, detail="Please enter a building description.")
    server_groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not server_groq_api_key:
        raise HTTPException(
            status_code=500,
            detail="Server configuration error. Please contact support.",
        )

    try:
        result = await interpret_prompt(
            user_prompt=data.prompt,
            groq_api_key=server_groq_api_key,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=_clean_error(str(e)))
    return result


@app.post("/generate-layout")
def generate(data: BuildingInput):
    """Legacy endpoint — generates layout from manual params."""
    if data.plot_width <= 0 or data.plot_length <= 0:
        raise HTTPException(status_code=400, detail="Plot dimensions must be positive.")

    layout = generate_layout(
        plot_width=data.plot_width,
        plot_length=data.plot_length,
        floors=data.floors,
        bedrooms=data.bedrooms,
        bathrooms=data.bathrooms,
        kitchen=data.kitchen,
    )

    zoning = check_zoning(
        plot_width=data.plot_width,
        plot_length=data.plot_length,
        floors=data.floors,
        building_width=layout["building_width"],
        building_length=layout["building_length"],
    )

    return {
        "rooms": layout["rooms"],
        "dimensions": layout["dimensions"],
        "building_width": layout["building_width"],
        "building_length": layout["building_length"],
        "floors": data.floors,
        "coverage": zoning["coverage"],
        "compliance_report": zoning["status"],
        "violations": zoning["violations"],
    }


@app.post("/api/generate")
async def unified_generate(data: GenerateInput):
    """
    Unified endpoint: interpret prompt + generate layout + zoning check.
    Optionally accepts address/lat/lng for real zoning data.
    """
    if not data.prompt.strip():
        raise HTTPException(status_code=400, detail="Please enter a building description.")

    server_groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not server_groq_api_key:
        raise HTTPException(
            status_code=500,
            detail="Server configuration error. Please contact support.",
        )

    # Step 1: Interpret the prompt via LLM
    try:
        interpretation = await interpret_prompt(
            user_prompt=data.prompt,
            groq_api_key=server_groq_api_key,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=400, detail=_clean_error(str(e)))

    params = interpretation["params"]

    # Step 2: Classify zone if address is provided
    zone_rules = None
    detection_info = {"type": "default", "city": "Unknown", "message": "Address set — using default zoning rules"}
    if data.address and data.lat is not None and data.lng is not None:
        try:
            zone_rules, detection_info = await classify_zone(
                address=data.address,
                lat=data.lat,
                lng=data.lng,
                groq_api_key=server_groq_api_key,
            )
        except Exception:
            import traceback
            traceback.print_exc()
            # Zone classification failure is non-fatal — fall back to mock
            zone_rules = None
            detection_info = {"type": "default", "city": "Unknown", "message": "Address set — using default zoning rules"}

    # Step 2.5: Clamp params to zone rules (guarantee compliance before layout)
    if zone_rules:
        max_floors_allowed = int(zone_rules.get("max_floors", 99))
        max_height_allowed = float(zone_rules.get("max_height_m", 999))
        max_fsi_allowed = float(zone_rules.get("max_fsi", 99))
        min_setback_front = float(zone_rules.get("min_setback_front_m", 3.0))
        min_setback_side = float(zone_rules.get("min_setback_side_m", 1.5))
        min_setback_rear = float(zone_rules.get("min_setback_rear_m", 3.0))
        max_coverage_pct = float(zone_rules.get("max_coverage_pct", 60.0))

        # Clamp floors to zone maximum
        floor_height = 3.0
        max_floors_by_height = int(max_height_allowed / floor_height)
        params["floors"] = min(params["floors"], max_floors_allowed, max_floors_by_height)

        # Calculate buildable footprint
        plot_width = float(params["plot_width"])
        plot_length = float(params["plot_length"])
        plot_area = plot_width * plot_length
        buildable_width = max(plot_width - 2 * min_setback_side, 2.0)
        buildable_length = max(plot_length - min_setback_front - min_setback_rear, 2.0)
        buildable_area = buildable_width * buildable_length

        # Clamp floors further by FSI limit
        # max total built-up = max_fsi * plot_area * 0.9 (10% safety margin)
        max_total_builtup = max_fsi_allowed * plot_area * 0.9
        max_floors_by_fsi = max(1, int(max_total_builtup / buildable_area))
        params["floors"] = min(params["floors"], max_floors_by_fsi)

        # Clamp coverage — reduce buildable area if needed
        max_coverage_ratio = (max_coverage_pct / 100) * 0.9  # 10% safety margin
        max_building_area = plot_area * max_coverage_ratio
        if buildable_area > max_building_area:
            # Scale down buildable dimensions proportionally
            scale = (max_building_area / buildable_area) ** 0.5
            buildable_width = round(buildable_width * scale, 2)
            buildable_length = round(buildable_length * scale, 2)

        # Store clamped buildable dimensions for layout generator to use
        params["_clamped_building_width"] = round(buildable_width, 2)
        params["_clamped_building_length"] = round(buildable_length, 2)

    # Step 3: Generate layout
    layout = generate_layout(
        plot_width=params["plot_width"],
        plot_length=params["plot_length"],
        floors=params["floors"],
        bedrooms=params["bedrooms"],
        bathrooms=params["bathrooms"],
        kitchen=params["kitchen"],
        zone_rules=zone_rules,
        clamped_building_width=params.pop("_clamped_building_width", None),
        clamped_building_length=params.pop("_clamped_building_length", None),
    )

    # Step 4: Check zoning compliance
    zoning = check_zoning(
        plot_width=params["plot_width"],
        plot_length=params["plot_length"],
        floors=params["floors"],
        building_width=layout["building_width"],
        building_length=layout["building_length"],
        zone_rules=zone_rules,
    )

    # Step 5: Generate AI reasoning for zoning results
    zoning_for_reasoning = {
        "rules": zoning["rules"],
        "zone_info": zoning["zone_info"],
        "fsi": zoning["fsi"],
        "coverage": zoning["coverage"],
        "building_height": zoning["building_height"],
        "setback_x": zoning["setback_x"],
        "setback_y": zoning["setback_y"],
    }
    layout_for_reasoning = {
        "building_width": layout["building_width"],
        "building_length": layout["building_length"],
    }
    try:
        ai_reasoning = await generate_reasoning(
            zoning=zoning_for_reasoning,
            params=params,
            layout=layout_for_reasoning,
            groq_api_key=server_groq_api_key,
        )
    except Exception:
        import traceback
        traceback.print_exc()
        ai_reasoning = {"rule_reasoning": {}, "summary": ""}

    return {
        "params": params,
        "interpreted": interpretation["interpreted"],
        "llm": interpretation["llm"],
        "layout": {
            "rooms": layout["rooms"],
            "dimensions": layout["dimensions"],
            "building_width": layout["building_width"],
            "building_length": layout["building_length"],
            "floors": params["floors"],
        },
        "zoning": {
            "overall_status": zoning["status"],
            "violations": zoning["violations"],
            "coverage": zoning["coverage"],
            "fsi": zoning["fsi"],
            "building_height": zoning["building_height"],
            "setback_x": zoning["setback_x"],
            "setback_y": zoning["setback_y"],
            "zone_info": zoning["zone_info"],
            "rules": zoning["rules"],
            "rules_applied": zoning["rules_applied"],
            "ai_reasoning": ai_reasoning,
            "detection_info": detection_info,
        },
    }
