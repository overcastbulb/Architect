from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict
import os
from layout_generator import generate_layout
from zoning_checker import check_zoning
from llm_client import interpret_prompt

app = FastAPI(title="AI Architecture API", version="2.0.0")

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


@app.get("/")
def root():
    return {"status": "AI Architecture API v2 running"}


@app.post("/api/interpret")
async def interpret(data: PromptInput):
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
