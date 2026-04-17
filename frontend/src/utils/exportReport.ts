import { AIInterpretation, AddressData, LayoutData, ZoningReport } from "@/types";

interface ExportProps {
    zoning: ZoningReport;
    layout: LayoutData;
    interpretation: AIInterpretation | null;
    addressData: AddressData | null;
}

export function generatePDFReport({ zoning, layout, interpretation, addressData }: ExportProps) {
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    const statusColor = zoning.overall_status === "PASS" ? "#22c55e" : zoning.overall_status === "WARNING" ? "#f59e0b" : "#ef4444";

    const rulesHTML = zoning.rules.map(rule => {
        const color = rule.status === "OK" ? "#22c55e" : rule.status === "WARNING" ? "#f59e0b" : "#ef4444";
        const reasoning = zoning.ai_reasoning?.rule_reasoning?.[rule.rule_name] || "";
        return `
      <div style="border:1px solid #1e2230; border-radius:8px; padding:12px 14px; margin-bottom:8px; background:#0d1117;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span style="font-size:12px; color:#c8d0e8; font-weight:600;">${rule.rule_name}</span>
            <span style="font-size:11px; color:#6b7394; margin-left:8px;">${rule.message}</span>
          </div>
          <span style="font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px; background:${color}22; color:${color}; border:1px solid ${color}44;">
            ${rule.status}
          </span>
        </div>
        ${reasoning ? `<p style="font-size:11px; color:#8892b0; margin-top:6px; font-style:italic; line-height:1.5;">${reasoning}</p>` : ""}
      </div>
    `;
    }).join("");

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8"/>
      <title>Architect.ai — Zoning Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0c10; color: #c8d0e8; font-family: 'Segoe UI', sans-serif; padding: 40px; }
        .header { border-bottom: 1px solid #1e2230; padding-bottom: 20px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
        .logo { font-size: 13px; font-weight: 700; letter-spacing: 0.2em; color: #e8ff47; text-transform: uppercase; }
        .title { font-size: 22px; font-weight: 700; color: white; margin-top: 6px; }
        .meta { font-size: 11px; color: #6b7394; margin-top: 4px; }
        .section { margin-bottom: 24px; }
        .section-title { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #6b7394; margin-bottom: 12px; }
        .zone-badge { display: inline-flex; align-items: center; gap: 8px; background: #e8ff4711; border: 1px solid #e8ff4733; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; }
        .zone-code { font-size: 11px; font-weight: 700; color: #e8ff47; background: #e8ff4722; border: 1px solid #e8ff4744; border-radius: 4px; padding: 2px 6px; }
        .zone-name { font-size: 13px; color: white; font-weight: 600; }
        .zone-auth { font-size: 11px; color: #6b7394; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border-radius: 6px; font-size: 13px; font-weight: 700; background: ${statusColor}22; color: ${statusColor}; border: 1px solid ${statusColor}44; margin-bottom: 12px; }
        .metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .metric { background: #111318; border: 1px solid #1e2230; border-radius: 8px; padding: 10px 12px; }
        .metric-label { font-size: 10px; color: #6b7394; }
        .metric-value { font-size: 14px; font-weight: 700; color: white; margin-top: 2px; font-family: monospace; }
        .verdict { background: #0d1117; border: 1px solid #e8ff4722; border-radius: 10px; padding: 14px 16px; margin-top: 16px; }
        .verdict-title { font-size: 10px; font-weight: 700; letter-spacing: 0.15em; text-transform: uppercase; color: #e8ff47; margin-bottom: 8px; }
        .verdict-text { font-size: 12px; color: #9ca3be; line-height: 1.6; }
        .footer { border-top: 1px solid #1e2230; padding-top: 16px; margin-top: 32px; display: flex; justify-content: space-between; }
        .footer-text { font-size: 10px; color: #6b7394; }
        .disclaimer { font-size: 10px; color: #6b7394; font-style: italic; margin-top: 4px; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="logo">architect.ai</div>
          <div class="title">Zoning Feasibility Report</div>
          <div class="meta">${addressData?.address || "No address specified"}</div>
          <div class="meta">Generated: ${dateStr} at ${timeStr}</div>
        </div>
        <div class="status-badge">${zoning.overall_status}</div>
      </div>

      ${zoning.zone_info ? `
      <div class="section">
        <div class="section-title">Zone Information</div>
        <div class="zone-badge">
          <span class="zone-code">${zoning.zone_info.zone_code}</span>
          <div>
            <div class="zone-name">${zoning.zone_info.zone_name}</div>
            <div class="zone-auth">${zoning.zone_info.city} · ${zoning.zone_info.authority} · ${zoning.zone_info.source}</div>
          </div>
        </div>
      </div>
      ` : ""}

      <div class="section">
        <div class="section-title">Key Metrics</div>
        <div class="metrics">
          <div class="metric"><div class="metric-label">FSI</div><div class="metric-value">${zoning.fsi}</div></div>
          <div class="metric"><div class="metric-label">Coverage</div><div class="metric-value">${zoning.coverage}%</div></div>
          <div class="metric"><div class="metric-label">Height</div><div class="metric-value">${zoning.building_height}m</div></div>
          <div class="metric"><div class="metric-label">Floors</div><div class="metric-value">${layout.floors}</div></div>
          <div class="metric"><div class="metric-label">Plot</div><div class="metric-value">${layout.dimensions.plot_width}×${layout.dimensions.plot_length}m</div></div>
          <div class="metric"><div class="metric-label">Building Type</div><div class="metric-value">${interpretation?.building_type || "N/A"}</div></div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Rule Compliance</div>
        ${rulesHTML}
      </div>

      ${zoning.ai_reasoning?.summary ? `
      <div class="verdict">
        <div class="verdict-title">AI Verdict</div>
        <div class="verdict-text">${zoning.ai_reasoning.summary}</div>
      </div>
      ` : ""}

      <div class="footer">
        <div>
          <div class="footer-text">architect.ai — AI Architecture Platform</div>
          <div class="disclaimer">* Constraints are indicative. Verify with local municipal authority before construction.</div>
        </div>
        <div class="footer-text">architect-ai-startup.vercel.app</div>
      </div>
    </body>
    </html>
  `;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (win) {
        win.onload = () => {
            win.print();
        };
    }
}