"use client";

import { useEffect } from "react";
import { BuildingInput, AIParams } from "@/types";

interface Props {
  onGenerate: (input: BuildingInput) => void;
  loading: boolean;
  aiParams?: AIParams | null;
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
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-xs font-mono text-arch-text-dim uppercase tracking-wider">{label}</span>
        <span
          className={`text-xs font-mono font-medium transition-all duration-500 ${
            highlight ? "text-violet-400" : "text-arch-accent"
          }`}
        >
          {value}{unit}
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
      <div className="flex justify-between text-arch-muted" style={{ fontSize: "9px" }}>
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}

export default function InputPanel({
  onGenerate,
  loading,
  aiParams,
  plotWidth, setPlotWidth,
  plotLength, setPlotLength,
  floors, setFloors,
  bedrooms, setBedrooms,
  bathrooms, setBathrooms,
  kitchen, setKitchen,
}: Props) {
  useEffect(() => {
    if (!aiParams) return;
    setPlotWidth(aiParams.plot_width);
    setPlotLength(aiParams.plot_length);
    setFloors(aiParams.floors);
    setBedrooms(aiParams.bedrooms);
    setBathrooms(aiParams.bathrooms);
    setKitchen(aiParams.kitchen);
  }, [aiParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const footprint = Math.max(0, (plotWidth - 6) * (plotLength - 6));
  const coverage = footprint / (plotWidth * plotLength);
  const aiActive = !!aiParams;

  function handleSubmit() {
    onGenerate({ plot_width: plotWidth, plot_length: plotLength, floors, bedrooms, bathrooms, kitchen });
  }

  return (
    <div className="p-5 space-y-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h2 className="font-display font-700 text-sm text-white tracking-tight">Building Parameters</h2>
          {aiActive && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-violet-500/20 text-violet-400 border border-violet-500/30">
              AI SET
            </span>
          )}
        </div>
        <p className="text-xs text-arch-text-dim leading-relaxed">
          {aiActive
            ? "AI has configured these parameters. Adjust sliders to refine."
            : "Define plot dimensions and room requirements."}
        </p>
      </div>

      <hr className="border-arch-border" />

      <div className="space-y-1">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-3 bg-arch-accent rounded-full" />
          <span className="text-xs font-display font-600 text-white uppercase tracking-widest">Plot</span>
        </div>
        <div className="space-y-5">
          <SliderField label="Width" value={plotWidth} onChange={setPlotWidth} min={8} max={50} unit="m" highlight={aiActive} />
          <SliderField label="Length" value={plotLength} onChange={setPlotLength} min={8} max={60} unit="m" highlight={aiActive} />
        </div>

        <div className="mt-4 p-3 bg-arch-surface border border-arch-border rounded-lg">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-arch-text-dim font-mono">FOOTPRINT</span>
            <span className="font-mono text-arch-text">{footprint.toFixed(0)} m²</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-arch-text-dim font-mono">COVERAGE</span>
            <span className={`font-mono font-medium ${coverage > 0.6 ? "text-arch-fail" : "text-arch-pass"}`}>
              {(Math.min(coverage, 1) * 100).toFixed(0)}%
            </span>
          </div>
          <div className="mt-2 h-1 bg-arch-border rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${coverage > 0.6 ? "bg-arch-fail" : "bg-arch-pass"}`}
              style={{ width: `${Math.min(coverage * 100, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <hr className="border-arch-border" />

      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-arch-accent rounded-full" />
          <span className="text-xs font-display font-600 text-white uppercase tracking-widest">Structure</span>
        </div>
        <SliderField label="Floors" value={floors} onChange={setFloors} min={1} max={8} highlight={aiActive} />
      </div>

      <hr className="border-arch-border" />

      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-arch-accent rounded-full" />
          <span className="text-xs font-display font-600 text-white uppercase tracking-widest">Rooms</span>
        </div>
        <SliderField label="Bedrooms" value={bedrooms} onChange={setBedrooms} min={0} max={10} highlight={aiActive} />
        <SliderField label="Bathrooms" value={bathrooms} onChange={setBathrooms} min={1} max={6} highlight={aiActive} />

        <div className="flex items-center justify-between">
          <span className="text-xs font-mono text-arch-text-dim uppercase tracking-wider">Kitchen</span>
          <button
            onClick={() => setKitchen(!kitchen)}
            className={`relative w-10 h-5 rounded-full transition-all duration-300 ${kitchen ? "bg-arch-accent" : "bg-arch-muted"}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-arch-bg rounded-full shadow transition-all duration-300 ${kitchen ? "translate-x-5" : "translate-x-0.5"}`}
            />
          </button>
        </div>
      </div>

      <hr className="border-arch-border" />

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full py-3 rounded-xl font-display font-700 text-sm tracking-wide transition-all
          bg-arch-accent text-arch-bg hover:bg-arch-accent-dim active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-glow"
      >
        {loading ? "GENERATING…" : "GENERATE LAYOUT"}
      </button>

      <div className="space-y-2">
        <p className="text-xs font-mono text-arch-text-dim uppercase tracking-wider">Room Legend</p>
        {[
          { color: "#3b82f6", label: "Living Room" },
          { color: "#f59e0b", label: "Kitchen" },
          { color: "#8b5cf6", label: "Bedroom" },
          { color: "#10b981", label: "Bathroom" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-arch-text-dim">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
