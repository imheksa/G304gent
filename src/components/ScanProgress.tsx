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

  const doneCount = ENGINES.filter((_, ei) => engState(ei) === "done").length;

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-col items-center gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div className="text-center sm:text-left">
          <p className="font-mono text-xs uppercase tracking-widest text-cyan-400">Quick Scan</p>
          <h3 className="mt-1 text-lg font-semibold text-white">
            Scanning <span className="text-cyan-300">{brand}</span> across AI engines…
          </h3>
        </div>
        <span className="font-mono text-xs text-gray-400">
          {doneCount}/{ENGINES.length} engines complete
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {ENGINES.map((name, ei) => {
          const st = engState(ei);
          return (
            <div
              key={name}
              className={`rounded-xl border p-5 transition-colors ${
                st === "done"
                  ? "border-emerald-500/15 bg-emerald-500/5"
                  : st === "running"
                  ? "border-cyan-500/25 bg-gray-900/60 ring-1 ring-cyan-500/10"
                  : "border-white/5 bg-gray-900/40"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ${
                    st === "queued" ? "text-gray-600" : "text-gray-200"
                  }`}
                >
                  <EngineIcon name={name} className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm font-semibold text-white">{name}</span>
                <span
                  className={`font-mono text-[11px] ${
                    st === "done" ? "text-emerald-400" : st === "running" ? "text-cyan-400" : "text-gray-600"
                  }`}
                >
                  {st === "done" ? "complete ✓" : st === "running" ? "scanning…" : "queued"}
                </span>
              </div>
              <div className="mt-4 space-y-2.5">
                {METRICS.map((m, mi) => {
                  const p = Math.round(bars[ei][mi]);
                  return (
                    <div key={m.label} className="flex items-center gap-3">
                      <span className="w-16 shrink-0 text-xs text-gray-500">{m.label}</span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
                        <div
                          className={`h-2 rounded-full bg-gradient-to-r ${m.bar} transition-all duration-150`}
                          style={{ width: `${p}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right font-mono text-xs text-gray-400">{p}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Judge / scoring — full width */}
      <div
        className={`mt-4 rounded-xl border p-5 transition-colors ${
          judge >= 100 ? "border-emerald-500/15 bg-emerald-500/5" : judge > 0 ? "border-cyan-500/25 bg-gray-900/60 ring-1 ring-cyan-500/10" : "border-white/5 bg-gray-900/40"
        }`}
      >
        <div className="flex items-center gap-3">
          <span className={`flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 ${judge > 0 ? "text-cyan-300" : "text-gray-600"}`}>
            <span className="h-2.5 w-2.5 rounded-full bg-current" />
          </span>
          <span className="flex-1 text-sm font-semibold text-white">Scoring with judge model</span>
          <span className={`font-mono text-[11px] ${judge >= 100 ? "text-emerald-400" : judge > 0 ? "text-cyan-400" : "text-gray-600"}`}>
            {judge >= 100 ? "complete ✓" : judge > 0 ? "scoring…" : "queued"}
          </span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <span className="w-16 shrink-0 text-xs text-gray-500">Overall</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-800">
            <div className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-150" style={{ width: `${Math.round(judge)}%` }} />
          </div>
          <span className="w-9 shrink-0 text-right font-mono text-xs text-gray-400">{Math.round(judge)}%</span>
        </div>
      </div>
    </div>
  );
}
