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

// Indian cities for keyword-based detection (fallback)
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
    </div>
  );
}

