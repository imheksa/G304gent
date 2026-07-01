"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  generateData,
  TIER_LIMITS,
  TIER_LABELS,
  type BrandProfile,
  type SubscriptionTier,
} from "@/lib/brand-data";
import {
  fetchBrands,
  fetchCompetitors,
  saveBrand,
  deleteBrand,
  fetchTier,
  streamScan,
  AI_ENABLED,
  type ScanProgressEvent,
} from "@/lib/store";
import AuthGate from "@/components/AuthGate";
import AccountButton from "@/components/AccountButton";
import { ChipLogo } from "@/components/Logo";
import { ScanProgress, type ScanStepStatus } from "@/components/ScanProgress";

const SCAN_ENGINES = ["ChatGPT", "Gemini", "Claude", "Grok", "Deepseek", "Google AI"];

export default function BrandsPage() {
  return (
    <AuthGate>
      <BrandsPageInner />
    </AuthGate>
  );
}

function BrandsPageInner() {
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [competitors, setCompetitors] = useState<BrandProfile[]>([]);
  const [tier, setTier] = useState<SubscriptionTier>("free");
  const [showForm, setShowForm] = useState(false);
  const [showCompForm, setShowCompForm] = useState(false);
  const [editBrand, setEditBrand] = useState<BrandProfile | null>(null);
  const [editComp, setEditComp] = useState<BrandProfile | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"brands" | "competitors">("brands");

  useEffect(() => {
    refresh();
  }, []);

  async function refresh() {
    try {
      const [b, c, t] = await Promise.all([fetchBrands(), fetchCompetitors(), fetchTier()]);
      setBrands(b);
      setCompetitors(c);
      setTier(t);
    } catch {
      /* keep the current view if a refresh fails instead of crashing */
    }
  }

  async function handleSave(profile: BrandProfile) {
    await saveBrand(profile, false);
    await refresh();
    setShowForm(false);
    setEditBrand(null);
  }

  async function handleRemove(name: string) {
    try {
      await deleteBrand(name, false);
      await refresh();
    } catch {
      /* keep the card if delete fails */
    } finally {
      setDeleteConfirm(null);
    }
  }

  async function handleCompSave(profile: BrandProfile) {
    await saveBrand(profile, true);
    await refresh();
    setShowCompForm(false);
    setEditComp(null);
  }

  async function handleCompRemove(name: string) {
    try {
      await deleteBrand(name, true);
      await refresh();
    } catch {
      /* keep the card if delete fails */
    } finally {
      setDeleteConfirm(null);
    }
  }

  const compLimit = TIER_LIMITS[tier];
  const canAddComp = competitors.length < compLimit;
  const allBrandNames = [...brands.map((b) => b.name), ...competitors.map((c) => c.name)];

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
            <Link href="/brands" className="text-sm text-cyan-400 font-medium">My Brands</Link>
            <Link href="/compare" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Compare</Link>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Dashboard</Link>
            <Link href="/" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Home</Link>
            <AccountButton />
          </div>
        </div>
      </nav>

      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24 py-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white lg:text-4xl">My Brands</h1>
            <p className="mt-1 text-sm text-gray-500">Track your brands and competitors across AI engines</p>
          </div>
          <a
            href="/compare"
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
          >
            Compare Brands
          </a>
        </div>

        {/* Tabs */}
        <div className="mt-8 flex items-center gap-1 rounded-lg border border-white/5 bg-gray-900/50 p-1 w-fit">
          <button
            onClick={() => setActiveTab("brands")}
            className={`rounded-md px-5 py-2 text-sm font-medium transition-all ${
              activeTab === "brands"
                ? "bg-gradient-to-r from-cyan-500/20 to-violet-500/20 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            My Brands
            <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-xs">{brands.length}</span>
          </button>
          <button
            onClick={() => setActiveTab("competitors")}
            className={`rounded-md px-5 py-2 text-sm font-medium transition-all ${
              activeTab === "competitors"
                ? "bg-gradient-to-r from-orange-500/20 to-red-500/20 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            Competitors
            <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-xs">{competitors.length}/{compLimit}</span>
          </button>
        </div>

        {/* My Brands Tab */}
        {activeTab === "brands" && (
          <div className="mt-6">
            <div className="flex justify-end">
              <button
                onClick={() => { setEditBrand(null); setShowForm(true); }}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2 text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all"
              >
                + Add Brand
              </button>
            </div>

            {showForm && (
              <BrandForm
                initial={editBrand}
                existingNames={allBrandNames}
                onSave={handleSave}
                onCancel={() => { setShowForm(false); setEditBrand(null); }}
                accentColor="cyan"
              />
            )}

            {brands.length === 0 && !showForm ? (
              <EmptyState
                icon={<><path d="M12 2L21.5 7.5V16.5L12 22L2.5 16.5V7.5L12 2Z" /><path d="M12 8v4M12 16h.01" /></>}
                title="No brands yet"
                description="Add your first brand to start tracking AI visibility"
                buttonLabel="+ Add Your First Brand"
                onClick={() => { setEditBrand(null); setShowForm(true); }}
              />
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {brands.map((profile) => (
                  <BrandCard
                    key={profile.name}
                    profile={profile}
                    deleteConfirm={deleteConfirm}
                    onEdit={() => { setEditBrand(profile); setShowForm(true); }}
                    onDelete={() => setDeleteConfirm(profile.name)}
                    onDeleteConfirm={() => handleRemove(profile.name)}
                    onDeleteCancel={() => setDeleteConfirm(null)}
                    accent="cyan"
                    showDashboard
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Competitors Tab */}
        {activeTab === "competitors" && (
          <div className="mt-6">
            <div className="flex items-center justify-between">
              <TierBadge tier={tier} compCount={competitors.length} limit={compLimit} />
              <button
                onClick={() => { setEditComp(null); setShowCompForm(true); }}
                disabled={!canAddComp}
                className={`rounded-lg px-5 py-2 text-sm font-medium transition-all ${
                  canAddComp
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-400 hover:to-red-400"
                    : "bg-gray-800 text-gray-400 cursor-not-allowed"
                }`}
              >
                + Add Competitor
              </button>
            </div>

            {!canAddComp && (
              <div className="mt-4 rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-400">Competitor limit reached</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    Your {TIER_LABELS[tier]} plan allows {compLimit} competitor{compLimit > 1 ? "s" : ""}. Upgrade to track more.
                  </p>
                </div>
                <UpgradeButton currentTier={tier} />
              </div>
            )}

            {showCompForm && (
              <BrandForm
                initial={editComp}
                existingNames={allBrandNames}
                onSave={handleCompSave}
                onCancel={() => { setShowCompForm(false); setEditComp(null); }}
                accentColor="orange"
                label="Competitor"
              />
            )}

            {competitors.length === 0 && !showCompForm ? (
              <EmptyState
                icon={<><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4-4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></>}
                title="No competitors tracked"
                description="Add competitor brands to compare their AI visibility with yours"
                buttonLabel="+ Add Your First Competitor"
                onClick={() => { setEditComp(null); setShowCompForm(true); }}
                accent="orange"
              />
            ) : (
              <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {competitors.map((profile) => (
                  <BrandCard
                    key={profile.name}
                    profile={profile}
                    deleteConfirm={deleteConfirm}
                    onEdit={() => { setEditComp(profile); setShowCompForm(true); }}
                    onDelete={() => setDeleteConfirm(profile.name)}
                    onDeleteConfirm={() => handleCompRemove(profile.name)}
                    onDeleteCancel={() => setDeleteConfirm(null)}
                    accent="orange"
                    showDashboard={false}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TierBadge({ tier, compCount, limit }: { tier: SubscriptionTier; compCount: number; limit: number }) {
  const tierColors: Record<SubscriptionTier, string> = {
    free: "border-gray-500/20 text-gray-400 bg-gray-500/5",
    tier1: "border-blue-500/20 text-blue-400 bg-blue-500/5",
    tier2: "border-violet-500/20 text-violet-400 bg-violet-500/5",
    tier3: "border-amber-500/20 text-amber-400 bg-amber-500/5",
  };

  return (
    <div className="flex items-center gap-3">
      <span className={`rounded-full border px-3 py-1 text-xs font-medium ${tierColors[tier]}`}>
        {TIER_LABELS[tier]}
      </span>
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-24 rounded-full bg-gray-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-orange-500 to-red-500 transition-all"
            style={{ width: `${(compCount / limit) * 100}%` }}
          />
        </div>
        <span className="text-xs font-mono text-gray-500">{compCount}/{limit}</span>
      </div>
    </div>
  );
}

function UpgradeButton({ currentTier }: { currentTier: SubscriptionTier }) {
  const nextTier: Record<SubscriptionTier, SubscriptionTier | null> = {
    free: "tier1",
    tier1: "tier2",
    tier2: "tier3",
    tier3: null,
  };
  const next = nextTier[currentTier];
  if (!next) return null;

  return (
    <button className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-medium text-orange-400 hover:bg-orange-500/20 transition-all">
      Upgrade to {TIER_LABELS[next]} ({TIER_LIMITS[next]} competitors)
    </button>
  );
}

function EmptyState({ icon, title, description, buttonLabel, onClick, accent = "cyan" }: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  accent?: "cyan" | "orange";
}) {
  const btnClass = accent === "cyan"
    ? "bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400"
    : "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400";

  return (
    <div className="mt-12 text-center">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl border border-white/5 bg-gray-900/50">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-10 w-10 text-gray-400">
          {icon}
        </svg>
      </div>
      <h3 className="mt-4 text-lg font-medium text-white">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{description}</p>
      <button onClick={onClick} className={`mt-6 rounded-lg px-6 py-3 text-sm font-medium text-white transition-all ${btnClass}`}>
        {buttonLabel}
      </button>
    </div>
  );
}

function BrandCard({ profile, deleteConfirm, onEdit, onDelete, onDeleteConfirm, onDeleteCancel, accent, showDashboard }: {
  profile: BrandProfile;
  deleteConfirm: string | null;
  onEdit: () => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
  accent: "cyan" | "orange";
  showDashboard: boolean;
}) {
  const data = generateData(profile.name);
  const foundCount = data.engines.filter((e) => e.status === "mentioned").length;
  const highAlerts = data.alerts.filter((a) => a.severity === "high").length;

  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState("");
  const [engStatus, setEngStatus] = useState<Record<string, ScanStepStatus>>({});
  const [judgeStatus, setJudgeStatus] = useState<ScanStepStatus>("queued");

  function onScanEvent(ev: ScanProgressEvent) {
    if (ev.type === "engine_start") setEngStatus((s) => ({ ...s, [ev.name]: "running" }));
    else if (ev.type === "engine_done") setEngStatus((s) => ({ ...s, [ev.name]: "done" }));
    else if (ev.type === "judge_start") setJudgeStatus("running");
  }

  async function handleQuickScan() {
    setScanning(true);
    setScanMsg("");
    setEngStatus(Object.fromEntries(SCAN_ENGINES.map((e) => [e, "queued" as ScanStepStatus])));
    setJudgeStatus("queued");
    const r = await streamScan(profile.name, onScanEvent);
    if (r.status === "ok") {
      setJudgeStatus("done");
      // Scan stored — open the dashboard to view it.
      window.location.href = `/dashboard?brand=${encodeURIComponent(profile.name)}`;
      return;
    }
    if (r.status === "cooldown") {
      const mins = Math.ceil(r.retryAfterMs / 60000);
      setScanMsg(`Quick Scan runs once per hour — try again in ${mins > 1 ? `${mins} min` : "about a minute"}.`);
    } else if (r.status === "error") {
      setScanMsg("Scan failed. Please try again later.");
    }
    setScanning(false);
  }
  const hasLinks = profile.website || profile.twitter || profile.instagram || profile.linkedin || profile.blog;

  const borderHover = accent === "cyan" ? "hover:border-cyan-500/20" : "hover:border-orange-500/20";
  const scoreColor = accent === "cyan" ? "text-cyan-400" : "text-orange-400";
  const soaColor = accent === "cyan" ? "text-violet-400" : "text-red-400";
  const dashBorder = accent === "cyan" ? "border-cyan-500/20" : "border-orange-500/20";
  const dashBg = accent === "cyan"
    ? "from-cyan-500/10 to-violet-500/10 hover:from-cyan-500/20 hover:to-violet-500/20 text-cyan-400"
    : "from-orange-500/10 to-red-500/10 hover:from-orange-500/20 hover:to-red-500/20 text-orange-400";

  return (
    <>
      {scanning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" />
          <div className="relative max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl sm:p-8">
            <ScanProgress brand={profile.name} engineStatus={engStatus} judgeStatus={judgeStatus} />
          </div>
        </div>
      )}
    <div className={`group rounded-xl border border-white/5 bg-gray-900/50 ${borderHover} transition-all`}>
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-lg font-semibold text-white truncate">{profile.name}</h3>
            {profile.website && (
              <a href={profile.website.startsWith("http") ? profile.website : `https://${profile.website}`} target="_blank" rel="noopener noreferrer" className={`mt-0.5 block text-xs ${accent === "cyan" ? "text-cyan-400/70 hover:text-cyan-400" : "text-orange-400/70 hover:text-orange-400"} truncate transition-colors`}>
                {profile.website.replace(/^https?:\/\//, "")}
              </a>
            )}
          </div>
          <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={onEdit} className="rounded-md p-1.5 text-gray-400 hover:bg-white/5 hover:text-cyan-400 transition-colors" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>
            {deleteConfirm === profile.name ? (
              <div className="flex items-center gap-1">
                <button onClick={onDeleteConfirm} className="rounded-md bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20">Delete</button>
                <button onClick={onDeleteCancel} className="rounded-md bg-white/5 px-2 py-1 text-xs text-gray-400 hover:bg-white/10">Cancel</button>
              </div>
            ) : (
              <button onClick={onDelete} className="rounded-md p-1.5 text-gray-400 hover:bg-white/5 hover:text-red-400 transition-colors" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
                  <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {hasLinks && (
          <div className="mt-3 flex items-center gap-2">
            {profile.blog && (
              <SocialIcon href={profile.blog} title="Blog">
                <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
              </SocialIcon>
            )}
            {profile.twitter && (
              <SocialIcon href={profile.twitter} title="X / Twitter">
                <path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M15.232 10.232L20 4" />
              </SocialIcon>
            )}
            {profile.instagram && (
              <SocialIcon href={profile.instagram} title="Instagram">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" /><circle cx="17.5" cy="6.5" r="1.5" />
              </SocialIcon>
            )}
            {profile.linkedin && (
              <SocialIcon href={profile.linkedin} title="LinkedIn">
                <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z" />
              </SocialIcon>
            )}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-gray-950/50 p-3">
            <p className="text-xs text-gray-500">Brand Score</p>
            <p className={`mt-1 text-xl font-bold ${scoreColor}`}>{data.brandScore}<span className="text-xs text-gray-500">/100</span></p>
          </div>
          <div className="rounded-lg bg-gray-950/50 p-3">
            <p className="text-xs text-gray-500">Share of Answer</p>
            <p className={`mt-1 text-xl font-bold ${soaColor}`}>{data.soa}<span className="text-xs text-gray-500">%</span></p>
          </div>
          <div className="rounded-lg bg-gray-950/50 p-3">
            <p className="text-xs text-gray-500">AI Engines</p>
            <p className="mt-1 text-xl font-bold text-emerald-400">{foundCount}<span className="text-xs text-gray-500">/4</span></p>
          </div>
          <div className="rounded-lg bg-gray-950/50 p-3">
            <p className="text-xs text-gray-500">Alerts</p>
            <p className="mt-1 text-xl font-bold text-red-400">{highAlerts}<span className="text-xs text-gray-500"> high</span></p>
          </div>
        </div>
      </div>

      <div className="border-t border-white/5 px-6 py-3 space-y-2">
        {AI_ENABLED && showDashboard && (
          <>
            <button
              onClick={handleQuickScan}
              disabled={scanning}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-cyan-500/20 bg-cyan-500/5 py-2 text-sm font-medium text-cyan-400 hover:bg-cyan-500/10 transition-all disabled:opacity-50"
            >
              {scanning ? "Scanning across AI engines…" : "⚡ Quick Scan"}
            </button>
            {scanMsg && <p className="text-center text-xs text-amber-400">{scanMsg}</p>}
          </>
        )}
        <div className="flex gap-2">
        {showDashboard ? (
          <>
            <a
              href={`/dashboard?brand=${encodeURIComponent(profile.name)}`}
              className={`flex-1 rounded-lg bg-gradient-to-r ${dashBg} border ${dashBorder} py-2 text-center text-sm font-medium transition-all`}
            >
              View Dashboard
            </a>
            <a
              href={`/compare?a=${encodeURIComponent(profile.name)}`}
              className="rounded-lg border border-white/10 px-3 py-2 text-sm text-gray-500 hover:bg-white/5 hover:text-white transition-all"
            >
              Compare
            </a>
          </>
        ) : (
          <a
            href={`/compare?b=${encodeURIComponent(profile.name)}`}
            className={`flex-1 rounded-lg bg-gradient-to-r ${dashBg} border ${dashBorder} py-2 text-center text-sm font-medium transition-all`}
          >
            Compare with My Brand
          </a>
        )}
        </div>
      </div>
    </div>
    </>
  );
}

function SocialIcon({ href, title, children }: { href: string; title: string; children: React.ReactNode }) {
  const url = href.startsWith("http") ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-white/5 bg-gray-950/50 text-gray-500 hover:border-cyan-500/20 hover:text-cyan-400 transition-all"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-3.5 w-3.5">
        {children}
      </svg>
    </a>
  );
}

// Turns a server error code (thrown by the store's api helper) into a message
// the user can act on, instead of silently doing nothing.
function saveErrorMessage(err: unknown, label: string): string {
  const m = err instanceof Error ? err.message : "";
  if (m.includes("unauthorized") || m === "401") {
    return "Your session expired. Please log out and log in again.";
  }
  if (m.includes("not_configured") || m === "501") {
    return "Saving is temporarily unavailable — the backend isn't configured yet.";
  }
  if (m.includes("competitor_limit_reached") || m === "403") {
    return "You've reached your competitor limit. Upgrade your plan to add more.";
  }
  if (m.includes("name_required")) {
    return `${label} name is required.`;
  }
  // Unknown error — show the underlying detail so the cause is visible instead
  // of hidden behind a generic message.
  const detail = m ? ` (${m})` : "";
  return `Couldn't save this ${label.toLowerCase()}${detail}. Please try again.`;
}

function BrandForm({ initial, existingNames, onSave, onCancel, accentColor = "cyan", label = "Brand" }: {
  initial: BrandProfile | null;
  existingNames: string[];
  onSave: (profile: BrandProfile) => void | Promise<void>;
  onCancel: () => void;
  accentColor?: "cyan" | "orange";
  label?: string;
}) {
  const isEdit = !!initial;
  const [form, setForm] = useState<BrandProfile>(
    initial || {
      name: "",
      website: "",
      blog: "",
      twitter: "",
      instagram: "",
      linkedin: "",
      createdAt: new Date().toISOString(),
    }
  );
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const borderColor = accentColor === "cyan" ? "border-cyan-500/20" : "border-orange-500/20";
  const btnGrad = accentColor === "cyan"
    ? "from-cyan-500 to-violet-500 hover:from-cyan-400 hover:to-violet-400"
    : "from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setError(`${label} name is required`);
      return;
    }
    if (!isEdit && existingNames.includes(name)) {
      setError("A brand with this name already exists");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSave({ ...form, name });
      // On success the parent closes (unmounts) this form.
    } catch (err) {
      setError(saveErrorMessage(err, label));
      setSubmitting(false);
    }
  }

  function update(field: keyof BrandProfile, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (error) setError("");
  }

  return (
    <div className={`mt-6 rounded-xl border ${borderColor} bg-gray-900/50 p-6`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-white">
          {isEdit ? `Edit ${initial.name}` : `Add New ${label}`}
        </h2>
        <button onClick={onCancel} className="rounded-md p-1.5 text-gray-500 hover:bg-white/5 hover:text-white transition-colors">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label={`${label} Name`}
            value={form.name}
            onChange={(v) => update("name", v)}
            placeholder={label === "Competitor" ? "e.g. PancakeSwap" : "e.g. Uniswap"}
            required
            disabled={isEdit}
          />
          <FormField
            label="Website"
            value={form.website}
            onChange={(v) => update("website", v)}
            placeholder="e.g. uniswap.org"
            icon={<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zM2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10A15.3 15.3 0 0112 2z" />}
          />
        </div>

        <FormField
          label="Blog Link"
          value={form.blog}
          onChange={(v) => update("blog", v)}
          placeholder="e.g. blog.uniswap.org"
          icon={<><path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" /><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" /></>}
        />

        <div className="border-t border-white/5 pt-4">
          <p className="text-xs font-mono uppercase tracking-widest text-gray-500 mb-4">Social Profiles</p>
          <div className="grid gap-4 md:grid-cols-3">
            <FormField
              label="X (Twitter)"
              value={form.twitter}
              onChange={(v) => update("twitter", v)}
              placeholder="e.g. x.com/Uniswap"
              icon={<path d="M4 4l11.733 16h4.267l-11.733-16zM4 20l6.768-6.768M15.232 10.232L20 4" />}
            />
            <FormField
              label="Instagram"
              value={form.instagram}
              onChange={(v) => update("instagram", v)}
              placeholder="e.g. instagram.com/uniswap"
              icon={<><rect x="2" y="2" width="20" height="20" rx="5" ry="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r="1.5" /></>}
            />
            <FormField
              label="LinkedIn"
              value={form.linkedin}
              onChange={(v) => update("linkedin", v)}
              placeholder="e.g. linkedin.com/company/uniswap"
              icon={<path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 2a2 2 0 110 4 2 2 0 010-4z" />}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={onCancel} disabled={submitting} className="rounded-lg border border-white/10 px-5 py-2.5 text-sm font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all disabled:opacity-50">
            Cancel
          </button>
          <button type="submit" disabled={submitting} className={`rounded-lg bg-gradient-to-r ${btnGrad} px-6 py-2.5 text-sm font-medium text-white transition-all disabled:opacity-60`}>
            {submitting ? "Saving…" : isEdit ? "Save Changes" : `Add ${label}`}
          </button>
        </div>
      </form>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, required, disabled, icon }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  required?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4 text-gray-400">
              {icon}
            </svg>
          </div>
        )}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full rounded-lg border border-white/10 bg-gray-950/50 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-cyan-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${icon ? "pl-10 pr-4" : "px-4"}`}
        />
      </div>
    </div>
  );
}
