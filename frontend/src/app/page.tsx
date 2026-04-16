"use client";

import { FormEvent, useMemo, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import LayoutView from "@/components/LayoutView";
import ThreeScene from "@/components/ThreeScene";
import AddressInput from "@/components/AddressInput";

// Dynamic import - Leaflet needs `window` (no SSR)
const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });
import {
  AIParams,
  AddressData,
  LayoutData,
  ZoningReport,
  AIInterpretation,
  LLMInfo,
} from "@/types";

const EXAMPLE_PROMPTS = [
  "Design a compliant 2-floor courtyard residence on a 14m x 20m plot with 3 bedrooms, 2 bathrooms, one kitchen, a pooja room, and a single covered parking bay.",
  "Create a compliant single-floor universal-design home on a 15m x 21m plot with 2 bedrooms, 2 bathrooms, one kitchen, a home office, and step-free circulation.",
  "Plan a compliant 2-floor neighborhood office building on a 13m x 19m plot with reception, 4 cabins, one meeting room, 2 washrooms, a pantry, and compact on-site parking.",
  "Design an aggressive high-density concept on a 100m x 100m plot with 10 floors, 10 bedrooms, 6 bathrooms, full-footprint massing, and maximum built-up area to test zoning limits.",
];

const DEMO_PROMPT =
  "Generate a compliant 2-floor duplex townhouse concept on a 12m x 18m plot with 3 bedrooms, 2 bathrooms, one kitchen, a family lounge, and one on-plot parking slot.";

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

  // Address
  const [addressData, setAddressData] = useState<AddressData | null>(null);

  // Results from unified API
  const [interpretation, setInterpretation] = useState<AIInterpretation | null>(null);
  const [aiParams, setAiParams] = useState<AIParams | null>(null);
  const [layout, setLayout] = useState<LayoutData | null>(null);
  const [zoning, setZoning] = useState<ZoningReport | null>(null);
  const hasSelectedAddress = Boolean(addressData);

  const processVisible = running || stepIndex >= 0;
  const statusText = useMemo(() => {
    if (running && stepIndex >= 0) return PROCESS_STEPS[stepIndex];
    if (!running && layout) return "Completed";
    return null;
  }, [running, stepIndex, layout]);

  const handleAddressSelect = useCallback(
    (data: AddressData | null) => {
      setAddressData(data);
    },
    []
  );

  async function runFlow(inputPrompt: string) {
    const trimmedPrompt = inputPrompt.trim();
    if (!trimmedPrompt) return;
    if (!addressData) {
      setError("Please select a site address first, then enter or choose a prompt.");
      return;
    }

    setRunning(true);
    setError(null);
    setStepIndex(0);
    setInterpretation(null);
    setAiParams(null);
    setLayout(null);
    setZoning(null);

    try {
      await sleep(250);
      setStepIndex(1);

      // Build request body
      const body: Record<string, unknown> = { prompt: trimmedPrompt };
      if (addressData) {
        body.address = addressData.address;
        body.lat = addressData.lat;
        body.lng = addressData.lng;
      }

      const res = await fetch(`${API_BASE}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || "Generation failed");
      }

      setStepIndex(2);
      await sleep(250);
      setStepIndex(3);

      // Populate results
      setInterpretation(data.interpreted);
      setAiParams(data.params);
      setLayout(data.layout);
      setZoning(data.zoning);
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
        {/* ============ HERO ============ */}
        <section className="text-center space-y-3">
          <p className="text-sm font-mono uppercase tracking-[0.2em] text-arch-accent">architect.ai</p>
          <h1 className="font-display text-3xl md:text-5xl font-700 text-white leading-tight">
            Design buildings from a prompt and instantly check zoning feasibility.
          </h1>
          <p className="max-w-3xl mx-auto text-sm md:text-base text-arch-text-dim leading-relaxed">
            Convert a building idea into structured parameters, a conceptual layout, and a zoning compliance report.
          </p>
        </section>

        {/* ============ INPUT CARD ============ */}
        <section className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-4">
          {/* Address Input (NEW) */}
          <AddressInput
            onAddressSelect={handleAddressSelect}
            disabled={running}
          />

          <hr className="border-arch-border" />

          {/* Prompt + buttons (ORIGINAL) */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                hasSelectedAddress
                  ? "Describe the building concept..."
                  : "Select a site address first to enable prompt input"
              }
              className="w-full min-h-[96px] rounded-xl border border-arch-border bg-arch-bg px-4 py-3 text-sm text-arch-text placeholder-arch-text-dim focus:outline-none focus:border-arch-accent/60"
              disabled={running || !hasSelectedAddress}
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={running || !prompt.trim() || !hasSelectedAddress}
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
                disabled={running || !hasSelectedAddress}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-arch-border text-arch-text hover:border-arch-accent hover:text-arch-accent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Run Demo
              </button>
            </div>
            {!hasSelectedAddress && (
              <p className="text-xs text-arch-text-dim">
                Select a site address first to enable prompt generation.
              </p>
            )}
          </form>

          {/* Example prompts (ORIGINAL) */}
          <div className="space-y-2">
            <p className="text-xs font-mono uppercase tracking-[0.15em] text-arch-text-dim">Example prompts:</p>
            <div className="grid gap-2">
              {EXAMPLE_PROMPTS.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => {
                    setPrompt(example);
                  }}
                  disabled={running || !hasSelectedAddress}
                  className="text-left text-xs md:text-sm px-3 py-2 rounded-lg border border-arch-border bg-arch-bg hover:border-arch-accent/60 hover:text-arch-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ============ MAP PREVIEW (ADDRESS SELECTED) ============ */}
        {addressData && !layout && (
          <section className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4">
            <h3 className="text-lg font-display text-white px-2 pb-2">Plot Location</h3>
            <MapView
              lat={addressData.lat}
              lng={addressData.lng}
              address={addressData.address}
            />
          </section>
        )}

        {/* ============ AI PROCESS (ORIGINAL) ============ */}
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

        {/* ============ ERROR (ORIGINAL) ============ */}
        {error && (
          <section className="bg-arch-surface border border-arch-fail/40 rounded-2xl p-4 md:p-6">
            <p className="text-sm text-arch-fail">{error}</p>
          </section>
        )}

        {/* ============ EXTRACTED PARAMS (ORIGINAL) ============ */}
        {interpretation && (
          <section className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-4">
            <h3 className="text-lg font-display text-white">Extracted Building Parameters</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="rounded-xl border border-arch-border bg-arch-bg p-3">
                <p className="text-xs text-arch-text-dim">Plot</p>
                <p className="text-sm text-white mt-1">{interpretation.plot_size}</p>
              </div>
              <div className="rounded-xl border border-arch-border bg-arch-bg p-3">
                <p className="text-xs text-arch-text-dim">Floors</p>
                <p className="text-sm text-white mt-1">{interpretation.floors}</p>
              </div>
              <div className="rounded-xl border border-arch-border bg-arch-bg p-3">
                <p className="text-xs text-arch-text-dim">Bedrooms / Bathrooms</p>
                <p className="text-sm text-white mt-1">
                  {interpretation.bedrooms} / {interpretation.bathrooms}
                </p>
              </div>
              <div className="rounded-xl border border-arch-border bg-arch-bg p-3">
                <p className="text-xs text-arch-text-dim">Building Type</p>
                <p className="text-sm text-white mt-1">{interpretation.building_type}</p>
              </div>
            </div>
          </section>
        )}

        {/* ============ ZONING COMPLIANCE (ORIGINAL + ZONE INFO) ============ */}
        {zoning && layout && (
          <section className="space-y-6">
            <div className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-3">
              <h3 className="text-lg font-display text-white">Zoning Compliance Report</h3>

              {/* Zone info badge (NEW - only shows when real zone detected) */}
              {zoning.zone_info && (
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-arch-accent/30 bg-arch-accent/5">
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-arch-accent/20 text-arch-accent border border-arch-accent/30">
                    {zoning.zone_info.zone_code}
                  </span>
                  <span className="text-sm text-white">
                    {zoning.zone_info.zone_name}
                  </span>
                  <span className="text-xs text-arch-text-dim">
                    &mdash; {zoning.zone_info.city} &middot; {zoning.zone_info.authority}
                  </span>
                </div>
              )}
              {zoning.zone_info && (
                <p className="text-xs font-mono text-arch-text-dim">
                  Source: {zoning.zone_info.source}
                </p>
              )}

              {/* Overall status (ORIGINAL) */}
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-1 rounded-md text-xs font-mono ${
                    zoning.overall_status === "PASS"
                      ? "bg-arch-pass/15 text-arch-pass border border-arch-pass/40"
                      : zoning.overall_status === "WARNING"
                      ? "bg-arch-warn/15 text-arch-warn border border-arch-warn/40"
                      : "bg-arch-fail/15 text-arch-fail border border-arch-fail/40"
                  }`}
                >
                  {zoning.overall_status}
                </span>
                <span className="text-xs text-arch-text-dim">
                  Coverage: {zoning.coverage}% | Floors: {layout.floors} | FSI: {zoning.fsi}
                </span>
              </div>

              {/* Rule-by-rule results (NEW) */}
              {zoning.rules && zoning.rules.length > 0 && (
                <div className="space-y-1.5">
                  {zoning.rules.map((rule, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between px-3 py-2 rounded-lg border border-arch-border bg-arch-bg"
                    >
                      <div>
                        <span className="text-xs text-arch-text">{rule.rule_name}</span>
                        <span className="text-xs text-arch-text-dim ml-2">({rule.message})</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-medium ${
                          rule.status === "OK"
                            ? "bg-arch-pass/15 text-arch-pass border border-arch-pass/30"
                            : rule.status === "WARNING"
                            ? "bg-arch-warn/15 text-arch-warn border border-arch-warn/30"
                            : "bg-arch-fail/15 text-arch-fail border border-arch-fail/30"
                        }`}
                      >
                        {rule.status === "OK" ? "OK" : rule.status === "WARNING" ? "WARN" : "FAIL"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Violations (ORIGINAL) */}
              {zoning.violations.length > 0 ? (
                <ul className="space-y-1 text-sm text-arch-fail">
                  {zoning.violations.map((violation) => (
                    <li key={violation}>- {violation}</li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-arch-pass">No zoning violations detected.</p>
              )}
            </div>


            {/* ============ LAYOUT (ORIGINAL) ============ */}
            <div className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4">
              <h3 className="text-lg font-display text-white px-2 pb-2">Generated Layout</h3>
              <div className="h-[720px] rounded-xl overflow-hidden border border-arch-border">
                <LayoutView layout={layout} />
              </div>
            </div>

            {/* ============ 3D VIEWER (ORIGINAL) ============ */}
            <div className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4">
              <h3 className="text-lg font-display text-white px-2 pb-2">3D Building Visualization</h3>
              <div className="h-[560px] rounded-xl overflow-hidden border border-arch-border">
                <ThreeScene layout={layout} />
              </div>
            </div>

            {/* ============ MAP VIEW ============ */}
            {addressData && (
              <div className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4">
                <h3 className="text-lg font-display text-white px-2 pb-2">Plot Location</h3>
                <MapView
                  lat={addressData.lat}
                  lng={addressData.lng}
                  address={addressData.address}
                />
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
