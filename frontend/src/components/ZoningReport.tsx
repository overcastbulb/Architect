"use client";

import { LayoutResponse } from "@/types";

interface Props {
  layout: LayoutResponse | null;
}

export default function ZoningReport({ layout }: Props) {
  if (!layout) {
    return (
      <div className="p-5 h-full flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 border border-arch-border rounded-xl flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 3v9M10 15v1" stroke="#3a4055" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="10" r="8" stroke="#3a4055" strokeWidth="1.2" />
          </svg>
        </div>
        <p className="text-xs text-arch-text-dim leading-relaxed">
          Zoning compliance report will appear here after generation.
        </p>
      </div>
    );
  }

  const pass = layout.compliance_report === "PASS";

  return (
    <div className="p-5 space-y-5 animate-slide-up">
      {/* Header */}
      <div>
        <h2 className="font-display font-700 text-sm text-white tracking-tight">Zoning Report</h2>
        <p className="text-xs text-arch-text-dim mt-0.5">Compliance analysis</p>
      </div>

      {/* Status badge */}
      <div
        className={`rounded-xl p-4 border flex items-center gap-4 ${
          pass
            ? "bg-arch-pass/10 border-arch-pass/30"
            : "bg-arch-fail/10 border-arch-fail/30"
        }`}
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-display font-800 ${
            pass ? "bg-arch-pass/20 text-arch-pass" : "bg-arch-fail/20 text-arch-fail"
          }`}
        >
          {pass ? "✓" : "✗"}
        </div>
        <div>
          <div
            className={`text-xl font-display font-800 tracking-tight ${
              pass ? "text-arch-pass" : "text-arch-fail"
            }`}
          >
            {layout.compliance_report}
          </div>
          <div className="text-xs text-arch-text-dim mt-0.5">
            {pass ? "All zoning rules satisfied" : `${layout.violations.length} violation${layout.violations.length !== 1 ? "s" : ""} detected`}
          </div>
        </div>
      </div>

      {/* Violations */}
      {layout.violations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-arch-fail rounded-full" />
            <span className="text-xs font-display font-600 text-white uppercase tracking-widest">Violations</span>
          </div>
          {layout.violations.map((v, i) => (
            <div
              key={i}
              className="p-3 bg-arch-fail/5 border border-arch-fail/20 rounded-lg flex gap-2"
            >
              <span className="text-arch-fail mt-0.5 shrink-0">⚠</span>
              <p className="text-xs text-arch-text leading-relaxed">{v}</p>
            </div>
          ))}
        </div>
      )}

      {pass && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-arch-pass rounded-full" />
            <span className="text-xs font-display font-600 text-white uppercase tracking-widest">All Clear</span>
          </div>
          {["Setback ≥ 3m on all sides", "Floor count within limit", "Building coverage ≤ 60%"].map(
            (rule) => (
              <div key={rule} className="p-2.5 bg-arch-pass/5 border border-arch-pass/20 rounded-lg flex gap-2 items-center">
                <span className="text-arch-pass text-sm">✓</span>
                <p className="text-xs text-arch-text-dim">{rule}</p>
              </div>
            )
          )}
        </div>
      )}

      <hr className="border-arch-border" />

      {/* Metrics */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-arch-accent rounded-full" />
          <span className="text-xs font-display font-600 text-white uppercase tracking-widest">Metrics</span>
        </div>

        {[
          {
            label: "Building Coverage",
            value: `${layout.coverage}%`,
            sub: "Max 60%",
            warn: layout.coverage > 60,
          },
          {
            label: "Total Floors",
            value: layout.floors,
            sub: "Max 5",
            warn: layout.floors > 5,
          },
          {
            label: "Floor Area",
            value: `${layout.dimensions.total_floor_area.toFixed(0)} m²`,
            sub: `Per floor`,
            warn: false,
          },
          {
            label: "Plot Area",
            value: `${(layout.dimensions.plot_width * layout.dimensions.plot_length).toFixed(0)} m²`,
            sub: `${layout.dimensions.plot_width}×${layout.dimensions.plot_length}m`,
            warn: false,
          },
        ].map((m) => (
          <div
            key={m.label}
            className="flex items-center justify-between p-3 bg-arch-surface border border-arch-border rounded-lg"
          >
            <div>
              <div className="text-xs text-arch-text-dim">{m.label}</div>
              <div className="text-xs text-arch-text-dim/60 mt-0.5">{m.sub}</div>
            </div>
            <div
              className={`text-sm font-mono font-medium ${
                m.warn ? "text-arch-fail" : "text-arch-accent"
              }`}
            >
              {m.value}
            </div>
          </div>
        ))}
      </div>

      <hr className="border-arch-border" />

      {/* Zoning Rules Reference */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-arch-muted rounded-full" />
          <span className="text-xs font-display font-600 text-arch-text-dim uppercase tracking-widest">Rules Applied</span>
        </div>
        <div className="space-y-1.5 text-xs font-mono text-arch-text-dim">
          <div className="flex justify-between">
            <span>Min Setback</span><span className="text-arch-text">3.0 m</span>
          </div>
          <div className="flex justify-between">
            <span>Max Floors</span><span className="text-arch-text">5</span>
          </div>
          <div className="flex justify-between">
            <span>Max Coverage</span><span className="text-arch-text">60%</span>
          </div>
        </div>
      </div>

      {/* Room breakdown */}
      <hr className="border-arch-border" />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-arch-accent rounded-full" />
          <span className="text-xs font-display font-600 text-white uppercase tracking-widest">Rooms ({layout.rooms.length})</span>
        </div>
        <div className="space-y-1">
          {layout.rooms.map((room) => (
            <div key={room.id} className="flex items-center justify-between text-xs">
              <span className="text-arch-text-dim">{room.label}</span>
              <span className="font-mono text-arch-text">{room.area.toFixed(1)} m²</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
