"use client";

import { InterpretResponse } from "@/types";

interface Props {
  interpretation: InterpretResponse | null;
  loading: boolean;
}

const icons: Record<string, string> = {
  "Plot Size": "⬜",
  Floors: "🏢",
  Bedrooms: "🛏",
  Bathrooms: "🚿",
  Kitchen: "🍳",
  "Building Type": "🏗",
  Parking: "🚗",
};

export default function AIInterpretationPanel({ interpretation, loading }: Props) {
  if (!interpretation && !loading) return null;

  const items = interpretation
    ? [
        { label: "Plot Size", value: interpretation.interpreted.plot_size },
        { label: "Floors", value: `${interpretation.interpreted.floors}` },
        { label: "Bedrooms", value: `${interpretation.interpreted.bedrooms}` },
        { label: "Bathrooms", value: `${interpretation.interpreted.bathrooms}` },
        { label: "Kitchen", value: interpretation.interpreted.kitchen ? "Yes" : "No" },
        { label: "Building Type", value: interpretation.interpreted.building_type },
        { label: "Parking", value: interpretation.interpreted.parking ? "Yes" : "No" },
      ]
    : [];

  return (
    <div className="mx-4 mb-0 animate-slide-up">
      <div className="border border-violet-500/30 bg-violet-950/20 rounded-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-violet-500/20 bg-violet-900/10">
          <div className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[10px] font-mono text-violet-400 uppercase tracking-widest font-medium">
            AI Interpretation
          </span>
          {loading && (
            <span className="ml-auto text-[10px] font-mono text-violet-500 animate-pulse">Processing…</span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-3 px-4 py-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-6 rounded-md bg-violet-900/40 animate-pulse"
                style={{ width: `${60 + i * 15}px`, animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap gap-2 px-4 py-3">
            {items.map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-900/20 border border-violet-500/20"
              >
                <span className="text-xs">{icons[item.label] ?? "•"}</span>
                <span className="text-[10px] font-mono text-violet-400/70">{item.label}:</span>
                <span className="text-[10px] font-mono text-violet-300 font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
