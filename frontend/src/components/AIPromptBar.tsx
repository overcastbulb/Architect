"use client";

import { useState, useRef, useEffect } from "react";
import { InterpretResponse } from "@/types";

interface Props {
  onInterpret: (result: InterpretResponse) => void;
  onGenerateFromAI: () => void;
  aiLoading: boolean;
  setAiLoading: (v: boolean) => void;
}

const EXAMPLES = [
  "Design a 4-floor residential building on a 30x50m plot with 6 bedrooms",
  "Small commercial office on a 20x25m plot, 3 floors, no bedrooms",
  "Luxury villa on a 40x60m plot with 5 bedrooms, 4 bathrooms and parking",
  "Compact 2-floor apartment on a 12x18m plot with 2 bedrooms",
];

export default function AIPromptBar({
  onInterpret,
  onGenerateFromAI,
  aiLoading,
  setAiLoading,
}: Props) {
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showExamples, setShowExamples] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!(e.target as Element).closest(".prompt-container")) {
        setShowExamples(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleGenerate() {
    if (!prompt.trim()) return;

    setAiLoading(true);
    setError(null);
    setShowExamples(false);

    try {
      const res = await fetch("http://localhost:8000/api/interpret", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        let errorMessage = data.detail || "Interpretation failed";
        if (errorMessage === "Prompt cannot be empty") {
          errorMessage = "Please enter a building description.";
        }
        throw new Error(errorMessage);
      }

      onInterpret(data as InterpretResponse);
      setTimeout(() => onGenerateFromAI(), 80);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to reach backend");
    } finally {
      setAiLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !aiLoading) handleGenerate();
    if (e.key === "Escape") setShowExamples(false);
  }

  function useExample(example: string) {
    setPrompt(example);
    setShowExamples(false);
    inputRef.current?.focus();
  }

  return (
    <div className="flex-1 flex flex-col items-center gap-1.5 prompt-container relative">
      {error && (
        <div className="w-full max-w-2xl">
          <span className="text-[10px] font-mono text-arch-fail truncate">{error}</span>
        </div>
      )}

      <div className="relative w-full max-w-2xl">
        <div
          className={`flex items-center gap-3 bg-arch-surface border rounded-xl px-4 py-2.5 transition-all duration-300 ${
            aiLoading
              ? "border-violet-500/60 shadow-[0_0_20px_rgba(139,92,246,0.2)]"
              : "border-arch-border hover:border-arch-muted focus-within:border-violet-500/50"
          }`}
        >
          <div className={`shrink-0 transition-all duration-300 ${aiLoading ? "animate-spin" : ""}`}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M8 1C4.134 1 1 4.134 1 8s3.134 7 7 7 7-3.134 7-7-3.134-7-7-7z"
                fill="none"
                stroke={aiLoading ? "#a78bfa" : "#6b7394"}
                strokeWidth="1.2"
              />
              <path d="M8 4v4l3 1.5" stroke={aiLoading ? "#a78bfa" : "#6b7394"} strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>

          <input
            ref={inputRef}
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowExamples(true)}
            placeholder="Describe the building you want to design..."
            disabled={aiLoading}
            className="flex-1 bg-transparent text-sm text-arch-text placeholder-arch-text-dim focus:outline-none disabled:opacity-50"
          />

          <button
            onClick={handleGenerate}
            disabled={aiLoading || !prompt.trim()}
            className={`shrink-0 px-4 py-1.5 rounded-lg text-xs font-mono font-medium transition-all ${
              aiLoading || !prompt.trim()
                ? "bg-arch-border text-arch-text-dim cursor-not-allowed"
                : "bg-violet-600 text-white hover:bg-violet-500 active:scale-95"
            }`}
          >
            {aiLoading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-violet-300 animate-pulse" />
                THINKING
              </span>
            ) : (
              "GENERATE ->"
            )}
          </button>
        </div>

        {aiLoading && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-transparent via-violet-500 to-transparent animate-[shimmer_1.5s_ease-in-out_infinite]"
              style={{ width: "200%", animation: "shimmer 1.5s linear infinite" }}
            />
          </div>
        )}

        {showExamples && !aiLoading && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-arch-surface border border-arch-border rounded-xl overflow-hidden z-50 shadow-2xl">
            <div className="px-3 py-2 border-b border-arch-border">
              <span className="text-[10px] font-mono text-arch-text-dim uppercase tracking-wider">Example prompts</span>
            </div>
            {EXAMPLES.map((example) => (
              <button
                key={example}
                onClick={() => useExample(example)}
                className="w-full text-left px-3 py-2.5 text-xs text-arch-text-dim hover:text-arch-text hover:bg-arch-border/50 transition-colors flex items-center gap-2"
              >
                <span className="text-violet-500 text-[10px]">{">"}</span>
                {example}
              </button>
            ))}
          </div>
        )}
      </div>

      {aiLoading && (
        <p className="text-[10px] font-mono text-violet-400 tracking-widest animate-pulse">
          GROQ GENERATING ARCHITECTURE...
        </p>
      )}
    </div>
  );
}
