"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { AddressData } from "@/types";

interface Props {
  onAddressSelect: (data: AddressData | null) => void;
  disabled?: boolean;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}


const CITIES = [
  { label: "Navi Mumbai", keywords: ["navi mumbai", "new mumbai", "vashi", "kharghar", "belapur", "nerul", "airoli", "panvel", "kopar khairane", "sanpada", "seawoods", "ulwe", "taloja", "cidco"], lat: 19.0368, lng: 73.0158 },
  { label: "Mumbai", keywords: ["mumbai", "bombay", "bandra", "andheri", "worli", "powai", "malad", "borivali", "thane", "dadar", "kurla", "goregaon", "juhu", "colaba", "bkc", "brihanmumbai"], lat: 19.076, lng: 72.8777 },
  { label: "Pune", keywords: ["pune", "pmrda", "pimpri", "chinchwad", "hinjewadi", "kothrud", "hadapsar", "wakad", "baner", "koregaon", "viman nagar", "kharadi", "aundh", "shivajinagar"], lat: 18.5204, lng: 73.8567 },
  { label: "Delhi", keywords: ["delhi", "new delhi", "nct of delhi", "dwarka", "rohini", "saket", "karol bagh", "lajpat nagar", "vasant kunj", "janakpuri", "pitampura", "noida", "gurgaon", "gurugram"], lat: 28.6139, lng: 77.209 },
  { label: "Bangalore", keywords: ["bangalore", "bengaluru", "whitefield", "koramangala", "indiranagar", "jayanagar", "hsr layout", "electronic city", "marathahalli", "hebbal", "yelahanka", "jp nagar", "btm"], lat: 12.9716, lng: 77.5946 },
  { label: "Hyderabad", keywords: ["hyderabad", "secunderabad", "hitec city", "hitech city", "gachibowli", "madhapur", "banjara hills", "jubilee hills", "kukatpally", "miyapur", "kondapur", "begumpet", "ameerpet", "charminar", "telangana"], lat: 17.385, lng: 78.4867 },
  { label: "Chennai", keywords: ["chennai", "madras", "anna nagar", "t nagar", "adyar", "velachery", "tambaram", "porur", "guindy", "sholinganallur", "mylapore", "perambur", "nungambakkam", "kodambakkam"], lat: 13.0827, lng: 80.2707 },
  { label: "Ahmedabad", keywords: ["ahmedabad", "ahemdabad", "ahmadabad", "satellite", "bodakdev", "prahlad nagar", "thaltej", "vastrapur", "navrangpura", "maninagar", "bopal", "sg highway"], lat: 23.0225, lng: 72.5714 },
  { label: "Surat", keywords: ["surat", "adajan", "vesu", "piplod", "athwa", "varachha", "katargam", "dumas"], lat: 21.1702, lng: 72.8311 },
  { label: "Nashik", keywords: ["nashik", "nasik", "nashick", "gangapur", "panchavati", "cidco nashik"], lat: 19.9975, lng: 73.7898 },
];

// Indian cities for keyword-based detection (fallback)
const CITY_CONSTRAINTS: Record<string, {
  zone_code: string;
  zone_name: string;
  authority: string;
  source: string;
  max_fsi: number;
  max_floors: number;
  max_height_m: number;
  min_setback_front_m: number;
  min_setback_side_m: number;
  max_coverage_pct: number;
  permitted_uses: string[];
}> = {
  "Mumbai": { zone_code: "R2", zone_name: "Medium Density Residential", authority: "BMC (MCGM)", source: "DCPR 2034", max_fsi: 1.33, max_floors: 8, max_height_m: 24, min_setback_front_m: 4.5, min_setback_side_m: 2.5, max_coverage_pct: 55, permitted_uses: ["Residential", "Mixed"] },
  "Pune": { zone_code: "R2", zone_name: "Medium Density Residential", authority: "PMC / PMRDA", source: "UDCPR-2020 & PMRDA DP 2041", max_fsi: 1.5, max_floors: 5, max_height_m: 15, min_setback_front_m: 3, min_setback_side_m: 2, max_coverage_pct: 60, permitted_uses: ["Residential", "Mixed"] },
  "Delhi": { zone_code: "Residential", zone_name: "Residential Zone", authority: "DDA", source: "DDA MPD-2021", max_fsi: 1.2, max_floors: 4, max_height_m: 15, min_setback_front_m: 3, min_setback_side_m: 2, max_coverage_pct: 50, permitted_uses: ["Residential"] },
  "Bangalore": { zone_code: "R2", zone_name: "Medium Density Residential", authority: "BBMP / BDA", source: "BBMP Building Bye-Laws & RMP 2031", max_fsi: 2.25, max_floors: 6, max_height_m: 18, min_setback_front_m: 3, min_setback_side_m: 2, max_coverage_pct: 60, permitted_uses: ["Residential", "Mixed"] },
  "Hyderabad": { zone_code: "R2", zone_name: "Medium Density Residential", authority: "HMDA / GHMC", source: "HMDA Zoning Regulations", max_fsi: 1.75, max_floors: 6, max_height_m: 18, min_setback_front_m: 3, min_setback_side_m: 2, max_coverage_pct: 55, permitted_uses: ["Residential", "Mixed"] },
  "Chennai": { zone_code: "R2", zone_name: "Medium Density Residential", authority: "CMDA / GCC", source: "CMDA Building Rules", max_fsi: 2.0, max_floors: 6, max_height_m: 18, min_setback_front_m: 3, min_setback_side_m: 2, max_coverage_pct: 60, permitted_uses: ["Residential", "Mixed"] },
  "Ahmedabad": { zone_code: "R1", zone_name: "Low Density Residential", authority: "AUDA / AMC", source: "AUDA GDCR", max_fsi: 1.2, max_floors: 3, max_height_m: 10, min_setback_front_m: 3, min_setback_side_m: 1.5, max_coverage_pct: 50, permitted_uses: ["Residential"] },
  "Surat": { zone_code: "R2", zone_name: "Medium Density Residential", authority: "SUDA / SMC", source: "SUDA DCR", max_fsi: 1.8, max_floors: 5, max_height_m: 15, min_setback_front_m: 3, min_setback_side_m: 2, max_coverage_pct: 55, permitted_uses: ["Residential", "Mixed"] },
  "Nashik": { zone_code: "R2", zone_name: "Medium Density Residential", authority: "NMC", source: "NMC DCR", max_fsi: 1.5, max_floors: 5, max_height_m: 15, min_setback_front_m: 3, min_setback_side_m: 2, max_coverage_pct: 60, permitted_uses: ["Residential", "Mixed"] },
  "Navi Mumbai": { zone_code: "R2", zone_name: "Medium Density Residential", authority: "CIDCO / NMMC", source: "CIDCO Regulations", max_fsi: 2.0, max_floors: 8, max_height_m: 24, min_setback_front_m: 4.5, min_setback_side_m: 2.5, max_coverage_pct: 60, permitted_uses: ["Residential", "Mixed"] },
};

function detectCityFromText(text: string): string | null {
  const lower = text.toLowerCase();
  for (const city of CITIES) {
    for (const kw of city.keywords) {
      if (lower.includes(kw)) return city.label;
    }
  }
  return null;
}

export default function AddressInput({ onAddressSelect, disabled }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resolved, setResolved] = useState<AddressData | null>(null);
  const [detectedCity, setDetectedCity] = useState<string | null>(null);
  const constraints = detectedCity ? CITY_CONSTRAINTS[detectedCity] ?? null : null;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Fetch suggestions from Nominatim
  const fetchSuggestions = useCallback(async (q: string) => {
    if (q.trim().length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        q: q,
        format: "json",
        limit: "5",
        countrycodes: "in",
      });
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            "User-Agent": "architect-ai-prototype",
          },
        }
      );
      if (res.ok) {
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setShowDropdown(data.length > 0);
      }
    } catch {
      // Nominatim is down - silently fail, user can still type manually
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced input handler
  function handleInputChange(value: string) {
    setQuery(value);

    // Detect city from text for UI feedback only
    const city = detectCityFromText(value);
    setDetectedCity(city);

    // Only keep coordinates from explicit Nominatim selection.
    // If user edits the text, clear previously selected coordinates.
    if (resolved) {
      onAddressSelect(null);
      setResolved(null);
    }

    // Debounce Nominatim API call
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(value);
    }, 400);
  }

  // Handle selecting a suggestion
  function handleSelect(result: NominatimResult) {
    const data: AddressData = {
      address: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    };
    setQuery(result.display_name);
    setResolved(data);
    setDetectedCity(detectCityFromText(result.display_name));
    setShowDropdown(false);
    setSuggestions([]);
    onAddressSelect(data);
  }

  function handleClear() {
    setQuery("");
    setResolved(null);
    setDetectedCity(null);
    setSuggestions([]);
    setShowDropdown(false);
    onAddressSelect(null);
    inputRef.current?.focus();
  }

  return (
    <div className="space-y-2">
      {/* Label */}
      <p className="text-xs font-mono uppercase tracking-[0.15em] text-arch-text-dim">
        Site address:
      </p>

      {/* Address input */}
      <div className="relative">
        <div
          className={`flex items-center gap-3 rounded-xl border bg-arch-bg px-4 py-2.5 transition-all ${
            resolved
              ? "border-arch-accent/40"
              : "border-arch-border focus-within:border-arch-accent/60"
          }`}
        >
          {/* Location pin icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 18 18"
            fill="none"
            className={`shrink-0 ${resolved ? "text-arch-accent" : "text-arch-muted"}`}
          >
            <path
              d="M9 1.5C6.1 1.5 3.75 3.85 3.75 6.75C3.75 10.69 9 16.5 9 16.5C9 16.5 14.25 10.69 14.25 6.75C14.25 3.85 11.9 1.5 9 1.5Z"
              stroke="currentColor"
              strokeWidth="1.3"
              fill="none"
            />
            <circle cx="9" cy="6.75" r="2" stroke="currentColor" strokeWidth="1.3" fill="none" />
          </svg>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => {
              if (suggestions.length > 0) setShowDropdown(true);
            }}
            placeholder="Enter address anywhere in India"
            disabled={disabled}
            className="flex-1 bg-transparent text-sm text-arch-text placeholder-arch-text-dim focus:outline-none disabled:opacity-50"
            autoComplete="off"
          />

          {/* Loading spinner */}
          {loading && (
            <div className="shrink-0 w-4 h-4 border-2 border-arch-muted border-t-arch-accent rounded-full animate-spin" />
          )}

          {/* Clear button */}
          {(query || resolved) && !loading && (
            <button
              type="button"
              onClick={handleClear}
              disabled={disabled}
              className="shrink-0 text-arch-text-dim hover:text-arch-text transition-colors text-xs"
            >
              x
            </button>
          )}
        </div>

        {/* Autocomplete dropdown */}
        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute left-0 right-0 mt-1 bg-arch-surface border border-arch-border rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in"
          >
            {suggestions.map((result) => (
              <button
                key={result.place_id}
                type="button"
                onClick={() => handleSelect(result)}
                className="w-full text-left px-4 py-2.5 text-sm text-arch-text hover:bg-arch-bg border-b border-arch-border last:border-b-0 transition-colors flex items-start gap-2"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 18 18"
                  fill="none"
                  className="text-arch-muted shrink-0 mt-0.5"
                >
                  <path
                    d="M9 1.5C6.1 1.5 3.75 3.85 3.75 6.75C3.75 10.69 9 16.5 9 16.5C9 16.5 14.25 10.69 14.25 6.75C14.25 3.85 11.9 1.5 9 1.5Z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    fill="none"
                  />
                  <circle cx="9" cy="6.75" r="1.5" stroke="currentColor" strokeWidth="1.2" fill="none" />
                </svg>
                <span className="line-clamp-2">{result.display_name}</span>
              </button>
            ))}
            <div className="px-3 py-1.5 text-[9px] font-mono text-arch-text-dim/50 bg-arch-bg border-t border-arch-border">
              Powered by OpenStreetMap Nominatim
            </div>
          </div>
        )}
      </div>

      {/* Resolved address feedback */}
      {resolved && detectedCity && (
        <div className="flex items-center gap-2 text-xs font-mono animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-arch-pass animate-pulse" />
          <span className="text-arch-pass">City detected: {detectedCity}</span>
          <span className="text-arch-text-dim">- zoning rules will be loaded</span>
        </div>
      )}

      {/* Resolved but no city detected */}
      {resolved && !detectedCity && (
        <div className="flex items-center gap-2 text-xs font-mono animate-fade-in">
          <span className="w-1.5 h-1.5 rounded-full bg-arch-accent animate-pulse" />
          <span className="text-arch-accent">Address set</span>
          <span className="text-arch-text-dim">- using default zoning rules</span>
        </div>
      )}

      {/* Hint when typing but nothing resolved yet */}
      {query.trim().length > 0 && query.trim().length < 3 && !resolved && (
        <p className="text-[11px] font-mono text-arch-text-dim">
          Keep typing to search addresses...
        </p>
      )}

      {/* Site Constraints Panel */}
      {resolved && constraints && (
        <div className="rounded-xl border border-arch-accent/20 bg-arch-bg p-4 space-y-3 animate-fade-in">
          <div className="flex items-center justify-between">
            <p className="text-xs font-mono uppercase tracking-[0.15em] text-arch-accent">
              Site Constraints
            </p>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-arch-accent/20 text-arch-accent border border-arch-accent/30">
              {constraints.zone_code}
            </span>
          </div>
          <p className="text-xs text-arch-text-dim font-mono">
            {constraints.zone_name} — {constraints.authority}
          </p>
          <p className="text-[10px] text-arch-text-dim/60 font-mono">
            Source: {constraints.source}
          </p>
          <div className="grid grid-cols-2 gap-2 pt-1">
            {[
              { label: "Max FSI", value: constraints.max_fsi },
              { label: "Max Floors", value: constraints.max_floors },
              { label: "Max Height", value: `${constraints.max_height_m}m` },
              { label: "Front Setback", value: `≥ ${constraints.min_setback_front_m}m` },
              { label: "Side Setback", value: `≥ ${constraints.min_setback_side_m}m` },
              { label: "Max Coverage", value: `${constraints.max_coverage_pct}%` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-arch-surface border border-arch-border">
                <span className="text-[10px] text-arch-text-dim font-mono">{item.label}</span>
                <span className="text-[11px] text-white font-mono font-semibold">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1 pt-1">
            {constraints.permitted_uses.map((use) => (
              <span key={use} className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-arch-accent/10 text-arch-accent border border-arch-accent/20">
                {use}
              </span>
            ))}
          </div>
          <p className="text-[9px] font-mono text-arch-text-dim/40">
            * Default zone shown. Exact zone detected after Generate.
          </p>
        </div>
      )}

      {/* Non top-10 city fallback message */}
      {resolved && !constraints && detectedCity === null && (
        <div className="rounded-xl border border-arch-border bg-arch-bg px-4 py-3 animate-fade-in">
          <p className="text-[11px] font-mono text-arch-text-dim">
            AI will estimate zoning constraints for this location after Generate.
          </p>
        </div>
      )}
    </div>
  );
}

