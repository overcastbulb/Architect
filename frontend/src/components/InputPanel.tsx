"use client";

import { useEffect, useCallback } from "react";
import { AIParams, AddressData } from "@/types";
import AddressInput from "./AddressInput";

interface Props {
  /* Generation callback */
  onGenerate: (prompt: string, address?: AddressData | null) => void;
  loading: boolean;

  /* AI params (set after LLM interpretation) */
  aiParams?: AIParams | null;

  /* Prompt state (lifted to parent) */
  prompt: string;
  setPrompt: (v: string) => void;

  /* Address state */
  addressData: AddressData | null;
  setAddressData: (v: AddressData | null) => void;

  /* Manual param state */
  plotWidth: number;
  setPlotWidth: (v: number) => void;
  plotLength: number;
  setPlotLength: (v: number) => void;
  floors: number;
  setFloors: (v: number) => void;
  bedrooms: number;
  setBedrooms: (v: number) => void;
  bathrooms: number;
  setBathrooms: (v: number) => void;
  kitchen: boolean;
  setKitchen: (v: boolean) => void;
}

const EXAMPLES = [
  "5 floor residential apartment with parking on a 30x40m plot",
  "3-floor commercial office building on a 25x35m lot",
  "Luxury 4-floor villa with 5 bedrooms on a 40x50m plot",
  "2-floor mixed-use building with retail on ground floor",
];

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  unit = "",
  highlight = false,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit?: string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <span className="text-[11px] font-medium text-arch-text-dim uppercase tracking-wider">
          {label}
        </span>
        <span
          className={`text-xs font-mono font-semibold transition-all duration-500 ${
            highlight ? "text-arch-accent-light" : "text-arch-text"
          }`}
        >
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
    </div>
  );
}

export default function InputPanel({
  onGenerate,
  loading,
  aiParams,
  prompt,
  setPrompt,
  addressData,
  setAddressData,
  plotWidth,
  setPlotWidth,
  plotLength,
  setPlotLength,
  floors,
  setFloors,
  bedrooms,
  setBedrooms,
  bathrooms,
  setBathrooms,
  kitchen,
  setKitchen,
}: Props) {
  // Sync AI params to sliders
  useEffect(() => {
    if (!aiParams) return;
    setPlotWidth(aiParams.plot_width);
    setPlotLength(aiParams.plot_length);
    setFloors(aiParams.floors);
    setBedrooms(aiParams.bedrooms);
    setBathrooms(aiParams.bathrooms);
    setKitchen(aiParams.kitchen);
  }, [aiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddressSelect = useCallback(
    (data: AddressData | null) => {
      setAddressData(data);
    },
    [setAddressData]
  );

  const aiActive = !!aiParams;

  function handleSubmit() {
    if (!prompt.trim()) return;
    onGenerate(prompt, addressData);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleSubmit();
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Panel header */}
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-arch-accent/15 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path
                  d="M7 1L1 5v8h4.5V9h3v4H13V5L7 1z"
                  stroke="#3B82F6"
                  strokeWidth="1.2"
                  fill="none"
                />
              </svg>
            </div>
            <div>
              <h2 className="font-semibold text-sm text-white tracking-tight">
                Design Input
              </h2>
              <p className="text-[10px] text-arch-text-dim">
                Address + prompt → AI generates
              </p>
            </div>
          </div>
        </div>

        <hr className="border-arch-border" />

        {/* Address Input */}
        <AddressInput
          onAddressSelect={handleAddressSelect}
          disabled={loading}
        />

        <hr className="border-arch-border" />

        {/* AI Prompt */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-arch-accent rounded-full" />
            <span className="text-xs font-semibold text-white uppercase tracking-widest">
              AI Prompt
            </span>
            {aiActive && (
              <span className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-mono bg-arch-accent/15 text-arch-accent-light border border-arch-accent/25">
                AI SET
              </span>
            )}
          </div>

          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Describe the building you want to design..."
              disabled={loading}
              rows={3}
              className="w-full rounded-xl border border-arch-border bg-arch-surface px-4 py-3 text-sm text-arch-text placeholder-arch-text-dim/60 focus:outline-none focus:border-arch-accent/50 focus:shadow-[0_0_16px_rgba(37,99,235,0.08)] transition-all duration-300 disabled:opacity-50 resize-none"
            />
            {loading && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-transparent via-arch-accent to-transparent"
                  style={{
                    width: "200%",
                    animation: "shimmer 1.5s linear infinite",
                  }}
                />
              </div>
            )}
          </div>

          {/* Example prompts */}
          <div className="space-y-1">
            <span className="text-[9px] font-mono text-arch-text-dim/50 uppercase tracking-wider">
              Examples
            </span>
            <div className="space-y-1">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setPrompt(ex)}
                  disabled={loading}
                  className="w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg border border-arch-border bg-arch-bg/50 text-arch-text-dim hover:border-arch-accent/30 hover:text-arch-text transition-all disabled:opacity-30 disabled:cursor-not-allowed truncate"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>

        <hr className="border-arch-border" />

        {/* Building Parameters */}
        <div className="space-y-4">
          {/* Plot */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-arch-accent rounded-full" />
              <span className="text-xs font-semibold text-white uppercase tracking-widest">
                Plot
              </span>
            </div>
            <SliderField
              label="Width"
              value={plotWidth}
              onChange={setPlotWidth}
              min={8}
              max={60}
              unit="m"
              highlight={aiActive}
            />
            <SliderField
              label="Length"
              value={plotLength}
              onChange={setPlotLength}
              min={8}
              max={80}
              unit="m"
              highlight={aiActive}
            />
          </div>

          {/* Structure */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-arch-accent rounded-full" />
              <span className="text-xs font-semibold text-white uppercase tracking-widest">
                Structure
              </span>
            </div>
            <SliderField
              label="Floors"
              value={floors}
              onChange={setFloors}
              min={1}
              max={15}
              highlight={aiActive}
            />
          </div>

          {/* Rooms */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-3 bg-arch-accent rounded-full" />
              <span className="text-xs font-semibold text-white uppercase tracking-widest">
                Rooms
              </span>
            </div>
            <SliderField
              label="Bedrooms"
              value={bedrooms}
              onChange={setBedrooms}
              min={0}
              max={10}
              highlight={aiActive}
            />
            <SliderField
              label="Bathrooms"
              value={bathrooms}
              onChange={setBathrooms}
              min={1}
              max={6}
              highlight={aiActive}
            />
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-arch-text-dim uppercase tracking-wider">
                Kitchen
              </span>
              <button
                onClick={() => setKitchen(!kitchen)}
                className={`relative w-10 h-5 rounded-full transition-all duration-300 ${
                  kitchen ? "bg-arch-accent" : "bg-arch-muted"
                }`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${
                    kitchen ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed generate button at bottom */}
      <div className="p-4 border-t border-arch-border bg-arch-bg/80 backdrop-blur-sm">
        <button
          onClick={handleSubmit}
          disabled={loading || !prompt.trim()}
          className="w-full py-3 rounded-xl font-semibold text-sm tracking-wide transition-all
            bg-arch-accent text-white hover:bg-arch-accent-dim active:scale-[0.98]
            disabled:opacity-40 disabled:cursor-not-allowed
            shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_30px_rgba(37,99,235,0.4)]"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-white/60 animate-pulse" />
              GENERATING...
            </span>
          ) : (
            "GENERATE DESIGN"
          )}
        </button>
      </div>
    </div>
  );
}
