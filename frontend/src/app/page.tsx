"use client";

import { useState } from "react";
import InputPanel from "@/components/InputPanel";
import ThreeScene from "@/components/ThreeScene";
import LayoutView from "@/components/LayoutView";
import ZoningReport from "@/components/ZoningReport";
import AIPromptBar from "@/components/AIPromptBar";
import AIInterpretationPanel from "@/components/AIInterpretationPanel";
import { LayoutResponse, BuildingInput, AIParams, InterpretResponse } from "@/types";

export default function Home() {
  const [layout, setLayout] = useState<LayoutResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"3d" | "2d">("3d");

  const [aiLoading, setAiLoading] = useState(false);
  const [aiInterpretation, setAiInterpretation] = useState<InterpretResponse | null>(null);
  const [aiParams, setAiParams] = useState<AIParams | null>(null);

  const [plotWidth, setPlotWidth] = useState(15);
  const [plotLength, setPlotLength] = useState(20);
  const [floors, setFloors] = useState(2);
  const [bedrooms, setBedrooms] = useState(3);
  const [bathrooms, setBathrooms] = useState(2);
  const [kitchen, setKitchen] = useState(true);

  async function handleGenerate(input: BuildingInput) {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("https://architect-ai-4baw.onrender.com/generate-layout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "API error");
      }

      const data: LayoutResponse = await res.json();
      setLayout(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to connect to backend");
    } finally {
      setLoading(false);
    }
  }

  function handleInterpret(result: InterpretResponse) {
    setAiInterpretation(result);
    setAiParams(result.params);
  }

  function handleGenerateFromAIParams(params: AIParams) {
    handleGenerate({
      plot_width: params.plot_width,
      plot_length: params.plot_length,
      floors: params.floors,
      bedrooms: params.bedrooms,
      bathrooms: params.bathrooms,
      kitchen: params.kitchen,
    });
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-arch-bg">
      <div className="shrink-0 z-20 flex items-center gap-4 px-4 py-2.5 border-b border-arch-border bg-arch-bg/95 backdrop-blur-sm">
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-7 h-7 bg-arch-accent rounded-sm flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 14L8 2L14 14H2Z" fill="#0a0c10" />
            </svg>
          </div>
          <span className="font-display font-700 text-sm tracking-tight text-white whitespace-nowrap">
            AI Architecture <span className="text-arch-accent">Prototype</span>
          </span>
        </div>

        <AIPromptBar
          onInterpret={(result) => {
            handleInterpret(result);
            handleGenerateFromAIParams(result.params);
          }}
          onGenerateFromAI={() => {}}
          aiLoading={aiLoading}
          setAiLoading={setAiLoading}
        />

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-arch-surface border border-arch-border rounded-lg">
            <button
              onClick={() => setView("3d")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                view === "3d" ? "bg-arch-accent text-arch-bg" : "text-arch-text-dim hover:text-arch-text"
              }`}
            >
              3D
            </button>
            <button
              onClick={() => setView("2d")}
              className={`px-3 py-1.5 rounded-md text-xs font-mono font-medium transition-all ${
                view === "2d" ? "bg-arch-accent text-arch-bg" : "text-arch-text-dim hover:text-arch-text"
              }`}
            >
              2D
            </button>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-arch-pass animate-pulse" />
            <span className="text-[10px] font-mono text-arch-text-dim">LIVE</span>
          </div>
        </div>
      </div>

      {(aiInterpretation || aiLoading) && (
        <div className="shrink-0 pt-2 pb-1 px-0 border-b border-arch-border bg-arch-bg/80">
          <AIInterpretationPanel interpretation={aiInterpretation} loading={aiLoading} />
        </div>
      )}

      <div className="flex flex-1 min-h-0">
        <div className="w-72 shrink-0 h-full border-r border-arch-border overflow-y-auto">
          <InputPanel
            onGenerate={handleGenerate}
            loading={loading}
            aiParams={aiParams}
            plotWidth={plotWidth}
            setPlotWidth={setPlotWidth}
            plotLength={plotLength}
            setPlotLength={setPlotLength}
            floors={floors}
            setFloors={setFloors}
            bedrooms={bedrooms}
            setBedrooms={setBedrooms}
            bathrooms={bathrooms}
            setBathrooms={setBathrooms}
            kitchen={kitchen}
            setKitchen={setKitchen}
          />
        </div>

        <div className="flex-1 h-full relative">
          {!layout && !loading && !aiLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 text-arch-text-dim">
              <div className="relative">
                <div className="w-28 h-28 border border-arch-border rounded-3xl flex items-center justify-center">
                  <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
                    <rect x="7" y="22" width="30" height="15" rx="1" stroke="#3a4055" strokeWidth="1.5" />
                    <path d="M7 22L22 9L37 22" stroke="#3a4055" strokeWidth="1.5" strokeLinejoin="round" />
                    <rect x="17" y="29" width="10" height="8" rx="0.5" stroke="#3a4055" strokeWidth="1.2" />
                  </svg>
                </div>
                <div className="absolute -top-1 -left-1 w-2 h-2 rounded-full bg-arch-accent/30" />
                <div className="absolute -bottom-1 -right-1 w-2 h-2 rounded-full bg-violet-500/30" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-display text-sm text-arch-text">Start with a prompt or use the sliders</p>
                <p className="text-xs text-arch-text-dim">
                  Try: <span className="text-violet-400 italic">"A 3-floor house on a 20x30m plot with 4 bedrooms"</span>
                </p>
              </div>
            </div>
          )}

          {(loading || aiLoading) && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 z-10 bg-arch-bg/60 backdrop-blur-sm">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-2 border-violet-500/20 rounded-full" />
                <div className="absolute inset-0 border-2 border-t-violet-500 rounded-full animate-spin" />
                <div className="absolute inset-3 border border-arch-accent/20 rounded-full" />
                <div
                  className="absolute inset-3 border border-b-arch-accent rounded-full animate-spin"
                  style={{ animationDirection: "reverse", animationDuration: "0.8s" }}
                />
              </div>
              <div className="text-center">
                <p className="font-mono text-xs text-violet-400 tracking-widest animate-pulse">
                  {aiLoading ? "AI GENERATING ARCHITECTURE..." : "BUILDING LAYOUT..."}
                </p>
                {aiLoading && (
                  <p className="text-xs text-arch-text-dim mt-1.5">Groq is interpreting your request</p>
                )}
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20">
              <div className="bg-arch-surface border border-arch-fail/30 rounded-xl px-5 py-3 flex items-center gap-3">
                <span className="text-arch-fail">!</span>
                <div>
                  <p className="text-arch-fail text-xs font-mono">{error}</p>
                  <p className="text-arch-text-dim text-xs mt-0.5">Check backend is running on port 8000</p>
                </div>
                <button onClick={() => setError(null)} className="text-arch-text-dim hover:text-arch-text ml-2">
                  x
                </button>
              </div>
            </div>
          )}

          {layout && !aiLoading && (
            <div className="w-full h-full animate-fade-in">
              {view === "3d" ? <ThreeScene layout={layout} /> : <LayoutView layout={layout} />}
            </div>
          )}
        </div>

        <div className="w-72 shrink-0 h-full border-l border-arch-border overflow-y-auto">
          <ZoningReport layout={layout} />
        </div>
      </div>
    </div>
  );
}
