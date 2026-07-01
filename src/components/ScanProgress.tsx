"use client";

import { useEffect, useRef, useState } from "react";
import { EngineIcon } from "./EngineIcon";

export type ScanStepStatus = "queued" | "running" | "done";

// Every engine is measured on the SAME metrics (visibility · accuracy · share),
// so each engine row uses identical wording. The last two steps (facts + judge)
// follow the judge status.
const ENGINES = ["ChatGPT", "Gemini", "Claude", "Grok", "Deepseek", "Google AI"];
const STEPS: { engine: string | null; label: string }[] = [
  ...ENGINES.map((name) => ({ engine: name, label: `Checking ${name} · visibility · accuracy · share` })),
  { engine: null, label: "Cross-checking canonical facts" },
  { engine: null, label: "Scoring with judge model" },
];

// Animated per-engine progress. When `engineStatus`/`judgeStatus` are provided
// (streaming mode), each step reflects real progress from the server; otherwise
// it runs a timed simulation (fallback).
export function ScanProgress({
  brand,
  engineStatus,
  judgeStatus,
}: {
  brand: string;
  engineStatus?: Record<string, ScanStepStatus>;
  judgeStatus?: ScanStepStatus;
}) {
  const real = Boolean(engineStatus);
  const [pct, setPct] = useState<number[]>(() => STEPS.map(() => 0));
  const active = useRef(0);
  // Keep latest real status in a ref so the interval stays stable.
  const statusRef = useRef({ engineStatus, judgeStatus });
  statusRef.current = { engineStatus, judgeStatus };

  useEffect(() => {
    const id = setInterval(() => {
      setPct((prev) => {
        const next = [...prev];
        if (real) {
          const { engineStatus: es, judgeStatus: js } = statusRef.current;
          STEPS.forEach((s, i) => {
            const st: ScanStepStatus = s.engine ? es?.[s.engine] ?? "queued" : js ?? "queued";
            const target = st === "done" ? 100 : st === "running" ? 92 : 0;
            if (next[i] < target) next[i] = Math.min(target, next[i] + Math.random() * 13 + 6);
            else if (st === "done") next[i] = 100;
          });
        } else {
          const i = active.current;
          if (i < STEPS.length) {
            const cap = i === STEPS.length - 1 ? 95 : 100;
            next[i] = Math.min(cap, next[i] + Math.random() * 16 + 7);
            if (next[i] >= 100) active.current = i + 1;
          }
        }
        return next;
      });
    }, 140);
    return () => clearInterval(id);
  }, [real]);

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
                complete
                  ? "border-emerald-500/15 bg-emerald-500/5"
                  : started
                  ? "border-cyan-500/15 bg-gray-900/60"
                  : "border-white/5 bg-gray-900/40"
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
