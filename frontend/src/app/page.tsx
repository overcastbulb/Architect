"use client";

import { FormEvent, useMemo, useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import LayoutView from "@/components/LayoutView";
import ThreeScene from "@/components/ThreeScene";
import AddressInput from "@/components/AddressInput";
import { generatePDFReport } from "@/utils/exportReport";
import TypologyPresets, { TypologyPreset } from "@/components/TypologyPresets";


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

const ARCH_KEYWORDS = [
  "floor", "floors", "storey", "storeys", "story", "stories",
  "bedroom", "bedrooms", "room", "rooms", "bathroom", "bathrooms",
  "kitchen", "office", "apartment", "house", "villa", "building",
  "commercial", "residential", "plot", "sqft", "sq ft", "sqm",
  "studio", "duplex", "bungalow", "penthouse", "warehouse",
];

// ---------------------------------------------------------------------------
// City-aware prompt suggestions
// ---------------------------------------------------------------------------

/**
 * Ordered pairs of [cityLabel, keywords]. Navi Mumbai must come before Mumbai
 * so its more-specific keywords win before the "mumbai" substring matches.
 */
const CITY_KEYWORDS: [string, string[]][] = [
  ["Navi Mumbai", ["navi mumbai", "new mumbai", "vashi", "kharghar", "belapur", "nerul", "airoli", "panvel", "kopar khairane", "sanpada", "seawoods", "ulwe", "taloja", "cidco"]],
  ["Mumbai",      ["mumbai", "bombay", "bandra", "andheri", "worli", "powai", "malad", "borivali", "dadar", "kurla", "goregaon", "juhu", "colaba", "bkc", "brihanmumbai"]],
  ["Pune",        ["pune", "pmrda", "pimpri", "chinchwad", "hinjewadi", "kothrud", "hadapsar", "wakad", "baner", "koregaon", "viman nagar", "kharadi", "aundh", "shivajinagar"]],
  ["Delhi",       ["delhi", "new delhi", "nct of delhi", "dwarka", "rohini", "saket", "karol bagh", "lajpat nagar", "vasant kunj", "janakpuri", "pitampura", "noida", "gurgaon", "gurugram"]],
  ["Bangalore",   ["bangalore", "bengaluru", "whitefield", "koramangala", "indiranagar", "jayanagar", "hsr layout", "electronic city", "marathahalli", "hebbal", "yelahanka", "jp nagar", "btm"]],
  ["Hyderabad",   ["hyderabad", "secunderabad", "hitec city", "hitech city", "gachibowli", "madhapur", "banjara hills", "jubilee hills", "kukatpally", "miyapur", "kondapur", "begumpet", "ameerpet", "charminar", "telangana"]],
  ["Chennai",     ["chennai", "madras", "anna nagar", "t nagar", "adyar", "velachery", "tambaram", "porur", "guindy", "sholinganallur", "mylapore", "perambur", "nungambakkam"]],
  ["Ahmedabad",   ["ahmedabad", "ahemdabad", "ahmadabad", "satellite", "bodakdev", "prahlad nagar", "thaltej", "vastrapur", "navrangpura", "maninagar", "bopal", "sg highway"]],
  ["Surat",       ["surat", "adajan", "vesu", "piplod", "athwa", "varachha", "katargam", "dumas"]],
  ["Nashik",      ["nashik", "nasik", "gangapur", "panchavati", "cidco nashik"]],
];

function detectCityFromAddress(address: string): string | null {
  const lower = address.toLowerCase();
  for (const [city, keywords] of CITY_KEYWORDS) {
    if (keywords.some((kw) => lower.includes(kw))) return city;
  }
  return null;
}

const CITY_PROMPTS: Record<string, string[]> = {
  "Mumbai": [
    "Design a compliant 8-floor residential apartment on a 20m x 30m plot in Mumbai with 2BHK units per floor and stilt parking",
    "Plan a mixed-use building on a 25m x 40m plot in Mumbai with retail on ground floor and 6 residential floors above",
    "Create a compact 3-floor commercial office building on a 15m x 20m plot in South Mumbai with reception and 8 cabins per floor",
  ],
  "Pune": [
    "Design a compliant 2-floor courtyard residence on a 14m x 20m plot in Pune with 3 bedrooms, 2 bathrooms, one kitchen and parking",
    "Plan a 5-floor residential apartment building on a 20m x 30m plot in Pune with 2BHK units and covered parking",
    "Create a 2-floor neighborhood office building on a 13m x 19m plot in Pune with reception, 4 cabins, meeting room and parking",
  ],
  "Delhi": [
    "Design a compliant 4-floor residential building on a 18m x 25m plot in Delhi with 3BHK units and basement parking",
    "Plan a mixed-use development on a 20m x 30m plot in Delhi with commercial ground floor and 3 residential floors",
    "Create a single-floor villa on a 15m x 20m plot in South Delhi with 4 bedrooms, study room and garden",
  ],
  "Bangalore": [
    "Design a 6-floor residential apartment on a 20m x 30m plot in Bangalore with 2BHK units and covered parking",
    "Plan a tech office building on a 25m x 35m plot in Whitefield Bangalore with open plan floors and cafeteria",
    "Create a mixed-use building on a 18m x 25m plot in Koramangala with ground floor retail and 4 residential floors",
  ],
  "Hyderabad": [
    "Design a 6-floor residential apartment on a 20m x 28m plot in Hyderabad with 2BHK units and stilt parking",
    "Plan a commercial office complex on a 30m x 40m plot in HITEC City Hyderabad with 8 floors and basement parking",
    "Create a 3-floor mixed-use building on a 15m x 22m plot in Banjara Hills with ground retail and residential above",
  ],
  "Chennai": [
    "Design a 6-floor residential apartment on a 18m x 25m plot in Chennai with 2BHK units and covered parking",
    "Plan a 3-floor commercial building on a 15m x 20m plot in T Nagar Chennai with ground floor retail and offices above",
    "Create a single-floor villa on a 20m x 30m plot in Adyar Chennai with 4 bedrooms and garden space",
  ],
  "Ahmedabad": [
    "Design a 3-floor residential bungalow on a 15m x 20m plot in Ahmedabad with 3 bedrooms and covered parking",
    "Plan a 5-floor apartment building on a 20m x 28m plot in Satellite Ahmedabad with 2BHK units",
    "Create a commercial showroom on a 18m x 25m plot in SG Highway Ahmedabad with 2 floors and ample parking",
  ],
  "Surat": [
    "Design a 5-floor residential apartment on a 18m x 24m plot in Surat with 2BHK units and parking",
    "Plan a textile warehouse and office complex on a 30m x 40m plot in Surat with ground floor storage and 2 office floors",
    "Create a 3-floor mixed-use building on a 15m x 20m plot in Adajan Surat with ground retail and flats above",
  ],
  "Nashik": [
    "Design a 5-floor residential apartment on a 16m x 22m plot in Nashik with 2BHK units and covered parking",
    "Plan a 3-floor commercial building on a 14m x 18m plot in Nashik with ground floor shops and offices above",
    "Create a 2-floor villa on a 18m x 25m plot in Gangapur Road Nashik with 3 bedrooms and garden",
  ],
  "Navi Mumbai": [
    "Design an 8-floor residential apartment on a 22m x 32m plot in Navi Mumbai with 2BHK units and stilt parking",
    "Plan a commercial office building on a 25m x 35m plot in Vashi Navi Mumbai with 8 floors and basement parking",
    "Create a mixed-use building on a 18m x 25m plot in Kharghar with ground retail and 6 residential floors",
  ],
};

// ---------------------------------------------------------------------------
// City-aware floor limits for preset prompt generation.
// Values are (city max_floors - 1) to keep generated prompts safely compliant.
// ---------------------------------------------------------------------------
const CITY_MAX_FLOORS: Record<string, number> = {
  "Mumbai":      6,   // R2 zone allows 7 → use 6
  "Pune":        6,   // PMRDA allows 7 → use 6
  "Delhi":       3,   // DDA zones allow 4 → use 3
  "Bangalore":   13,  // BBMP allows 14 → use 13
  "Hyderabad":   9,   // HMDA allows 10 → use 9
  "Chennai":     7,   // CMDA allows 8 → use 7
  "Ahmedabad":   6,   // AMC allows 7 → use 6
  "Surat":       6,   // SMC allows 7 → use 6
  "Nashik":      4,   // NMC allows 5 → use 4
  "Navi Mumbai": 7,   // NMMC allows 8 → use 7
};
const DEFAULT_PRESET_FLOORS = 4;

function hasArchKeywords(text: string): boolean {
  const lower = text.toLowerCase();
  return ARCH_KEYWORDS.some((kw) => lower.includes(kw));
}


function mapBackendError(raw: string): string {
  const m = raw.toLowerCase();
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("load failed")) {
    return "Could not reach the server. Please check your connection and try again.";
  }
  if (m.includes("timeout") || m.includes("timed out")) {
    return "The AI service is taking too long. Please try again in a moment.";
  }
  if (m.includes("503") || m.includes("service unavailable")) {
    return "The AI service is temporarily unavailable. Please try again in a few seconds.";
  }
  if (m.includes("500") || m.includes("internal server")) {
    return "Something went wrong on the server. Please try again.";
  }
  if (raw.length > 0 && raw.length < 200 && !raw.includes("{") && !raw.includes("traceback")) {
    return raw;
  }
  return "Something went wrong. Please try again.";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Fetch with automatic retry for network errors and 5xx responses.
// 4xx errors are NOT retried — they are prompt/input problems, not server issues.
// ---------------------------------------------------------------------------
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3000;

async function fetchWithRetry(
  url: string,
  options: RequestInit,
  onRetry: (msg: string) => void,
): Promise<Response> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(url, options);
      // 4xx — user/prompt error, do not retry
      if (!res.ok && res.status < 500) return res;
      // 5xx — server sleeping or crashing, retry
      if (res.status >= 500 && attempt < MAX_ATTEMPTS) {
        onRetry(`Backend is waking up — retrying... (attempt ${attempt + 1} of ${MAX_ATTEMPTS})`);
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      return res;
    } catch {
      // Network-level failure (fetch threw — offline, DNS, CORS pre-flight, etc.)
      if (attempt < MAX_ATTEMPTS) {
        onRetry(`Backend is waking up — retrying... (attempt ${attempt + 1} of ${MAX_ATTEMPTS})`);
        await sleep(RETRY_DELAY_MS);
      } else {
        throw new Error(
          "The server is currently unavailable. Please wait 30 seconds and try again."
        );
      }
    }
  }
  // TypeScript safety — unreachable in practice
  throw new Error("The server is currently unavailable. Please wait 30 seconds and try again.");
}

// ---------------------------------------------------------------------------
// Skeleton building blocks
// ---------------------------------------------------------------------------

/** A single skeleton bar with configurable height/width/delay */
function Sk({ h = "h-4", w = "w-full", delay = 0 }: { h?: string; w?: string; delay?: number }) {
  return (
    <div
      className={`skeleton ${h} ${w} rounded-md`}
      style={delay ? { animationDelay: `${delay}ms` } : undefined}
    />
  );
}

/** Skeleton for the "Extracted Building Parameters" section — 4-card grid */
function SkeletonParams() {
  return (
    <section className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-4 animate-fade-in">
      <Sk h="h-5" w="w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {[0, 100, 200, 300].map((d) => (
          <div key={d} className="rounded-xl border border-arch-border bg-arch-bg p-3 space-y-2">
            <Sk h="h-3" w="w-12" delay={d} />
            <Sk h="h-4" w="w-24" delay={d + 60} />
          </div>
        ))}
      </div>
    </section>
  );
}

/** Skeleton for the Zoning Compliance Report — mirrors the real panel structure */
function SkeletonZoning() {
  return (
    <div className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-4 animate-fade-in">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <Sk h="h-5" w="w-52" />
        <Sk h="h-7" w="w-24" />
      </div>

      {/* Zone info badge placeholder */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-arch-border">
        <Sk h="h-5" w="w-12" />
        <Sk h="h-4" w="w-40" delay={80} />
        <Sk h="h-3" w="w-32" delay={160} />
      </div>

      {/* Overall status */}
      <div className="flex items-center gap-3">
        <Sk h="h-7" w="w-16" />
        <Sk h="h-4" w="w-48" delay={80} />
      </div>

      {/* 7 rule rows */}
      <div className="space-y-2">
        {[0, 80, 160, 240, 320, 400, 480].map((d) => (
          <div key={d} className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-arch-border bg-arch-bg">
            <div className="space-y-1.5 flex-1 mr-4">
              <Sk h="h-3" w="w-40" delay={d} />
              <Sk h="h-3" w="w-28" delay={d + 40} />
            </div>
            <Sk h="h-5" w="w-10" delay={d + 80} />
          </div>
        ))}
      </div>

      {/* AI Verdict placeholder */}
      <div className="rounded-xl border border-arch-border bg-arch-surface-2 p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <Sk h="h-7" w="w-7" />
          <Sk h="h-3" w="w-20" delay={60} />
        </div>
        <Sk h="h-3" w="w-full" delay={120} />
        <Sk h="h-3" w="w-5/6" delay={180} />
        <Sk h="h-3" w="w-4/6" delay={240} />
      </div>
    </div>
  );
}

/** Skeleton for the Generated Layout section (720px tall) */
function SkeletonLayout() {
  return (
    <div className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-2 pb-3">
        <Sk h="h-5" w="w-36" />
        <Sk h="h-7" w="w-24" />
      </div>
      {/* Main canvas placeholder */}
      <div className="h-[720px] rounded-xl overflow-hidden border border-arch-border skeleton" />
    </div>
  );
}

/** Skeleton for the 3D Building Visualization section (560px tall) */
function SkeletonThreeD() {
  return (
    <div className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4 animate-fade-in">
      <div className="px-2 pb-3">
        <Sk h="h-5" w="w-52" />
      </div>
      <div className="h-[560px] rounded-xl overflow-hidden border border-arch-border skeleton" />
    </div>
  );
}

/** Skeleton for the Plot Location map section (matches MapView's h-[400px]) */
function SkeletonMap() {
  return (
    <div className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4 animate-fade-in">
      <div className="px-2 pb-3">
        <Sk h="h-5" w="w-32" />
      </div>
      <div className="h-[400px] rounded-xl overflow-hidden border border-arch-border skeleton" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Error / Tip boxes
// ---------------------------------------------------------------------------
interface ErrorBoxProps { message: string; onDismiss: () => void; }
function ErrorBox({ message, onDismiss }: ErrorBoxProps) {
  return (
    <section
      className="flex items-start gap-3 rounded-2xl border border-arch-fail/35 bg-arch-fail/8 px-4 py-3.5 animate-fade-in"
      role="alert"
      aria-live="polite"
    >
      <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-arch-fail/20 flex items-center justify-center">
        <svg width="11" height="11" viewBox="0 0 16 16" fill="none" className="text-arch-fail">
          <path d="M8 2L1.5 13.5h13L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="12" r="0.75" fill="currentColor" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold text-arch-fail uppercase tracking-wider mb-0.5">Error</p>
        <p className="text-sm text-arch-text leading-relaxed">{message}</p>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss error"
        className="shrink-0 mt-0.5 text-arch-text-dim hover:text-arch-text transition-colors text-xs font-mono">
        ✕
      </button>
    </section>
  );
}

interface TipBoxProps { message: string; onDismiss: () => void; }
function TipBox({ message, onDismiss }: TipBoxProps) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-arch-warn/30 bg-arch-warn/8 px-4 py-3 animate-fade-in" role="status">
      <div className="mt-0.5 shrink-0 w-4 h-4 flex items-center justify-center text-arch-warn">
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M8 5v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="8" cy="11" r="0.7" fill="currentColor" />
        </svg>
      </div>
      <p className="flex-1 text-xs text-arch-warn leading-relaxed">{message}</p>
      <button type="button" onClick={onDismiss} aria-label="Dismiss tip"
        className="shrink-0 mt-0.5 text-arch-warn/50 hover:text-arch-warn transition-colors text-xs font-mono">
        ✕
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState<number>(-1);

  const [validationError, setValidationError] = useState<string | null>(null);
  const [promptTip, setPromptTip] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  // Silently wake up the Render backend as soon as the page loads.
  // This primes the cold-start so the first real Generate request is faster.
  useEffect(() => {
    fetch(`${API_BASE}/`).catch(() => { /* silent — wake-up ping only */ });
  }, []);

  const [addressData, setAddressData] = useState<AddressData | null>(null);

  const [interpretation, setInterpretation] = useState<AIInterpretation | null>(null);
  const [aiParams, setAiParams] = useState<AIParams | null>(null);
  const [layout, setLayout] = useState<LayoutData | null>(null);
  const [zoning, setZoning] = useState<ZoningReport | null>(null);
  const hasSelectedAddress = Boolean(addressData);

  // Derive city and pick the right prompt set — updates instantly on address change
  const detectedCity = addressData ? detectCityFromAddress(addressData.address) : null;
  const activePrompts = (detectedCity && CITY_PROMPTS[detectedCity]) ? CITY_PROMPTS[detectedCity] : EXAMPLE_PROMPTS;
  const isCitySpecific = Boolean(detectedCity && CITY_PROMPTS[detectedCity]);

  // True once the user has ever clicked Generate (controls whether skeletons appear)
  const [hasStarted, setHasStarted] = useState(false);

  const processVisible = running || stepIndex >= 0;
  const statusText = useMemo(() => {
    if (running && stepIndex >= 0) return PROCESS_STEPS[stepIndex];
    if (!running && layout) return "Completed";
    return null;
  }, [running, stepIndex, layout]);

  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  /** Fills a preset's template with city and floor context. */
  function generatePresetPrompt(preset: TypologyPreset): string {
    const cityName = detectedCity;
    const floors = cityName
      ? (CITY_MAX_FLOORS[cityName] ?? DEFAULT_PRESET_FLOORS)
      : DEFAULT_PRESET_FLOORS;
    const cityInsertion = cityName ? ` in ${cityName}` : "";
    return preset.basePrompt
      .replace("{plot}", preset.plotSize)
      .replace("{floors}", String(floors))
      .replace("{city}", cityInsertion);
  }

  const handleAddressSelect = useCallback(
    (data: AddressData | null) => {
      setAddressData(data);
      if (data) {
        // New address — reset preset so re-clicking regenerates with new city context
        setActivePresetId(null);
        if (validationError?.toLowerCase().includes("address")) {
          setValidationError(null);
        }
      }
    },
    [validationError]
  );

  function validateInput(inputPrompt: string): boolean {
    setValidationError(null);
    setPromptTip(null);
    setError(null);

    if (!addressData) {
      setValidationError("Please select a site address before generating.");
      return false;
    }
    const trimmed = inputPrompt.trim();
    if (trimmed.length === 0) {
      setValidationError("Please enter a building description.");
      return false;
    }
    if (trimmed.length < 20) {
      setValidationError(
        "Please describe your building in more detail — include floors, rooms, and plot size."
      );
      return false;
    }
    if (!hasArchKeywords(trimmed)) {
      setPromptTip(
        "Tip: For best results include details like number of floors, bedrooms, and plot dimensions."
      );
    }
    return true;
  }

  async function runFlow(inputPrompt: string) {
    const trimmedPrompt = inputPrompt.trim();
    if (!validateInput(trimmedPrompt)) return;

    setHasStarted(true);
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

      const body: Record<string, unknown> = { prompt: trimmedPrompt };
      if (addressData) {
        body.address = addressData.address;
        body.lat = addressData.lat;
        body.lng = addressData.lng;
      }

      const res = await fetchWithRetry(
        `${API_BASE}/api/generate`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        },
        (msg) => setRetryMessage(msg),
      );
      setRetryMessage(null);
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Generation failed.");

      setStepIndex(2);
      await sleep(250);
      setStepIndex(3);

      setInterpretation(data.interpreted);
      setAiParams(data.params);
      setLayout(data.layout);
      setZoning(data.zoning);
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : "Unexpected error.";
      setRetryMessage(null);
      setError(mapBackendError(raw));
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
          <p className="text-sm font-mono uppercase tracking-[0.2em] text-arch-accent">architect ai</p>
          <h1 className="font-display text-3xl md:text-5xl font-700 text-white leading-tight">
            Design buildings from a prompt and instantly check zoning feasibility.
          </h1>
          <p className="max-w-3xl mx-auto text-sm md:text-base text-arch-text-dim leading-relaxed">
            Convert a building idea into structured parameters, a conceptual layout, and a zoning compliance report.
          </p>
        </section>

        {/* ============ INPUT CARD ============ */}
        <section className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-4">
          <AddressInput onAddressSelect={handleAddressSelect} disabled={running} />

          <hr className="border-arch-border" />

          {/* ---- Typology Presets ---- */}
          <TypologyPresets
            activePresetId={activePresetId}
            onSelect={(preset) => {
              setActivePresetId(preset.id);
              setPrompt(generatePresetPrompt(preset));
              setValidationError(null);
              setPromptTip(null);
            }}
            disabled={running}
          />

          <hr className="border-arch-border" />

          <form onSubmit={handleSubmit} className="space-y-3">
            <textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                if (validationError && !validationError.toLowerCase().includes("address")) {
                  setValidationError(null);
                }
                if (promptTip) setPromptTip(null);
              }}
              placeholder={
                hasSelectedAddress
                  ? "Describe the building concept..."
                  : "Select a site address first to enable prompt input"
              }
              className="w-full min-h-[96px] rounded-xl border border-arch-border bg-arch-bg px-4 py-3 text-sm text-arch-text placeholder-arch-text-dim focus:outline-none focus:border-arch-accent/60 disabled:opacity-50 transition-colors"
              disabled={running || !hasSelectedAddress}
            />

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                id="generate-btn"
                disabled={running || !prompt.trim() || !hasSelectedAddress}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-arch-accent text-arch-bg hover:bg-arch-accent-dim disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {running ? "Running..." : "Generate"}
              </button>
              <button
                type="button"
                id="demo-btn"
                onClick={() => { setPrompt(DEMO_PROMPT); void runFlow(DEMO_PROMPT); }}
                disabled={running || !hasSelectedAddress}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-arch-border text-arch-text hover:border-arch-accent hover:text-arch-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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

          {/* Inline validation error */}
          {validationError && (
            <div
              className="flex items-start gap-2.5 rounded-xl border border-arch-fail/30 bg-arch-fail/8 px-3.5 py-3 animate-fade-in"
              role="alert"
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className="text-arch-fail shrink-0 mt-0.5">
                <path d="M8 2L1.5 13.5h13L8 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                <path d="M8 7v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                <circle cx="8" cy="12" r="0.75" fill="currentColor" />
              </svg>
              <p className="text-xs text-arch-fail leading-relaxed">{validationError}</p>
            </div>
          )}

          {/* Non-blocking keyword tip */}
          {promptTip && !validationError && (
            <TipBox message={promptTip} onDismiss={() => setPromptTip(null)} />
          )}

          {/* Example prompts — city-specific when a known city is detected */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-xs font-mono uppercase tracking-[0.15em] text-arch-text-dim">
                {isCitySpecific ? `Prompts for` : "Example prompts:"}
              </p>
              {isCitySpecific && detectedCity && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-arch-accent/15 text-arch-accent border border-arch-accent/25 animate-fade-in">
                  {detectedCity}
                </span>
              )}
            </div>
            <div className="grid gap-2">
              {activePrompts.map((example) => (
                <button
                  key={example}
                  type="button"
                  onClick={() => { setPrompt(example); setValidationError(null); setPromptTip(null); }}
                  disabled={running || !hasSelectedAddress}
                  className="text-left text-xs md:text-sm px-3 py-2 rounded-lg border border-arch-border bg-arch-bg hover:border-arch-accent/60 hover:text-arch-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ============ MAP PREVIEW (address set, generation not yet started) ============ */}
        {addressData && !hasStarted && (
          <section className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4">
            <h3 className="text-lg font-display text-white px-2 pb-2">Plot Location</h3>
            <MapView lat={addressData.lat} lng={addressData.lng} address={addressData.address} />
          </section>
        )}

        {/* ============ AI PROCESS STEPS ============ */}
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
                    className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
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
            {/* Retry indicator — shows when fetchWithRetry is between attempts */}
            {retryMessage && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-arch-warn/30 bg-arch-warn/8 animate-fade-in">
                <div className="w-1.5 h-1.5 rounded-full bg-arch-warn animate-pulse shrink-0" />
                <p className="text-xs font-mono text-arch-warn">{retryMessage}</p>
              </div>
            )}
          </section>
        )}

        {/* ============ BACKEND ERROR ============ */}
        {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}

        {/* ============ EXTRACTED PARAMS — skeleton while running, real when done ============ */}
        {running && <SkeletonParams />}
        {!running && interpretation && (
          <section className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-4 animate-fade-in">
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
                <p className="text-sm text-white mt-1">{interpretation.bedrooms} / {interpretation.bathrooms}</p>
              </div>
              <div className="rounded-xl border border-arch-border bg-arch-bg p-3">
                <p className="text-xs text-arch-text-dim">Building Type</p>
                <p className="text-sm text-white mt-1">{interpretation.building_type}</p>
              </div>
            </div>
          </section>
        )}

        {/* ============ ZONING + LAYOUT + 3D + MAP — skeletons while running ============ */}
        {running && (
          <section className="space-y-6">
            <SkeletonZoning />
            <SkeletonLayout />
            <SkeletonThreeD />
            <SkeletonMap />
          </section>
        )}

        {!running && zoning && layout && (
          <section className="space-y-6 animate-fade-in">
            {/* Zoning Compliance Report */}
            <div className="bg-arch-surface border border-arch-border rounded-2xl p-4 md:p-6 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-display text-white">Zoning Compliance Report</h3>
                <button
                  onClick={() => generatePDFReport({ zoning, layout, interpretation, addressData })}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono border border-arch-accent/40 text-arch-accent hover:bg-arch-accent/10 transition-colors"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1v9M4 7l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M2 13h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Export PDF
                </button>
              </div>

              {zoning.zone_info && (
                <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl border border-arch-accent/30 bg-arch-accent/5">
                  <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-arch-accent/20 text-arch-accent border border-arch-accent/30">
                    {zoning.zone_info.zone_code}
                  </span>
                  <span className="text-sm text-white">{zoning.zone_info.zone_name}</span>
                  <span className="text-xs text-arch-text-dim">
                    &mdash; {zoning.zone_info.city} &middot; {zoning.zone_info.authority}
                  </span>
                </div>
              )}
              {zoning.zone_info && (
                <p className="text-xs font-mono text-arch-text-dim">Source: {zoning.zone_info.source}</p>
              )}

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

              {zoning.rules && zoning.rules.length > 0 && (
                <div className="space-y-1.5">
                  {zoning.rules.map((rule, i) => (
                    <div key={i} className="px-3 py-2.5 rounded-lg border border-arch-border bg-arch-bg">
                      <div className="flex items-center justify-between">
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
                      {zoning.ai_reasoning?.rule_reasoning?.[rule.rule_name] && (
                        <p
                          className="mt-1.5 text-[11px] leading-relaxed italic animate-fade-in"
                          style={{ color: "#8892b0", animationDuration: "0.6s" }}
                        >
                          {zoning.ai_reasoning.rule_reasoning[rule.rule_name]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {zoning.ai_reasoning?.summary && (
                <div
                  className="rounded-xl border p-4 space-y-2.5 animate-fade-in"
                  style={{
                    borderColor: "rgba(232,255,71,0.15)",
                    background: "#0d1117",
                    animationDuration: "0.8s",
                    animationDelay: "0.3s",
                    animationFillMode: "both",
                  }}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(232,255,71,0.1)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 2L14.09 8.26L20.18 8.27L15.18 12.14L16.82 18.27L12 14.77L7.18 18.27L8.82 12.14L3.82 8.27L9.91 8.26L12 2Z" stroke="#e8ff47" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(232,255,71,0.15)" />
                      </svg>
                    </div>
                    <h4 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#e8ff47" }}>
                      AI Verdict
                    </h4>
                  </div>
                  <p className="text-[12px] leading-relaxed pl-0.5" style={{ color: "#9ca3be" }}>
                    {zoning.ai_reasoning.summary}
                  </p>
                </div>
              )}

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

            {/* Generated Layout */}
            <div className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4">
              <h3 className="text-lg font-display text-white px-2 pb-2">Generated Layout</h3>
              <div className="h-[720px] rounded-xl overflow-hidden border border-arch-border">
                <LayoutView layout={layout} />
              </div>
            </div>

            {/* 3D Building Visualization */}
            <div className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4">
              <h3 className="text-lg font-display text-white px-2 pb-2">3D Building Visualization</h3>
              <div className="h-[560px] rounded-xl overflow-hidden border border-arch-border">
                <ThreeScene layout={layout} />
              </div>
            </div>

            {/* Plot Location */}
            {addressData && (
              <div className="bg-arch-surface border border-arch-border rounded-2xl p-3 md:p-4">
                <h3 className="text-lg font-display text-white px-2 pb-2">Plot Location</h3>
                <MapView lat={addressData.lat} lng={addressData.lng} address={addressData.address} />
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}
