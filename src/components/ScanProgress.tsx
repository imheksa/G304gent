"use client";

import { useEffect, useRef, useState } from "react";
import { EngineIcon } from "./EngineIcon";

export type ScanStepStatus = "queued" | "running" | "done";

const ENGINES = ["ChatGPT", "Gemini", "Claude", "Grok", "Deepseek", "Google AI"];
const METRICS = [
  { label: "Visibility", bar: "from-cyan-500 to-cyan-400" },
  { label: "Accuracy", bar: "from-emerald-500 to-emerald-400" },
  { label: "Share", bar: "from-violet-500 to-violet-400" },
];

// Per-engine scan progress. Each engine is a card with three metric bars
// (Visibility, Accuracy, Share) that fill one after another, then the engine is
// marked complete. Driven by real per-engine status when provided (streaming),
// otherwise a timed simulation.
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
  const [bars, setBars] = useState<number[][]>(() => ENGINES.map(() => [0, 0, 0]));
  const [judge, setJudge] = useState(0);
  const active = useRef(0); // fallback: which engine is currently running
  const statusRef = useRef({ engineStatus, judgeStatus });
  statusRef.current = { engineStatus, judgeStatus };

  useEffect(() => {
    const id = setInterval(() => {
      setBars((prev) => {
        const next = prev.map((r) => [...r]);
        ENGINES.forEach((name, ei) => {
          const st: ScanStepStatus = real
            ? statusRef.current.engineStatus?.[name] ?? "queued"
            : ei < active.current
            ? "done"
            : ei === active.current
            ? "running"
            : "queued";
          if (st === "done") {
            next[ei] = [100, 100, 100];
          } else if (st === "running") {
            // Fill one metric bar at a time. In streaming mode the final bar
            // waits at 95% until the engine actually finishes.
            for (let mi = 0; mi < 3; mi++) {
              const cap = mi === 2 && real ? 95 : 100;
              if (next[ei][mi] < cap) {
                next[ei][mi] = Math.min(cap, next[ei][mi] + Math.random() * 22 + 9);
                break;
              }
            }
          }
        });
        if (!real) {
          const ei = active.current;
          if (ei < ENGINES.length && next[ei].every((v) => v >= 100)) active.current = ei + 1;
        }
        return next;
      });
      setJudge((j) => {
        const js: ScanStepStatus = real
          ? statusRef.current.judgeStatus ?? "queued"
          : active.current >= ENGINES.length
          ? "running"
          : "queued";
        if (js === "done") return 100;
        if (js === "running") return Math.min(real ? 95 : 97, j + Math.random() * 9 + 4);
        return j;
      });
    }, 140);
    return () => clearInterval(id);
  }, [real]);

  const engState = (ei: number): ScanStepStatus => {
    const r = bars[ei];
    if (r.every((v) => v >= 100)) return "done";
    if (r.some((v) => v > 0)) return "running";
    return "queued";
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <p className="mb-4 text-center text-sm text-gray-400">
        Scanning <span className="text-gray-200">{brand}</span> across AI engines…
      </p>
      <div className="space-y-2.5">
        {ENGINES.map((name, ei) => {
          const st = engState(ei);
          return (
            <div
              key={name}
              className={`rounded-xl border px-4 py-3 transition-colors ${
                st === "done"
                  ? "border-emerald-500/15 bg-emerald-500/5"
                  : st === "running"
                  ? "border-cyan-500/20 bg-gray-900/60"
                  : "border-white/5 bg-gray-900/40"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`flex h-6 w-6 items-center justify-center ${
                    st === "queued" ? "text-gray-600" : "text-gray-200"
                  }`}
                >
                  <EngineIcon name={name} className="h-4 w-4" />
                </span>
                <span className="flex-1 text-sm font-medium text-white">{name}</span>
                <span
                  className={`font-mono text-[11px] ${
                    st === "done" ? "text-emerald-400" : st === "running" ? "text-cyan-400" : "text-gray-600"
                  }`}
                >
                  {st === "done" ? "complete ✓" : st === "running" ? "scanning…" : "queued"}
                </span>
              </div>
              <div className="mt-2.5 space-y-1.5">
                {METRICS.map((m, mi) => {
                  const p = Math.round(bars[ei][mi]);
                  return (
                    <div key={m.label} className="flex items-center gap-2">
                      <span className="w-16 shrink-0 text-[11px] text-gray-500">{m.label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-800">
                        <div
                          className={`h-1.5 rounded-full bg-gradient-to-r ${m.bar} transition-all duration-150`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right font-mono text-[11px] text-gray-400">{p}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Judge / scoring */}
        <div
          className={`rounded-xl border px-4 py-3 transition-colors ${
            judge >= 100 ? "border-emerald-500/15 bg-emerald-500/5" : judge > 0 ? "border-cyan-500/20 bg-gray-900/60" : "border-white/5 bg-gray-900/40"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className={`flex h-6 w-6 items-center justify-center ${judge > 0 ? "text-cyan-300" : "text-gray-600"}`}>
              <span className="h-2 w-2 rounded-full bg-current" />
            </span>
            <span className="flex-1 text-sm font-medium text-white">Scoring with judge model</span>
            <span className={`font-mono text-[11px] ${judge >= 100 ? "text-emerald-400" : judge > 0 ? "text-cyan-400" : "text-gray-600"}`}>
              {judge >= 100 ? "complete ✓" : judge > 0 ? "scoring…" : "queued"}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-2">
            <span className="w-16 shrink-0 text-[11px] text-gray-500">Overall</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-800">
              <div className="h-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-150" style={{ width: `${Math.round(judge)}%` }} />
            </div>
            <span className="w-9 shrink-0 text-right font-mono text-[11px] text-gray-400">{Math.round(judge)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
