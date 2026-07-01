"use client";

import { useEffect, useRef, useState } from "react";
import { EngineIcon } from "./EngineIcon";

// Animated per-engine progress shown while a scan runs. The real scan runs in
// parallel server-side, so this steps through each engine with a rising % and a
// "success" tick to give live feedback; when `done` is set every step snaps to
// complete.
const STEPS: { engine: string | null; label: string }[] = [
  { engine: "ChatGPT", label: "Checking ChatGPT visibility" },
  { engine: "Gemini", label: "Measuring Gemini brand share" },
  { engine: "Claude", label: "Verifying Claude accuracy" },
  { engine: "Grok", label: "Checking Grok visibility" },
  { engine: "Deepseek", label: "Auditing Deepseek citations" },
  { engine: "Google AI", label: "Checking Google AI presence" },
  { engine: null, label: "Cross-checking canonical facts" },
  { engine: null, label: "Scoring with judge model" },
];

export function ScanProgress({ brand, done = false }: { brand: string; done?: boolean }) {
  const [pct, setPct] = useState<number[]>(() => STEPS.map(() => 0));
  const active = useRef(0);

  useEffect(() => {
    const id = setInterval(() => {
      setPct((prev) => {
        const i = active.current;
        if (i >= STEPS.length) return prev;
        const next = [...prev];
        // The last step waits at 95% until the real scan resolves (`done`).
        const cap = i === STEPS.length - 1 ? 95 : 100;
        next[i] = Math.min(cap, next[i] + Math.random() * 16 + 7);
        if (next[i] >= 100) active.current = i + 1;
        return next;
      });
    }, 140);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (done) {
      active.current = STEPS.length;
      setPct(STEPS.map(() => 100));
    }
  }, [done]);

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="mb-4 text-center text-sm text-gray-400">
        Scanning <span className="text-gray-200">{brand}</span> across AI engines…
      </p>
      <div className="space-y-2">
        {STEPS.map((s, i) => {
          const p = Math.round(pct[i]);
          const complete = p >= 100;
          const started = p > 0;
          return (
            <div
              key={i}
              className={`flex items-center gap-3 rounded-lg border px-4 py-2.5 transition-colors ${
                complete ? "border-emerald-500/15 bg-emerald-500/5" : started ? "border-cyan-500/15 bg-gray-900/60" : "border-white/5 bg-gray-900/40"
              }`}
            >
              <span className="flex h-6 w-6 items-center justify-center text-gray-400">
                {s.engine ? (
                  <EngineIcon name={s.engine} className="h-4 w-4" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-cyan-400" />
                )}
              </span>
              <span className="flex-1 truncate text-sm text-gray-300">{s.label}</span>
              {complete ? (
                <span className="font-mono text-xs text-emerald-400">success ✓</span>
              ) : started ? (
                <span className="font-mono text-xs text-cyan-400">{p}%</span>
              ) : (
                <span className="font-mono text-xs text-gray-600">queued</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
