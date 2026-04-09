architect.ai

Generate building concepts and instantly evaluate zoning feasibility from a prompt.

architect.ai is an AI-powered prototype that converts a natural-language building idea into a structured building model, generates conceptual massing, and evaluates zoning compliance.

It enables architects, developers, and planners to test building feasibility in seconds instead of days.

Problem

Early-stage architectural feasibility is slow.

Before any design work begins, architects must manually determine:

allowable building height
floor area ratio (FAR)
setback requirements
density limits
program distribution

This process requires reviewing zoning documents and building rough massing studies manually.

The result is slow iteration and high upfront design cost.

Solution

architect.ai introduces a prompt-first workflow for architectural feasibility.

Users describe a building concept in natural language.
The system interprets the request and automatically:

extracts structured building parameters
generates conceptual layout geometry
evaluates zoning compliance
visualizes the resulting building mass

This enables rapid feasibility exploration before detailed design begins.

Demo

Example prompt

Design a 3-floor residential building on a 20x30m plot with 4 bedrooms and parking.

System output

Extracted Parameters

Plot: 20m × 30m
Floors: 3
Bedrooms: 4
Building Type: Residential

Zoning Evaluation

Height Limit → PASS
Floor Area Ratio (FAR) → PASS
Setbacks → PASS

Generated Output

conceptual building layout
zoning feasibility report
interactive building visualization
Workflow
User Prompt
     ↓
AI Parameter Extraction
     ↓
Layout Generation
     ↓
Zoning Compliance Check
     ↓
Interactive Visualization
System Architecture
Frontend (Next.js + React + Three.js)
        │
        ▼
Backend API (FastAPI)
        │
        ├── Prompt Interpretation (LLM via Groq)
        ├── Layout Generator
        └── Zoning Compliance Engine
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
Pydantic

AI

Groq LLM API

Deployment

Frontend → Vercel
Backend → Render

Example API

POST /api/interpret

Request

{
  "prompt": "Design a 3-floor residential building on a 20x30m plot with 4 bedrooms"
}

Response returns structured parameters used for layout generation and zoning validation.

Why This Matters

Most architectural decisions that determine project feasibility, cost, and density occur before detailed design begins.

By translating natural-language building ideas into structured spatial models and zoning evaluations, architect.ai dramatically accelerates early-stage feasibility analysis.

Vision

architect.ai aims to evolve into an AI architecture copilot capable of:

analyzing real parcel and zoning datasets
generating site-aware building massing
evaluating feasibility across cities
exporting models to BIM workflows
assisting architects during early-stage design exploration
