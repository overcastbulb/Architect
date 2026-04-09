architect.ai

Design buildings from a prompt and instantly evaluate zoning feasibility.

architect.ai is an AI-powered prototype that converts a natural language building idea into a conceptual building model and evaluates whether it complies with zoning constraints.

The goal is to help architects and developers evaluate early-stage feasibility in seconds instead of days.

Demo

Example prompt:

Design a 3-floor residential building on a 20x30m plot with 4 bedrooms and parking.

System output:

Extracted Parameters

Plot: 20m × 30m
Floors: 3
Bedrooms: 4
Building type: Residential

Zoning Compliance

Height limit → PASS
Floor Area Ratio (FAR) → PASS
Setbacks → PASS

Generated Output

Conceptual building layout
Zoning feasibility report
Interactive building visualization
How It Works
User Prompt
     ↓
AI Parameter Extraction
     ↓
Layout Generator
     ↓
Zoning Compliance Engine
     ↓
Interactive Visualization
System Architecture
Frontend (Next.js + React + Three.js)
        │
        ▼
Backend API (FastAPI)
        │
        ├─ Prompt Interpretation (LLM via Groq)
        ├─ Layout Generator
        └─ Zoning Compliance Checker
        │
        ▼
Structured Building Model
        │
        ▼
2D / 3D Visualization
Tech Stack

Frontend
Next.js
React
TypeScript
Three.js

Backend
Python
FastAPI

AI
Groq LLM API

Deployment

Frontend → Vercel
Backend → Render

Why This Matters

Early architectural decisions determine most project cost and feasibility.

architect.ai explores how AI can assist architects and developers during the earliest stage of project planning by translating ideas into structured building models and feasibility checks.

Vision

architect.ai aims to become an AI architecture assistant capable of:

analyzing real parcel and zoning data
generating conceptual building massing
evaluating feasibility instantly
assisting architects during early design
