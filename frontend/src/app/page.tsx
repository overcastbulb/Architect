"use client";

import { FormEvent, useMemo, useState } from "react";
import LayoutView from "@/components/LayoutView";
import ThreeScene from "@/components/ThreeScene";
import { AIParams, InterpretResponse, LayoutResponse } from "@/types";

const EXAMPLE_PROMPTS = [
  "Design a 3-floor residential building on a 20x30m plot with 4 bedrooms and parking",
  "5 floor apartment building on a 40x60 lot",
  "Mixed-use building on a 30x40 lot with retail on the ground floor",
];

const DEMO_PROMPT =
  "Design a 3-floor residential building on a 20x30m plot with 4 bedrooms and parking.";

const PROCESS_STEPS = [
  "Analyzing building concept...",
  "Extracting building parameters...",
  "Checking zoning constraints...",
  "Generating building layout...",
];

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://architect-ai-4baw.onrender.com";

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);

  const [interpretation, setInterpretation] = useState<InterpretResponse | null>(null);
  const [layout, setLayout] = useState<LayoutResponse | null>(null);

  const processVisible = running || stepIndex >= 0;
  const statusText = useMemo(() => {
    if (running && stepIndex >= 0) return PROCESS_STEPS[stepIndex];
    if (!running && layout) return "Completed";
    return null;
  }, [running, stepIndex, layout]);

  async function runFlow(inputPrompt: string) {
    const trimmedPrompt = inputPrompt.trim();
    if (!trimmedPrompt) return;

    setRunning(true);
    setError(null);
    setStepIndex(0);
    setInterpretation(null);
    setLayout(null);

    try {
      await sleep(250);
      setStepIndex(1);

      const interpretRes = await fetch(`${API_BASE}/api/interpret`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });
      const interpretBody = await interpretRes.json();
      if (!interpretRes.ok) {
        throw new Error(interpretBody.detail || "Interpretation failed");
      }

      const interpretedData = interpretBody as InterpretResponse;
      setInterpretation(interpretedData);

      setStepIndex(2);
      await sleep(250);
      setStepIndex(3);

      const params: AIParams = interpretedData.params;
      const layoutRes = await fetch(`${API_BASE}/generate-layout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plot_width: params.plot_width,
          plot_length: params.plot_length,
          floors: params.floors,
          bedrooms: params.bedrooms,
          bathrooms: params.bathrooms,
          kitchen: params.kitchen,
        }),
      });
      const layoutBody = await layoutRes.json();
      if (!layoutRes.ok) {
        throw new Error(layoutBody.detail || "Layout generation failed");
      }

      setLayout(layoutBody as LayoutResponse);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unexpected error");
    } finally {
      setRunning(false);
    }
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    void runFlow(prompt);
  }

  return (
    <main className="h-screen overflow-y-auto bg-arch-bg text-arch-text">
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-10 md:py-14 space-y-8 md:space-y-10">
        <section className="text-center space-y-3">
          <p className="text-sm font-mono uppercase tracking-[0.2em] text-arch-accent">architect.ai</p>
          <h1 className="font-display text-3xl md:text-5xl font-700 text-white leading-tight">
            Design buildings from a prompt and instantly check zoning feasibility.
          </h1>
          <p className="max-w-3xl mx-auto text-sm md:text-base text-arch-text-dim leading-relaxed">
            Convert a building idea into structured parameters, a conceptual layout, and a zoning compliance report.
          </p>
        </section>

        <section className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the building concept..."
              className="w-full min-h-[96px] rounded-xl border border-arch-border bg-arch-bg px-4 py-3 text-sm text-arch-text placeholder-arch-text-dim focus:outline-none focus:border-arch-accent/60"
              disabled={running}
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={running || !prompt.trim()}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-arch-accent text-arch-bg hover:bg-arch-accent-dim disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {running ? "Running..." : "Generate"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrompt(DEMO_PROMPT);
                  void runFlow(DEMO_PROMPT);
                }}
                disabled={running}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-arch-border text-arch-text hover:border-arch-accent hover:text-arch-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Run Demo
              </button>
            </div>
          </form>

          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.15em] text-arch-text-dim">Example prompts:</p>
            <div className="grid gap-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => setPrompt(example)}
                  disabled={running}
                  className="text-left text-xs md:text-sm px-3 py-2 rounded-lg border border-arch-border bg-arch-bg hover:border-arch-accent/60 hover:text-arch-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </section>

        {processVisible && (
          <section className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-3">
            <h2 className="text-sm font-display text-white">AI Process</h2>
            <div className="space-y-2">
              {PROCESS_STEPS.map((step, index) => {
                const completed = index < stepIndex || (!running && layout !== null);
                const active = index === stepIndex && running;
                return (
                  <div
                    key={step}
                    className={`rounded-lg border px-3 py-2 text-sm ${
                      active
                        ? "border-arch-accent/60 bg-arch-accent/10 text-white"
                        : completed
                        ? "border-arch-pass/40 bg-arch-pass/10 text-arch-pass"
                        : "border-arch-border text-arch-text-dim"
                    }`}
                  >
                    {step}
                  </div>
                );
              })}
            </div>
            {statusText && (
              <p className="text-xs font-mono text-arch-text-dim">
                Status: <span className="text-arch-text">{statusText}</span>
              </p>
            )}
          </section>
        )}

        {error && (
          <section className="bg-arch-surface border border-arch-fail/40 rounded-2xl p-4 md:p-6">
            <p className="text-sm text-arch-fail">{error}</p>
          </section>
        )}

        {interpretation && (
          <section className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-4">
            <h3 className="text-lg font-display text-white">Extracted Building Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-arch-border bg-arch-bg p-3">
                <p className="text-xs text-arch-text-dim">Plot</p>
                <p className="text-sm text-white mt-1">{interpretation.interpreted.plot_size}</p>
              </div>
              <div className="rounded-xl border border-arch-border bg-arch-bg p-3">
                <p className="text-xs text-arch-text-dim">Floors</p>
                <p className="text-sm text-white mt-1">{interpretation.interpreted.floors}</p>
              </div>
              <div className="rounded-xl border border-arch-border bg-arch-bg p-3">
                <p className="text-xs text-arch-text-dim">Bedrooms / Bathrooms</p>
                <p className="text-sm text-white mt-1">
                  {interpretation.interpreted.bedrooms} / {interpretation.interpreted.bathrooms}
                </p>
              </div>
              <div className="rounded-xl border border-arch-border bg-arch-bg p-3">
                <p className="text-xs text-arch-text-dim">Building Type</p>
                <p className="text-sm text-white mt-1">{interpretation.interpreted.building_type}</p>
              </div>
            </div>
          </section>
        )}

        {layout && (
          <section className="space-y-6">
            <div className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-3">
              <h3 className="text-lg font-display text-white">Zoning Compliance Report</h3>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-mono ${
                    layout.compliance_report === "PASS"
                      ? "bg-arch-pass/15 text-arch-pass border border-arch-pass/40"
                      : "bg-arch-fail/15 text-arch-fail border border-arch-fail/40"
                  }`}
                >
                  {layout.compliance_report}
                </span>
                <span className="text-xs text-arch-text-dim">
                  Coverage: {layout.coverage}% | Floors: {layout.floors}
                </span>
              </div>
              {layout.violations.length > 0 ? (
                <ul className="space-y-1 text-sm text-arch-fail">
                  {layout.violations.map((violation) => (
                    <li key={violation}>- {violation}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-arch-pass">No zoning violations detected.</p>
              )}
            </div>

            <div className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4">
              <h3 className="text-lg font-display text-white px-2 pb-2">Generated Layout</h3>
              <div className="h-[720px] rounded-xl overflow-hidden border border-arch-border">
                <LayoutView layout={layout} />
              </div>
            </div>

            <div className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4">
              <h3 className="text-lg font-display text-white px-2 pb-2">3D Building Visualization</h3>
              <div className="h-[560px] rounded-xl overflow-hidden border border-arch-border">
                <ThreeScene layout={layout} />
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
