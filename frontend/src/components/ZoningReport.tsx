"use client";

import { ZoningReport as ZoningReportType, ZoningRule, LayoutData } from "@/types";

interface Props {
  zoning: ZoningReportType | null;
  layout: LayoutData | null;
  loading: boolean;
}

function StatusIcon({ status }: { status: string }) {
  if (status === "OK") {
    return (
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 8.5L6.5 12L13 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "WARNING") {
    return (
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 2L1.5 13.5h13L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <path d="M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="8" cy="12" r="0.75" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorClass =
    status === "OK"
      ? "bg-[rgba(34,197,94,0.15)] text-[#22c55e] border border-[rgba(34,197,94,0.3)]"
      : status === "WARNING"
      ? "bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(245,158,11,0.3)]"
      : "bg-[rgba(239,68,68,0.15)] text-[#ef4444] border border-[rgba(239,68,68,0.3)]";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold ${colorClass}`}>
      <StatusIcon status={status} /> {status}
    </span>
  );
}

function OverallStatusIcon({ status }: { status: string }) {
  if (status === "PASS") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (status === "WARNING") {
    return (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 3L2 21h20L12 3z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 10v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="18" r="1" fill="currentColor" />
      </svg>
    );
  }
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

function OverallBadge({ status }: { status: string }) {
  const config = {
    PASS: {
      bg: "bg-arch-pass/10",
      border: "border-arch-pass/30",
      text: "text-arch-pass",
      label: "All Rules Passed",
    },
    WARNING: {
      bg: "bg-arch-warn/10",
      border: "border-arch-warn/30",
      text: "text-arch-warn",
      label: "Warnings Detected",
    },
    FAIL: {
      bg: "bg-arch-fail/10",
      border: "border-arch-fail/30",
      text: "text-arch-fail",
      label: "Violations Found",
    },
  }[status] || {
    bg: "bg-arch-surface",
    border: "border-arch-border",
    text: "text-arch-text-dim",
    label: status,
  };

  return (
    <div className={`rounded-xl p-4 border flex items-center gap-4 ${config.bg} ${config.border}`}>
      <div
        className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold ${config.text}`}
        style={{ background: `${config.text === "text-arch-pass" ? "rgba(34,197,94,0.15)" : config.text === "text-arch-warn" ? "rgba(245,158,11,0.15)" : "rgba(239,68,68,0.15)"}` }}
      >
        <OverallStatusIcon status={status} />
      </div>
      <div>
        <div className={`text-lg font-bold tracking-tight ${config.text}`}>
          {status}
        </div>
        <div className="text-[11px] text-arch-text-dim mt-0.5">{config.label}</div>
      </div>
    </div>
  );
}

function SkeletonReport() {
  return (
    <div className="p-5 space-y-4 animate-fade-in">
      <div className="skeleton h-5 w-32" />
      <div className="skeleton h-20 w-full" />
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton h-12 w-full" style={{ animationDelay: `${i * 100}ms` }} />
        ))}
      </div>
      <div className="skeleton h-4 w-48 mt-4" />
      <div className="space-y-1.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton h-8 w-full" style={{ animationDelay: `${i * 80}ms` }} />
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="p-5 h-full flex flex-col items-center justify-center text-center gap-4">
      <div className="w-14 h-14 border border-arch-border rounded-2xl flex items-center justify-center bg-arch-surface">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M9 12h6M12 9v6" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
          <rect x="3" y="3" width="18" height="18" rx="4" stroke="#475569" strokeWidth="1.2" />
        </svg>
      </div>
      <div>
        <p className="text-sm text-arch-text-dim font-medium">No Report Yet</p>
        <p className="text-xs text-arch-text-dim/60 mt-1 leading-relaxed max-w-[200px] mx-auto">
          Enter a prompt and generate a design to see the zoning compliance report.
        </p>
      </div>
    </div>
  );
}

export default function ZoningReport({ zoning, layout, loading }: Props) {
  if (loading) return <SkeletonReport />;
  if (!zoning || !layout) return <EmptyState />;

  return (
    <div className="p-5 space-y-5 animate-slide-up overflow-y-auto h-full">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-arch-accent/15 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1L2 4v6l5 3 5-3V4L7 1z" stroke="#3B82F6" strokeWidth="1.2" fill="none" />
            <path d="M7 7v6M2 4l5 3 5-3" stroke="#3B82F6" strokeWidth="1" />
          </svg>
        </div>
        <div>
          <h2 className="font-semibold text-sm text-white tracking-tight">Zoning Report</h2>
          <p className="text-[10px] text-arch-text-dim">Compliance analysis</p>
        </div>
      </div>

      {/* Zone info */}
      {zoning.zone_info && (
        <div className="rounded-xl p-3.5 bg-arch-accent/8 border border-arch-accent/20 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-arch-accent/20 text-arch-accent-light border border-arch-accent/30">
              {zoning.zone_info.zone_code}
            </span>
            <span className="text-xs text-white font-medium">
              {zoning.zone_info.zone_name}
            </span>
          </div>
          <div className="text-[10px] text-arch-text-dim font-mono leading-relaxed space-y-0.5">
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-arch-accent-light opacity-60 shrink-0">
                <path d="M8 1C5.2 1 3 3.2 3 6c0 4 5 9 5 9s5-5 5-9c0-2.8-2.2-5-5-5z" stroke="currentColor" strokeWidth="1.2" />
                <circle cx="8" cy="6" r="1.5" stroke="currentColor" strokeWidth="1" />
              </svg>
              {zoning.zone_info.city} &mdash; {zoning.zone_info.authority}
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-arch-accent-light opacity-60 shrink-0">
                <rect x="2" y="2" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 6h6M5 8h6M5 10h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              {zoning.zone_info.source}
            </div>
          </div>
        </div>
      )}

      {!zoning.zone_info && (
        <div className="rounded-xl p-3 bg-arch-surface-2 border border-arch-border space-y-1">
          <span className="text-[10px] font-mono text-arch-text-dim flex items-center gap-1.5">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" className="text-arch-accent shrink-0">
              <path d="M8 2l2 5h4l-3.5 3 1.5 5L8 12l-4 3 1.5-5L2 7h4l2-5z" stroke="currentColor" strokeWidth="1.2" fill="none" />
            </svg>
            Using default mock rules &mdash; enter an address for real zoning data
          </span>
        </div>
      )}

      {/* Overall status */}
      <OverallBadge status={zoning.overall_status} />

      {/* Rule-by-rule compliance */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-arch-accent rounded-full" />
          <span className="text-xs font-semibold text-white uppercase tracking-widest">
            Rule Compliance
          </span>
        </div>

        <div className="space-y-1.5">
          {zoning.rules.map((rule: ZoningRule, i: number) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 bg-arch-surface border border-arch-border rounded-lg hover:border-arch-border-2 transition-colors"
            >
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-medium text-arch-text">
                  {rule.rule_name}
                </div>
                <div className="text-[10px] text-arch-text-dim font-mono mt-0.5">
                  {rule.message}
                </div>
              </div>
              <div className="shrink-0 ml-2">
                <StatusBadge status={rule.status} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Violations detail */}
      {zoning.violations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-1 h-3 bg-arch-fail rounded-full" />
            <span className="text-xs font-semibold text-white uppercase tracking-widest">
              Violations
            </span>
          </div>
          {zoning.violations.map((v, i) => (
            <div
              key={i}
              className="p-3 bg-arch-fail/5 border border-arch-fail/20 rounded-lg flex gap-2"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="text-arch-fail mt-0.5 shrink-0">
                <path d="M8 2L1.5 13.5h13L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="12" r="0.75" fill="currentColor" />
              </svg>
              <p className="text-[11px] text-arch-text leading-relaxed">{v}</p>
            </div>
          ))}
        </div>
      )}

      <hr className="border-arch-border" />

      {/* Key metrics */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-arch-accent rounded-full" />
          <span className="text-xs font-semibold text-white uppercase tracking-widest">
            Metrics
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            {
              label: "FSI",
              value: zoning.fsi.toFixed(2),
              limit: `Max ${zoning.rules_applied.max_fsi}`,
              warn: zoning.fsi > zoning.rules_applied.max_fsi,
            },
            {
              label: "Coverage",
              value: `${zoning.coverage}%`,
              limit: `Max ${zoning.rules_applied.max_coverage_pct}%`,
              warn: zoning.coverage > zoning.rules_applied.max_coverage_pct,
            },
            {
              label: "Height",
              value: `${zoning.building_height}m`,
              limit: `Max ${zoning.rules_applied.max_height_m}m`,
              warn: zoning.building_height > zoning.rules_applied.max_height_m,
            },
            {
              label: "Plot Area",
              value: `${(layout.dimensions.plot_width * layout.dimensions.plot_length).toFixed(0)} m²`,
              limit: `${layout.dimensions.plot_width}×${layout.dimensions.plot_length}m`,
              warn: false,
            },
          ].map((m) => (
            <div
              key={m.label}
              className="p-3 bg-arch-surface border border-arch-border rounded-lg"
            >
              <div className="text-[10px] text-arch-text-dim">{m.label}</div>
              <div
                className={`text-sm font-mono font-semibold mt-0.5 ${
                  m.warn ? "text-arch-fail" : "text-arch-text"
                }`}
              >
                {m.value}
              </div>
              <div className="text-[9px] text-arch-text-dim/60 font-mono mt-0.5">
                {m.limit}
              </div>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-arch-border" />

      {/* Room breakdown */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-arch-accent rounded-full" />
          <span className="text-xs font-semibold text-white uppercase tracking-widest">
            Rooms ({layout.rooms.length})
          </span>
        </div>
        <div className="space-y-1">
          {layout.rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between text-[11px] px-2 py-1"
            >
              <span className="text-arch-text-dim">{room.label}</span>
              <span className="font-mono text-arch-text">
                {room.area.toFixed(1)} m²
              </span>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-arch-border" />

      {/* Rules reference */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-1 h-3 bg-arch-muted rounded-full" />
          <span className="text-xs font-semibold text-arch-text-dim uppercase tracking-widest">
            Rules Applied
          </span>
        </div>
        <div className="space-y-1 text-[11px] font-mono text-arch-text-dim">
          {[
            { label: "Max FSI", value: zoning.rules_applied.max_fsi },
            { label: "Max Floors", value: zoning.rules_applied.max_floors },
            { label: "Max Height", value: `${zoning.rules_applied.max_height_m}m` },
            { label: "Front Setback", value: `≥ ${zoning.rules_applied.min_setback_front_m}m` },
            { label: "Side Setback", value: `≥ ${zoning.rules_applied.min_setback_side_m}m` },
            { label: "Max Coverage", value: `${zoning.rules_applied.max_coverage_pct}%` },
          ].map((r) => (
            <div key={r.label} className="flex justify-between px-2">
              <span>{r.label}</span>
              <span className="text-arch-text">{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
