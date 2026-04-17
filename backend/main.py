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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
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
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")
    server_groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not server_groq_api_key:
        raise HTTPException(
            status_code=500,
            detail="Server Groq key is not configured. Set GROQ_API_KEY and restart backend.",
        )

    try:
        result = await interpret_prompt(
            user_prompt=data.prompt,
            groq_api_key=server_groq_api_key,
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        message = str(e)
        if "Could not reach Groq API" in message:
            raise HTTPException(status_code=503, detail=message)
        raise HTTPException(status_code=400, detail=message)
    return result


@app.post("/generate-layout")
def generate(data: BuildingInput):
    """Legacy endpoint — generates layout from manual params."""
    if data.plot_width <= 0 or data.plot_length <= 0:
        raise HTTPException(status_code=400, detail="Plot dimensions must be positive")

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
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    server_groq_api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not server_groq_api_key:
        raise HTTPException(
            status_code=500,
            detail="Server Groq key is not configured. Set GROQ_API_KEY and restart backend.",
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
        message = str(e)
        if "Could not reach Groq API" in message:
            raise HTTPException(status_code=503, detail=message)
        raise HTTPException(status_code=400, detail=message)

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

    # Step 3: Generate layout
    layout = generate_layout(
        plot_width=params["plot_width"],
        plot_length=params["plot_length"],
        floors=params["floors"],
        bedrooms=params["bedrooms"],
        bathrooms=params["bathrooms"],
        kitchen=params["kitchen"],
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
