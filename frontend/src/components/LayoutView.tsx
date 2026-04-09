"use client";

import { LayoutResponse, Room } from "@/types";
import { useRef, Fragment } from "react";

interface Props {
  layout: LayoutResponse;
}

const ROOM_COLORS: Record<string, { fill: string; stroke: string; text: string }> = {
  living_room: { fill: "#1e3a5f", stroke: "#3b82f6", text: "#93c5fd" },
  kitchen: { fill: "#431407", stroke: "#f59e0b", text: "#fcd34d" },
  bedroom: { fill: "#2e1065", stroke: "#8b5cf6", text: "#c4b5fd" },
  bathroom: { fill: "#052e16", stroke: "#10b981", text: "#6ee7b7" },
};

function getRoomColor(type: string) {
  for (const key of Object.keys(ROOM_COLORS)) {
    if (type.includes(key)) return ROOM_COLORS[key];
  }
  return { fill: "#1c2232", stroke: "#3a4055", text: "#6b7394" };
}

export default function LayoutView({ layout }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);

  const { rooms, dimensions, building_width, building_length } = layout;
  const { plot_width, plot_length, setback } = dimensions;

  // SVG canvas config
  const canvasPad = 40;
  const labelH = 28;
  const scale = Math.min(
    (600 - canvasPad * 2) / plot_width,
    (580 - canvasPad * 2) / plot_length
  );

  const svgW = plot_width * scale + canvasPad * 2;
  const svgH = plot_length * scale + canvasPad * 2 + labelH;

  // Pixel positions
  const plotX = canvasPad;
  const plotY = canvasPad + labelH;
  const setbackPx = setback * scale;
  const buildX = plotX + setbackPx;
  const buildY = plotY + setbackPx;

  function handleDownload() {
    const svg = svgRef.current;
    if (!svg) return;
    const data = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([data], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "floor-plan.svg";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="h-full flex flex-col items-center justify-center bg-arch-bg p-6">
      <div className="flex items-center justify-between w-full max-w-2xl mb-4">
        <div>
          <h3 className="font-display font-700 text-sm text-white">Floor Plan</h3>
          <p className="text-xs text-arch-text-dim mt-0.5">
            Ground floor · {building_width}m × {building_length}m
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="text-xs font-mono px-3 py-1.5 rounded-lg border border-arch-border text-arch-text-dim hover:text-arch-accent hover:border-arch-accent transition-all"
        >
          ↓ EXPORT SVG
        </button>
      </div>

      <div className="bg-arch-surface border border-arch-border rounded-2xl p-4 overflow-auto">
        <svg
          ref={svgRef}
          width={svgW}
          height={svgH}
          viewBox={`0 0 ${svgW} ${svgH}`}
          xmlns="http://www.w3.org/2000/svg"
          style={{ background: "#0a0c10" }}
        >
          <defs>
            <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
              <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#1e2230" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Grid background */}
          <rect x={plotX} y={plotY} width={plot_width * scale} height={plot_length * scale} fill="url(#grid)" />

          {/* Plot boundary */}
          <rect
            x={plotX}
            y={plotY}
            width={plot_width * scale}
            height={plot_length * scale}
            fill="none"
            stroke="#3a4055"
            strokeWidth="1.5"
            strokeDasharray="6 3"
          />

          {/* Setback zone shading */}
          <rect
            x={plotX}
            y={plotY}
            width={plot_width * scale}
            height={plot_length * scale}
            fill="#e8ff4706"
          />
          <rect
            x={buildX}
            y={buildY}
            width={building_width * scale}
            height={building_length * scale}
            fill="#0a0c10"
          />

          {/* Building outline */}
          <rect
            x={buildX}
            y={buildY}
            width={building_width * scale}
            height={building_length * scale}
            fill="none"
            stroke="#e8ff47"
            strokeWidth="1.5"
          />

          {/* Rooms */}
          {rooms.map((room: Room) => {
            const colors = getRoomColor(room.type);
            const rx = buildX + room.x * scale;
            const ry = buildY + room.y * scale;
            const rw = room.width * scale;
            const rh = room.height * scale;
            const fontSize = Math.max(8, Math.min(11, rw / 9));
            const subFontSize = Math.max(7, fontSize - 1.5);

            return (
              <g key={room.id}>
                <rect
                  x={rx + 1}
                  y={ry + 1}
                  width={rw - 2}
                  height={rh - 2}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth="1"
                  rx="1"
                />
                {rw > 30 && rh > 20 && (
                  <>
                    <text
                      x={rx + rw / 2}
                      y={ry + rh / 2 - 5}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={colors.text}
                      fontSize={fontSize}
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="500"
                    >
                      {room.label}
                    </text>
                    <text
                      x={rx + rw / 2}
                      y={ry + rh / 2 + subFontSize + 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                      fill={colors.stroke}
                      fontSize={subFontSize}
                      fontFamily="JetBrains Mono, monospace"
                      opacity="0.7"
                    >
                      {room.width.toFixed(1)}×{room.height.toFixed(1)}m
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {/* Setback dimension labels */}
          <text x={plotX + 2} y={plotY - 6} fill="#6b7394" fontSize="9" fontFamily="JetBrains Mono, monospace">
            Plot: {plot_width}m × {plot_length}m · Setback: {setback}m
          </text>

          {/* North arrow */}
          <g transform={`translate(${svgW - 28}, ${plotY + 20})`}>
            <circle r="12" fill="#111318" stroke="#1e2230" />
            <path d="M0 -8 L3 4 L0 2 L-3 4 Z" fill="#e8ff47" />
            <text y="5" textAnchor="middle" fill="#6b7394" fontSize="7" fontFamily="JetBrains Mono, monospace">N</text>
          </g>
        </svg>
      </div>

      {/* Room table */}
      <div className="mt-4 w-full max-w-2xl">
        <div className="grid grid-cols-4 gap-px bg-arch-border rounded-xl overflow-hidden text-xs font-mono">
          <div className="bg-arch-surface px-3 py-2 text-arch-text-dim uppercase tracking-wider">Room</div>
          <div className="bg-arch-surface px-3 py-2 text-arch-text-dim uppercase tracking-wider">W × L</div>
          <div className="bg-arch-surface px-3 py-2 text-arch-text-dim uppercase tracking-wider">Area</div>
          <div className="bg-arch-surface px-3 py-2 text-arch-text-dim uppercase tracking-wider">Type</div>
          {rooms.map((room: Room) => {
            const colors = getRoomColor(room.type);
            return (
              <Fragment key={room.id}>
                <div className="bg-arch-bg px-3 py-2 text-arch-text">{room.label}</div>
                <div className="bg-arch-bg px-3 py-2 text-arch-text-dim">
                  {room.width.toFixed(1)} × {room.height.toFixed(1)} m
                </div>
                <div className="bg-arch-bg px-3 py-2 text-arch-text-dim">{room.area.toFixed(1)} m²</div>
                <div className="bg-arch-bg px-3 py-2">
                  <span className="px-2 py-0.5 rounded text-xs" style={{ color: colors.text, background: colors.fill }}>
                    {room.type.replace("_", " ")}
                  </span>
                </div>
              </Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}
