"use client";

// ---------------------------------------------------------------------------
// TypologyPresets — Architectural Typology Preset Selector
// A horizontal row of clickable building-type cards that generate
// city-aware, zone-aware prompt suggestions.
// ---------------------------------------------------------------------------

// ---- SVG Icons (inline — no external library) ----

const VillaIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M10 2.5L17.5 8V18H12.5V13H7.5V18H2.5V8L10 2.5Z"
      stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <rect x="8" y="5" width="4" height="3" rx="0.5"
      stroke="currentColor" strokeWidth="1.1" />
  </svg>
);

const ApartmentIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="4" y="2.5" width="12" height="15.5" rx="0.5"
      stroke="currentColor" strokeWidth="1.4" />
    <rect x="6.5" y="5" width="2.2" height="2.2" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
    <rect x="11.3" y="5" width="2.2" height="2.2" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
    <rect x="6.5" y="9" width="2.2" height="2.2" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
    <rect x="11.3" y="9" width="2.2" height="2.2" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
    <rect x="6.5" y="13" width="2.2" height="2.2" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
    <rect x="11.3" y="13" width="2.2" height="2.2" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
  </svg>
);

const OfficeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="2" y="4.5" width="16" height="13.5" rx="0.5"
      stroke="currentColor" strokeWidth="1.4" />
    <line x1="2" y1="8.5" x2="18" y2="8.5" stroke="currentColor" strokeWidth="1" />
    <line x1="2" y1="12.5" x2="18" y2="12.5" stroke="currentColor" strokeWidth="1" />
    <line x1="7" y1="4.5" x2="7" y2="18" stroke="currentColor" strokeWidth="1" />
    <line x1="13" y1="4.5" x2="13" y2="18" stroke="currentColor" strokeWidth="1" />
    <path d="M3 3H17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M5 2H15" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeOpacity="0.5" />
  </svg>
);

const MixedUseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <rect x="3" y="2" width="14" height="16" rx="0.5"
      stroke="currentColor" strokeWidth="1.4" />
    <line x1="3" y1="12" x2="17" y2="12" stroke="currentColor" strokeWidth="1.1" />
    <rect x="6" y="13" width="8" height="5" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
    <rect x="6.5" y="4.5" width="2.2" height="2.2" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
    <rect x="11.3" y="4.5" width="2.2" height="2.2" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
    <rect x="6.5" y="8.2" width="2.2" height="2.2" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
    <rect x="11.3" y="8.2" width="2.2" height="2.2" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
  </svg>
);

const WarehouseIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <path d="M1.5 9.5L10 4.5L18.5 9.5V18H1.5V9.5Z"
      stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
    <line x1="1.5" y1="9.5" x2="18.5" y2="9.5" stroke="currentColor" strokeWidth="1" />
    <rect x="7.5" y="12.5" width="5" height="5.5" rx="0.3"
      stroke="currentColor" strokeWidth="1.1" />
    <rect x="3" y="11.5" width="2.5" height="2.5" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
    <rect x="14.5" y="11.5" width="2.5" height="2.5" rx="0.3"
      stroke="currentColor" strokeWidth="1" />
  </svg>
);

// ---- Types ----

export interface TypologyPreset {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  /** Template string. Placeholders: {plot}, {city} */
  basePrompt: string;
  /** Which plot size to use for this typology */
  plotSize: string;
  /** Whether this typology uses floors (false = single-floor) */
  multiFloor: boolean;
}

// ---- Preset definitions ----

export const TYPOLOGY_PRESETS: TypologyPreset[] = [
  {
    id: "villa",
    label: "Villa",
    icon: <VillaIcon />,
    description: "Private residential",
    basePrompt:
      "Design a compliant single-floor villa on a {plot}m plot{city} with 4 bedrooms, 3 bathrooms, one kitchen, a living room, a garden, and covered parking for 2 cars.",
    plotSize: "15m x 20m",
    multiFloor: false,
  },
  {
    id: "apartment",
    label: "Apartment",
    icon: <ApartmentIcon />,
    description: "Multi-unit residential",
    basePrompt:
      "Design a compliant {floors}-floor residential apartment building on a {plot}m plot{city} with 2BHK units per floor, stilt parking, and a common lobby.",
    plotSize: "20m x 30m",
    multiFloor: true,
  },
  {
    id: "office",
    label: "Office",
    icon: <OfficeIcon />,
    description: "Commercial workspace",
    basePrompt:
      "Plan a compliant {floors}-floor commercial office building on a {plot}m plot{city} with open-plan floors, reception, meeting rooms, washrooms, and basement parking.",
    plotSize: "20m x 30m",
    multiFloor: true,
  },
  {
    id: "mixed",
    label: "Mixed Use",
    icon: <MixedUseIcon />,
    description: "Retail + residential",
    basePrompt:
      "Design a compliant {floors}-floor mixed-use building on a {plot}m plot{city} with retail and commercial space on the ground floor and residential units on upper floors.",
    plotSize: "20m x 30m",
    multiFloor: true,
  },
  {
    id: "warehouse",
    label: "Warehouse",
    icon: <WarehouseIcon />,
    description: "Industrial storage",
    basePrompt:
      "Plan a compliant single-floor warehouse and logistics facility on a {plot}m plot{city} with high-ceiling storage, loading bays, a small office section, and perimeter parking.",
    plotSize: "30m x 40m",
    multiFloor: false,
  },
];

// ---- Component ----

interface TypologyPresetsProps {
  activePresetId: string | null;
  onSelect: (preset: TypologyPreset) => void;
  disabled?: boolean;
}

export default function TypologyPresets({
  activePresetId,
  onSelect,
  disabled = false,
}: TypologyPresetsProps) {
  return (
    <div className="space-y-2">
      {/* Label — matches AddressInput and Example Prompts label style */}
      <p className="text-xs font-mono uppercase tracking-[0.15em] text-arch-text-dim">
        Building Type:
      </p>

      {/* Scrollable preset row */}
      <div
        className="flex gap-2 overflow-x-auto pb-0.5"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as React.CSSProperties}
      >
        {TYPOLOGY_PRESETS.map((preset) => {
          const isActive = activePresetId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => !disabled && onSelect(preset)}
              disabled={disabled}
              aria-pressed={isActive}
              aria-label={`${preset.label} — ${preset.description}`}
              className={[
                "flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5",
                "min-w-[82px] flex-shrink-0 cursor-pointer select-none",
                "transition-all duration-200",
                isActive
                  ? "border-arch-accent bg-arch-accent/10 text-arch-accent shadow-[0_0_0_1px_rgba(232,255,71,0.2)]"
                  : "border-arch-border bg-arch-bg text-arch-text-dim hover:border-arch-border-2 hover:text-arch-text hover:bg-arch-surface",
                disabled ? "opacity-50 pointer-events-none" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {/* Icon */}
              <span
                className={`transition-colors duration-200 ${
                  isActive ? "text-arch-accent" : "text-arch-text-dim"
                }`}
              >
                {preset.icon}
              </span>

              {/* Label */}
              <span
                className={`text-xs font-semibold leading-none transition-colors duration-200 ${
                  isActive ? "text-arch-accent" : "text-arch-text"
                }`}
              >
                {preset.label}
              </span>

              {/* Description */}
              <span className="text-[9px] leading-tight text-arch-text-dim text-center">
                {preset.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
