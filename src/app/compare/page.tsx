"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { generateData, type BrandData } from "@/lib/brand-data";
import { fetchBrandNames, fetchCompetitorNames, fetchScan, quickScan, AI_ENABLED } from "@/lib/store";
import AuthGate from "@/components/AuthGate";
import AccountButton from "@/components/AccountButton";
import { ChipLogo } from "@/components/Logo";
import { useAccess, goToPricing } from "@/lib/use-access";

export default function ComparePage() {
  return (
    <AuthGate>
      <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
        <CompareInner />
      </Suspense>
    </AuthGate>
  );
}

function CompareInner() {
  const searchParams = useSearchParams();
  const [brandA, setBrandA] = useState(searchParams.get("a") || "");
  const [brandB, setBrandB] = useState(searchParams.get("b") || "");
  const [myBrands, setMyBrands] = useState<string[]>([]);
  const [competitors, setCompetitors] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchBrandNames(), fetchCompetitorNames()])
      .then(([mb, comp]) => {
        if (cancelled) return;
        setMyBrands(mb);
        setCompetitors(comp);
        if (!brandA && mb.length > 0) setBrandA(mb[0]);
        if (!brandB && comp.length > 0) setBrandB(comp[0]);
      })
      .catch(() => {
        /* leave the selectors empty if the lookup fails */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { canAccess } = useAccess();
  const locked = !canAccess("subscribed");

  const [dataA, setDataA] = useState<BrandData | null>(null);
  const [dataB, setDataB] = useState<BrandData | null>(null);
  const [loadingA, setLoadingA] = useState(false);
  const [loadingB, setLoadingB] = useState(false);

  // Load a brand's real scan for comparison: prefer the stored scan, and only
  // run a fresh scan if none exists yet (quickScan also returns cached data on
  // cooldown). Falls back to the generator when the AI backend is off.
  async function loadCompare(brand: string): Promise<BrandData | null> {
    if (!brand) return null;
    if (!AI_ENABLED) return generateData(brand);
    const stored = await fetchScan(brand);
    if (stored) return stored;
    const r = await quickScan(brand);
    if (r.status === "ok" || r.status === "cooldown") return r.data;
    return null;
  }

  useEffect(() => {
    let cancelled = false;
    if (!brandA) { setDataA(null); return; }
    setLoadingA(true);
    loadCompare(brandA)
      .then((d) => { if (!cancelled) setDataA(d); })
      .catch(() => { if (!cancelled) setDataA(null); })
      .finally(() => { if (!cancelled) setLoadingA(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandA]);

  useEffect(() => {
    let cancelled = false;
    if (!brandB) { setDataB(null); return; }
    setLoadingB(true);
    loadCompare(brandB)
      .then((d) => { if (!cancelled) setDataB(d); })
      .catch(() => { if (!cancelled) setDataB(null); })
      .finally(() => { if (!cancelled) setLoadingB(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandB]);

  const loading = loadingA || loadingB;
  const bothReady = Boolean(dataA && dataB);

  return (
    <div className="min-h-screen bg-gray-950">
      <nav className="border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-24">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
            <ChipLogo className="w-5 h-5" />
            <span className="text-gradient">6304</span>
            <span className="text-white">&nbsp;Agent</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/brands" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">My Brands</Link>
            <Link href="/compare" className="text-sm text-cyan-400 font-medium">Compare</Link>
            <Link href="/distribute" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Distribute</Link>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Dashboard</Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Home</Link>
            <AccountButton />
          </div>
        </div>
      </nav>

      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-8">
        <h1 className="text-3xl font-bold text-white lg:text-4xl">Compare Brands</h1>
        <p className="mt-1 text-sm text-gray-500">My Brand vs Competitor — side-by-side AI visibility</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          <BrandSelector
            label="My Brand"
            value={brandA}
            onChange={setBrandA}
            options={myBrands}
            color="cyan"
            emptyLabel="No brands added yet"
            addLink="/brands"
            addLabel="Add a brand"
          />
          <BrandSelector
            label="Competitor"
            value={brandB}
            onChange={setBrandB}
            options={competitors}
            color="orange"
            emptyLabel="No competitors added yet"
            addLink="/brands"
            addLabel="Add a competitor"
          />
        </div>

        {loading && (
          <div className="mt-12 flex flex-col items-center gap-3 py-12 text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <p className="text-sm text-gray-400">Running real AI scans across all engines…</p>
          </div>
        )}

        {dataA && dataB && !loading && (
          <div className="mt-10 space-y-8">
            {/* Score Overview */}
            <div className="grid gap-4 md:grid-cols-4">
              <CompareMetric label="Brand Score" valueA={dataA.brandScore} valueB={dataB.brandScore} unit="/100" brandA={brandA} brandB={brandB} />
              <CompareMetric label="Share of Answer" valueA={dataA.soa} valueB={dataB.soa} unit="%" brandA={brandA} brandB={brandB} />
              <CompareMetric label="Accuracy" valueA={dataA.accuracy} valueB={dataB.accuracy} unit="%" brandA={brandA} brandB={brandB} />
              <CompareMetric label="Citation Rate" valueA={dataA.citation} valueB={dataB.citation} unit="%" brandA={brandA} brandB={brandB} />
            </div>

            {/* Winner Summary */}
            <WinnerSummary brandA={brandA} brandB={brandB} dataA={dataA} dataB={dataB} />

            <LockedSection locked={locked}>
            {/* AI Engine Presence */}
            <div className="rounded-xl border border-white/5 bg-gray-900/50 p-6">
              <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400">AI Engine Presence</h3>
              <div className="mt-6 space-y-3">
                {dataA.engines.map((engineA, i) => {
                  const engineB = dataB.engines[i];
                  return (
                    <div key={engineA.name} className="flex items-center gap-4 rounded-lg border border-white/5 bg-gray-950/50 px-5 py-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 font-mono text-sm text-gray-400">
                        {engineA.icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">{engineA.name}</p>
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="text-right w-28">
                          <p className="text-xs text-gray-500">{brandA}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-mono ${
                            engineA.status === "mentioned" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {engineA.status === "mentioned" ? `Found (${engineA.accuracy}%)` : "Missing"}
                          </span>
                        </div>
                        <div className="h-8 w-px bg-white/10" />
                        <div className="w-28">
                          <p className="text-xs text-gray-500">{brandB}</p>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-mono ${
                            engineB.status === "mentioned" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                          }`}>
                            {engineB.status === "mentioned" ? `Found (${engineB.accuracy}%)` : "Missing"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SoA Trend */}
            <div className="rounded-xl border border-white/5 bg-gray-900/50 p-6">
              <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400">Share of Answer Trend</h3>
              <p className="mt-1 text-xs text-gray-400">Share of Answer across recent scans</p>
              <div className="mt-6 space-y-3">
                {dataA.soaTrend.map((weekA, i) => {
                  const weekB = dataB.soaTrend[i];
                  if (!weekB) return null;
                  const max = 60;
                  return (
                    <div key={weekA.week} className="flex items-center gap-3">
                      <span className="w-8 text-xs font-mono text-gray-500">{weekA.week}</span>
                      <div className="flex-1 flex gap-1">
                        <div className="relative h-6 flex-1 rounded-md bg-gray-800/50 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-cyan-500/60 to-cyan-500/30"
                            style={{ width: `${(weekA.you / max) * 100}%` }}
                          />
                          <span className="absolute inset-y-0 left-2 flex items-center text-xs font-mono text-cyan-300">{weekA.you}%</span>
                        </div>
                        <div className="relative h-6 flex-1 rounded-md bg-gray-800/50 overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-orange-500/60 to-orange-500/30"
                            style={{ width: `${(weekB.you / max) * 100}%` }}
                          />
                          <span className="absolute inset-y-0 left-2 flex items-center text-xs font-mono text-orange-300">{weekB.you}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div className="flex gap-6 mt-2 ml-11">
                  <span className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="h-2 w-6 rounded-full bg-cyan-500/60" /> {brandA}
                  </span>
                  <span className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="h-2 w-6 rounded-full bg-orange-500/60" /> {brandB}
                  </span>
                </div>
              </div>
            </div>

            {/* Alerts */}
            <div className="rounded-xl border border-white/5 bg-gray-900/50 p-6">
              <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400">Alerts Summary</h3>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <AlertSummary brand={brandA} alerts={dataA.alerts} color="cyan" />
                <AlertSummary brand={brandB} alerts={dataB.alerts} color="orange" />
              </div>
            </div>
            </LockedSection>
          </div>
        )}

        {!bothReady && !loading && (myBrands.length === 0 || competitors.length === 0) && (
          <div className="mt-16 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/5 bg-gray-900/50">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-gray-400">
                <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-white">
              {myBrands.length === 0 && competitors.length === 0
                ? "Add brands and competitors to compare"
                : myBrands.length === 0
                ? "Add a brand first"
                : "Add a competitor to compare against"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">Go to My Brands to add your brand and competitors</p>
            <Link
              href="/brands"
              className="mt-6 inline-block rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3 text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all"
            >
              Go to My Brands
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function LockedSection({ locked, children }: { locked: boolean; children: React.ReactNode }) {
  if (!locked) return <>{children}</>;
  return (
    <div className="relative">
      <div className="pointer-events-none select-none space-y-8 blur-md" aria-hidden>
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center pt-24">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-violet-500/20 bg-gray-950/80 px-8 py-7 text-center shadow-2xl backdrop-blur-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
          </div>
          <p className="text-base font-semibold text-white">Unlock the full comparison</p>
          <p className="max-w-sm text-sm text-gray-400">
            AI engine presence, share-of-answer trend, and alerts are available on a paid plan.
          </p>
          <button
            onClick={goToPricing}
            className="mt-1 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white hover:from-cyan-400 hover:to-violet-400 transition-all"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}

function BrandSelector({ label, value, onChange, options, color, emptyLabel, addLink, addLabel }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  color: "cyan" | "orange";
  emptyLabel: string;
  addLink: string;
  addLabel: string;
}) {
  const borderColor = color === "cyan" ? "border-cyan-500/20" : "border-orange-500/20";
  const labelColor = color === "cyan" ? "text-cyan-400" : "text-orange-400";
  const activeTag = color === "cyan"
    ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
    : "bg-orange-500/20 border-orange-500/40 text-orange-300";
  const inactiveTag = color === "cyan"
    ? "border-white/10 text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/20"
    : "border-white/10 text-gray-400 hover:bg-orange-500/10 hover:text-orange-400 hover:border-orange-500/20";

  return (
    <div className={`rounded-xl border ${borderColor} bg-gray-900/50 p-5`}>
      <p className={`text-xs font-mono uppercase tracking-widest ${labelColor}`}>{label}</p>
      {options.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {options.map((name) => (
            <button
              key={name}
              onClick={() => onChange(name)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                value === name ? activeTag : inactiveTag
              }`}
            >
              {name}
            </button>
          ))}
        </div>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-gray-400">{emptyLabel}</p>
          <Link href={addLink} className={`mt-2 inline-block text-sm font-medium ${labelColor} hover:underline`}>
            {addLabel}
          </Link>
        </div>
      )}
    </div>
  );
}

function WinnerSummary({ brandA, brandB, dataA, dataB }: {
  brandA: string;
  brandB: string;
  dataA: ReturnType<typeof generateData>;
  dataB: ReturnType<typeof generateData>;
}) {
  const metrics = [
    { label: "Brand Score", a: dataA.brandScore, b: dataB.brandScore },
    { label: "Share of Answer", a: dataA.soa, b: dataB.soa },
    { label: "Accuracy", a: dataA.accuracy, b: dataB.accuracy },
    { label: "Citation Rate", a: dataA.citation, b: dataB.citation },
  ];
  const winsA = metrics.filter((m) => m.a > m.b).length;
  const winsB = metrics.filter((m) => m.b > m.a).length;
  const leader = winsA > winsB ? "A" : winsB > winsA ? "B" : "tie";
  const leaderName = leader === "A" ? brandA : leader === "B" ? brandB : null;

  return (
    <div className={`rounded-xl border p-5 ${
      leader === "A" ? "border-cyan-500/20 bg-cyan-500/5" : leader === "B" ? "border-orange-500/20 bg-orange-500/5" : "border-white/5 bg-gray-900/50"
    }`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500">Overall Leader</p>
          <p className={`mt-1 text-lg font-bold ${
            leader === "A" ? "text-cyan-400" : leader === "B" ? "text-orange-400" : "text-gray-400"
          }`}>
            {leaderName || "Tied"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-cyan-400">{winsA}</p>
            <p className="text-xs text-gray-500">{brandA}</p>
          </div>
          <span className="text-gray-400 text-sm">vs</span>
          <div className="text-center">
            <p className="text-2xl font-bold text-orange-400">{winsB}</p>
            <p className="text-xs text-gray-500">{brandB}</p>
          </div>
        </div>
      </div>
      <div className="mt-3 flex gap-1">
        {metrics.map((m) => (
          <div key={m.label} className={`flex-1 h-1.5 rounded-full ${
            m.a > m.b ? "bg-cyan-500" : m.b > m.a ? "bg-orange-500" : "bg-gray-600"
          }`} title={`${m.label}: ${m.a} vs ${m.b}`} />
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-gray-400">
        {metrics.map((m) => (
          <span key={m.label}>{m.label}</span>
        ))}
      </div>
    </div>
  );
}

function CompareMetric({ label, valueA, valueB, unit, brandA, brandB }: {
  label: string;
  valueA: number;
  valueB: number;
  unit: string;
  brandA: string;
  brandB: string;
}) {
  const diff = valueA - valueB;
  const winner = diff > 0 ? "A" : diff < 0 ? "B" : "tie";

  return (
    <div className="rounded-xl border border-white/5 bg-gray-900/50 p-5">
      <p className="text-xs font-mono uppercase tracking-widest text-gray-500">{label}</p>
      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-gray-400 truncate max-w-[80px]">{brandA}</p>
          <p className={`text-2xl font-bold ${winner === "A" ? "text-cyan-400" : "text-gray-400"}`}>
            {valueA}<span className="text-xs text-gray-500">{unit}</span>
          </p>
        </div>
        <div className="flex flex-col items-center px-2">
          <span className="text-xs text-gray-400">vs</span>
          {winner !== "tie" && (
            <span className={`mt-1 rounded-full px-1.5 py-0.5 text-[10px] font-mono ${
              winner === "A" ? "bg-cyan-500/10 text-cyan-400" : "bg-orange-500/10 text-orange-400"
            }`}>
              {diff > 0 ? `+${diff}` : diff}
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 truncate max-w-[80px]">{brandB}</p>
          <p className={`text-2xl font-bold ${winner === "B" ? "text-orange-400" : "text-gray-400"}`}>
            {valueB}<span className="text-xs text-gray-500">{unit}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function AlertSummary({ brand, alerts, color }: {
  brand: string;
  alerts: { severity: string; issue: string; engine: string }[];
  color: "cyan" | "orange";
}) {
  const high = alerts.filter((a) => a.severity === "high").length;
  const medium = alerts.filter((a) => a.severity === "medium").length;
  const headerColor = color === "cyan" ? "text-cyan-400" : "text-orange-400";

  return (
    <div className="rounded-lg border border-white/5 bg-gray-950/50 p-4">
      <div className="flex items-center justify-between">
        <h4 className={`text-sm font-semibold ${headerColor}`}>{brand}</h4>
        <div className="flex gap-2">
          <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-mono text-red-400">{high} high</span>
          <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-mono text-amber-400">{medium} med</span>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {alerts.slice(0, 3).map((alert, i) => (
          <div key={i} className="flex items-start gap-2">
            <span className={`mt-1 h-1.5 w-1.5 shrink-0 rounded-full ${
              alert.severity === "high" ? "bg-red-400" : alert.severity === "medium" ? "bg-amber-400" : "bg-blue-400"
            }`} />
            <p className="text-xs text-gray-400 truncate">{alert.issue}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
