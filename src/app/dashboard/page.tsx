"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { generateData, getSavedBrands, type BrandData } from "@/lib/brand-data";
import AuthGate from "@/components/AuthGate";
import AccountButton from "@/components/AccountButton";

type Tab = "overview" | "engines" | "alerts" | "facts";

export default function Dashboard() {
  return (
    <AuthGate>
      <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
        <DashboardInner />
      </Suspense>
    </AuthGate>
  );
}

function DashboardInner() {
  const searchParams = useSearchParams();
  const brandParam = searchParams.get("brand");
  const [brand, setBrand] = useState(brandParam || "");
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!brandParam) {
      const brands = getSavedBrands();
      setBrand(brands[0] || "Uniswap");
    }
  }, [brandParam]);

  const data = brand ? generateData(brand) : null;

  if (!data) return null;

  const tabs: Tab[] = ["overview", "engines", "alerts", "facts"];

  return (
    <div className="min-h-screen bg-gray-950">
      <DashboardNav />
      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">{brand}</h1>
            <p className="mt-1 text-sm text-gray-500">AI Visibility Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1 text-xs font-mono text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Monitoring
            </span>
            <button className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all">
              Export Report
            </button>
          </div>
        </div>

        <div className="mt-6 flex gap-1 rounded-lg border border-white/5 bg-gray-900/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-all ${
                activeTab === tab
                  ? "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {tab === "facts" ? "Canonical Facts" : tab}
              {tab === "alerts" && (
                <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-xs text-red-400">
                  {data.alerts.filter((a) => a.severity === "high").length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === "overview" && <OverviewTab data={data} />}
          {activeTab === "engines" && <EnginesTab data={data} />}
          {activeTab === "alerts" && <AlertsTab data={data} />}
          {activeTab === "facts" && <FactsTab data={data} />}
        </div>
      </div>
    </div>
  );
}

function DashboardNav() {
  return (
    <nav className="border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-24">
        <a href="/G304gent/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-cyan-400">
            <path d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" /><path d="M12 7.5v9M8.1 9.75L12 12l3.9-2.25" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="text-gradient">6304</span>
          <span className="text-white">&nbsp;Agent</span>
        </a>
        <div className="flex items-center gap-6">
          <a href="/G304gent/dashboard" className="text-sm text-cyan-400 font-medium">Dashboard</a>
          <a href="/G304gent/brands" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">My Brands</a>
          <a href="/G304gent/compare" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Compare</a>
          <a href="/G304gent/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Home</a>
          <AccountButton />
        </div>
      </div>
    </nav>
  );
}

type DashData = BrandData;

function OverviewTab({ data }: { data: DashData }) {
  const { summaryCards, engines, soaTrend, alerts, topQueries } = data;
  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-white/5 bg-gray-900/50 p-6">
            <p className="text-xs font-mono uppercase tracking-widest text-gray-500">{card.label}</p>
            <div className="mt-3 flex items-baseline gap-1">
              <span className={`text-3xl font-bold ${card.color}`}>{card.value}</span>
              <span className="text-sm text-gray-500">{card.unit}</span>
            </div>
            <div className="mt-2">
              <span className={`text-xs font-mono ${card.change.startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>
                {card.change} vs last week
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-white/5 bg-gray-900/50 p-6">
          <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400">Share of Answer Trend</h3>
          <p className="mt-1 text-xs text-gray-400">You vs top competitor — last 6 weeks</p>
          <div className="mt-6">
            <SoAChart soaTrend={soaTrend} />
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-gray-900/50 p-6">
          <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400">AI Engine Status</h3>
          <div className="mt-4 space-y-3">
            {engines.map((e) => (
              <div key={e.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-gray-950/50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 font-mono text-xs text-gray-400">
                    {e.icon}
                  </div>
                  <span className="text-sm text-white">{e.name}</span>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-mono ${
                  e.status === "mentioned" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                }`}>
                  {e.status === "mentioned" ? "Found" : "Missing"}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-white/5 bg-gray-900/50 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400">Recent Alerts</h3>
              <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-xs font-mono text-red-400">
                {alerts.filter((a) => a.severity === "high").length} critical
              </span>
            </div>
            <div className="mt-4 space-y-2">
              {alerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-start gap-3 rounded-lg border border-white/5 bg-gray-950/50 px-4 py-3">
                  <SeverityDot severity={alert.severity} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">{alert.issue}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {alert.engine} · &quot;{alert.query}&quot; · {alert.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-gray-900/50 p-6">
            <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400">Top Monitored Queries</h3>
            <div className="mt-4 space-y-2">
              {topQueries.slice(0, 3).map((q) => (
                <div key={q.query} className="flex items-center justify-between rounded-lg border border-white/5 bg-gray-950/50 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white truncate">&quot;{q.query}&quot;</p>
                    <p className="mt-0.5 text-xs text-gray-500">{q.mentions} mentions · {q.accuracy}% accuracy</p>
                  </div>
                  <TrendArrow trend={q.trend} />
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
}

function EnginesTab({ data }: { data: DashData }) {
  const { engines } = data;
  return (
    <div className="space-y-6">
      {engines.map((engine) => (
        <div key={engine.name} className="rounded-xl border border-white/5 bg-gray-900/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 font-mono text-lg text-gray-300">
                {engine.icon}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">{engine.name}</h3>
                <p className="text-xs text-gray-500">Last checked {engine.lastChecked}</p>
              </div>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-mono ${
              engine.status === "mentioned" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}>
              {engine.status === "mentioned" ? "Brand Found" : "Brand Missing"}
            </span>
          </div>
          {engine.status === "mentioned" && (
            <div className="mt-6 grid grid-cols-3 gap-4">
              <MetricBar label="Accuracy" value={engine.accuracy} color="emerald" />
              <MetricBar label="Share of Answer" value={engine.soa} color="cyan" />
              <MetricBar label="Sentiment" value={74} color="violet" />
            </div>
          )}
          {engine.status === "not_found" && (
            <div className="mt-6 rounded-lg border border-red-500/10 bg-red-500/5 p-4">
              <p className="text-sm text-red-400">Your brand was not found in recent queries on this engine.</p>
              <p className="mt-1 text-xs text-gray-500">Recommendation: Improve content distribution targeting {engine.name} sources.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AlertsTab({ data }: { data: DashData }) {
  const { alerts } = data;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 mb-6">
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-red-400" /> High
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-amber-400" /> Medium
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-2 rounded-full bg-blue-400" /> Low
        </span>
      </div>
      {alerts.map((alert) => (
        <div key={alert.id} className="rounded-xl border border-white/5 bg-gray-900/50 p-6">
          <div className="flex items-start gap-4">
            <SeverityDot severity={alert.severity} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-white">{alert.issue}</h4>
                <span className="text-xs text-gray-500">{alert.time}</span>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span className="rounded-md bg-white/5 px-2 py-0.5 text-xs font-mono text-gray-400">{alert.engine}</span>
                <span className="text-xs text-gray-500">Query: &quot;{alert.query}&quot;</span>
              </div>
              <div className="mt-4 flex gap-2">
                <button className="rounded-md border border-cyan-500/20 bg-cyan-500/5 px-3 py-1.5 text-xs font-medium text-cyan-400 hover:bg-cyan-500/10 transition-colors">
                  View Response
                </button>
                <button className="rounded-md border border-white/10 px-3 py-1.5 text-xs font-medium text-gray-400 hover:bg-white/5 transition-colors">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FactsTab({ data }: { data: DashData }) {
  const { canonicalFacts } = data;
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-white/5 bg-gray-900/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-mono uppercase tracking-widest text-gray-400">Canonical Facts</h3>
            <p className="mt-1 text-xs text-gray-400">Your brand&apos;s source of truth — compared against AI responses</p>
          </div>
          <button className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/10 transition-colors">
            + Add Fact
          </button>
        </div>
        <div className="mt-6 space-y-2">
          {canonicalFacts.map((fact) => (
            <div key={fact.fact} className="flex items-center justify-between rounded-lg border border-white/5 bg-gray-950/50 px-5 py-4">
              <div className="flex items-center gap-4">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs ${
                  fact.status === "accurate"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : fact.status === "violated"
                    ? "bg-red-500/10 text-red-400"
                    : "bg-amber-500/10 text-amber-400"
                }`}>
                  {fact.status === "accurate" ? "✓" : fact.status === "violated" ? "✗" : "?"}
                </span>
                <div>
                  <p className="text-sm text-white">{fact.fact}</p>
                  <p className="text-xs text-gray-500">
                    {fact.status === "accurate" && "All AI engines report this correctly"}
                    {fact.status === "violated" && `${fact.violations} engine(s) contradict this fact`}
                    {fact.status === "missing" && `${fact.violations} engine(s) don't mention this`}
                  </p>
                </div>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-mono capitalize ${
                fact.status === "accurate"
                  ? "bg-emerald-500/10 text-emerald-400"
                  : fact.status === "violated"
                  ? "bg-red-500/10 text-red-400"
                  : "bg-amber-500/10 text-amber-400"
              }`}>
                {fact.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total Facts" value="6" color="text-cyan-400" />
        <StatCard label="Violations" value="3" color="text-red-400" />
        <StatCard label="Accuracy Rate" value="50%" color="text-emerald-400" />
      </div>
    </div>
  );
}

function SoAChart({ soaTrend }: { soaTrend: { week: string; you: number; competitor: number }[] }) {
  const max = 60;
  return (
    <div className="space-y-3">
      {soaTrend.map((d) => (
        <div key={d.week} className="flex items-center gap-3">
          <span className="w-8 text-xs font-mono text-gray-500">{d.week}</span>
          <div className="flex-1 flex gap-1">
            <div className="relative h-6 flex-1 rounded-md bg-gray-800/50 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-cyan-500/60 to-cyan-500/30"
                style={{ width: `${(d.you / max) * 100}%` }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-xs font-mono text-cyan-300">{d.you}%</span>
            </div>
            <div className="relative h-6 flex-1 rounded-md bg-gray-800/50 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-md bg-gradient-to-r from-gray-600/60 to-gray-600/30"
                style={{ width: `${(d.competitor / max) * 100}%` }}
              />
              <span className="absolute inset-y-0 left-2 flex items-center text-xs font-mono text-gray-400">{d.competitor}%</span>
            </div>
          </div>
        </div>
      ))}
      <div className="flex gap-6 mt-2 ml-11">
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-6 rounded-full bg-cyan-500/60" /> You
        </span>
        <span className="flex items-center gap-2 text-xs text-gray-500">
          <span className="h-2 w-6 rounded-full bg-gray-600/60" /> Top Competitor
        </span>
      </div>
    </div>
  );
}

function MetricBar({ label, value, color }: { label: string; value: number; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "from-emerald-500/60 to-emerald-500/20 text-emerald-400",
    cyan: "from-cyan-500/60 to-cyan-500/20 text-cyan-400",
    violet: "from-violet-500/60 to-violet-500/20 text-violet-400",
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        <span className={`text-sm font-mono font-bold ${colorMap[color].split(" ").pop()}`}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-gray-800">
        <div className={`h-2 rounded-full bg-gradient-to-r ${colorMap[color]}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function SeverityDot({ severity }: { severity: string }) {
  const colorMap: Record<string, string> = {
    high: "bg-red-400",
    medium: "bg-amber-400",
    low: "bg-blue-400",
  };
  return <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${colorMap[severity]}`} />;
}

function TrendArrow({ trend }: { trend: string }) {
  if (trend === "up") return <span className="text-emerald-400 text-sm">↑</span>;
  if (trend === "down") return <span className="text-red-400 text-sm">↓</span>;
  return <span className="text-gray-500 text-sm">→</span>;
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-gray-900/50 p-6 text-center">
      <p className="text-xs font-mono uppercase tracking-widest text-gray-500">{label}</p>
      <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
