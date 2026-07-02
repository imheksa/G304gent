"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { fetchBrands, fetchScan, wikidataSubmit, wikidataStatus, wikidataDisconnect, type WikidataResult, type WikidataStatus } from "@/lib/store";
import { getUserFacts, type BrandProfile } from "@/lib/brand-data";
import AuthGate from "@/components/AuthGate";
import AccountButton from "@/components/AccountButton";
import { ChipLogo } from "@/components/Logo";
import { useAccess, goToPricing } from "@/lib/use-access";

export default function DistributePage() {
  return (
    <AuthGate>
      <Suspense fallback={<div className="min-h-screen bg-gray-950" />}>
        <DistributeInner />
      </Suspense>
    </AuthGate>
  );
}

function DistributeInner() {
  const params = useSearchParams();
  const brandParam = params.get("brand") || "";
  const [brands, setBrands] = useState<BrandProfile[]>([]);
  const [selected, setSelected] = useState<string>(brandParam);
  const [facts, setFacts] = useState<string[]>([]);
  const { canAccess } = useAccess();
  const locked = !canAccess("subscribed");

  useEffect(() => {
    fetchBrands()
      .then((bs) => {
        setBrands(bs);
        // Preselect the brand from ?brand= when present, else the first one.
        const wanted = bs.find((b) => b.name === brandParam)?.name;
        if (wanted) setSelected(wanted);
        else if (bs.length > 0) setSelected((s) => s || bs[0].name);
      })
      .catch(() => setBrands([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandParam]);

  useEffect(() => {
    if (!selected) { setFacts([]); return; }
    let cancelled = false;
    (async () => {
      const userFacts = getUserFacts(selected).map((f) => f.fact).filter(Boolean);
      let scanFacts: string[] = [];
      try {
        const scan = await fetchScan(selected);
        scanFacts = (scan?.canonicalFacts ?? []).filter((f) => f.status === "accurate").map((f) => f.fact).filter(Boolean);
      } catch { /* no scan yet */ }
      if (!cancelled) setFacts(Array.from(new Set([...userFacts, ...scanFacts])));
    })();
    return () => { cancelled = true; };
  }, [selected]);

  const profile = brands.find((b) => b.name === selected);

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
            <Link href="/compare" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Compare</Link>
            <Link href="/distribute" className="text-sm text-cyan-400 font-medium">Distribute</Link>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">Dashboard</Link>
            <AccountButton />
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-4xl px-6 sm:px-10 lg:px-16 xl:px-24 py-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-white lg:text-4xl">Distribute</h1>
          <span className="rounded-full bg-cyan-500/10 px-2.5 py-0.5 font-mono text-xs text-cyan-300">BETA</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Publish your project&apos;s facts to Wikidata — the one high-authority source with an open write API. It feeds
          Google&apos;s Knowledge Graph and is weighted heavily by most AI models, so the correct answer propagates to the engines people ask.
        </p>

        {brands.length === 0 ? (
          <div className="mt-16 text-center">
            <h3 className="text-lg font-medium text-white">Add a brand first</h3>
            <p className="mt-2 text-sm text-gray-500">Go to My Brands to add your project and its official channels.</p>
            <Link href="/brands" className="mt-6 inline-block rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3 text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all">
              Go to My Brands
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-8 rounded-xl border border-cyan-500/20 bg-gray-900/50 p-5">
              <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">Brand</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {brands.map((b) => (
                  <button
                    key={b.name}
                    onClick={() => setSelected(b.name)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-all ${
                      selected === b.name
                        ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-300"
                        : "border-white/10 text-gray-400 hover:bg-cyan-500/10 hover:text-cyan-400 hover:border-cyan-500/20"
                    }`}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </div>

            {profile && (
              <div className="relative mt-6">
                <div className={locked ? "pointer-events-none select-none blur-md" : ""} aria-hidden={locked}>
                  <WikidataCard profile={profile} facts={facts} />
                </div>
                {locked && (
                  <div className="absolute inset-0 flex items-start justify-center pt-24">
                    <div className="flex flex-col items-center gap-3 rounded-2xl border border-violet-500/20 bg-gray-950/80 px-8 py-7 text-center shadow-2xl backdrop-blur-sm">
                      <p className="text-base font-semibold text-white">Unlock Distribute</p>
                      <p className="max-w-sm text-sm text-gray-400">One-click distribution to Wikidata is available on a paid plan.</p>
                      <button onClick={goToPricing} className="mt-1 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white hover:from-cyan-400 hover:to-violet-400 transition-all">
                        View Plans
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function WikidataCard({ profile, facts }: { profile: BrandProfile; facts: string[] }) {
  const params = useSearchParams();
  const [status, setStatus] = useState<WikidataStatus | null>(null);
  const [description, setDescription] = useState("");
  const [title, setTitle] = useState("");
  const [sources, setSources] = useState<string[]>(["", "", ""]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<WikidataResult | null>(null);
  const [error, setError] = useState("");

  const oauthMsg = params.get("wd");

  useEffect(() => { wikidataStatus().then(setStatus).catch(() => setStatus({ configured: false, connected: false })); }, []);

  useEffect(() => {
    setResult(null);
    setError("");
    setTitle(profile.name.slice(0, 120));
    setDescription(facts[0]?.slice(0, 240) ?? "");
    setSources(["", "", ""]);
  }, [profile.name, facts]);

  const setSource = (i: number, v: string) => setSources((s) => s.map((x, j) => (j === i ? v : x)));

  const disconnect = async () => { await wikidataDisconnect(); setStatus((s) => (s ? { ...s, connected: false, username: undefined } : s)); };

  const submit = async () => {
    setSubmitting(true);
    setError("");
    setResult(null);
    try {
      const r = await wikidataSubmit({
        name: title.trim() || profile.name,
        description,
        website: profile.website,
        twitter: profile.twitter,
        blog: profile.blog,
        instagram: profile.instagram,
        sources: sources.map((s) => s.trim()).filter(Boolean),
        mode: "create",
        username: username || undefined,
        password: password || undefined,
      });
      setResult(r);
    } catch (e) {
      setError(e instanceof Error ? e.message : "submit failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Client-side preview mirroring the server's property mapping.
  const willWrite: string[] = [`Label: ${title.trim() || profile.name}`, ...(description ? [`Description: ${description}`] : [])];
  if (profile.website) willWrite.push(`official website (P856): ${profile.website}`);
  if (profile.twitter) willWrite.push(`X/Twitter (P2002): ${profile.twitter.replace(/^@/, "")}`);
  if (profile.blog) willWrite.push(`official blog (P1581): ${profile.blog}`);
  if (profile.instagram) willWrite.push(`Instagram (P2003): ${profile.instagram.replace(/^@/, "")}`);
  const refCount = sources.filter((s) => s.trim()).length;

  const oauth = status?.configured;
  const connected = status?.connected;
  const canSubmit = willWrite.length > 1 && (connected || (!oauth && username && password));

  return (
    <div className="rounded-xl border border-violet-500/20 bg-gradient-to-b from-violet-500/[0.06] to-gray-900/50 p-6">
      <div className="flex items-center gap-2">
        <h3 className="text-base font-semibold text-white">Submit to Wikidata</h3>
        <span className="rounded-full bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] text-violet-300">DIRECT</span>
      </div>

      {oauthMsg === "connected" && <p className="mt-2 text-sm text-emerald-400">Wikimedia account connected ✓</p>}
      {oauthMsg === "error" && <p className="mt-2 text-sm text-red-400">Couldn&apos;t connect your Wikimedia account. Please try again.</p>}

      {/* Auth */}
      <div className="mt-4 rounded-lg border border-white/5 bg-gray-950/60 p-4">
        {status === null ? (
          <p className="text-sm text-gray-400">Checking connection…</p>
        ) : connected ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-300">Connected as <span className="font-semibold text-white">{status.username}</span></p>
            <button onClick={disconnect} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-gray-300 hover:bg-white/10 transition-colors">Disconnect</button>
          </div>
        ) : oauth ? (
          <div className="flex flex-col items-start gap-2">
            <p className="text-sm text-gray-300">Connect your Wikimedia account to submit — no password needed.</p>
            <a href="/api/distribute/wikidata/auth" className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-semibold text-white hover:from-cyan-400 hover:to-violet-400 transition-all">
              Connect Wikimedia account
            </a>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-sm text-gray-300">Sign in with a Wikidata bot password:</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Bot username (user@botname)" className="rounded-lg border border-white/10 bg-gray-950/70 px-3 py-2 text-sm text-white placeholder:text-gray-600" />
              <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Bot password" className="rounded-lg border border-white/10 bg-gray-950/70 px-3 py-2 text-sm text-white placeholder:text-gray-600" />
            </div>
            <p className="text-[11px] text-gray-500">
              Create one at{" "}
              <a href="https://www.wikidata.org/wiki/Special:BotPasswords" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">Special:BotPasswords</a>{" "}
              (grant &quot;create, edit, and move pages&quot;). Used once, never stored.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 space-y-4">
        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-xs text-gray-500">Title</label>
            <span className={`text-[11px] font-mono ${title.length > 120 ? "text-red-400" : "text-gray-600"}`}>{title.length} / 120</span>
          </div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Item title / label (e.g. 'Solana')" className="mt-1 w-full rounded-lg border border-white/10 bg-gray-950/70 px-3 py-2 text-sm text-white placeholder:text-gray-600" />
        </div>
        <div>
          <div className="flex items-baseline justify-between">
            <label className="text-xs text-gray-500">Description</label>
            <span className={`text-[11px] font-mono ${description.length > 250 ? "text-red-400" : "text-gray-600"}`}>{description.length} / 250</span>
          </div>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={250} rows={3} placeholder="Short description (e.g. 'decentralized exchange on Solana')" className="mt-1 w-full resize-y rounded-lg border border-white/10 bg-gray-950/70 px-3 py-2 text-sm text-white placeholder:text-gray-600" />
        </div>

        {/* Relevant sources (references) */}
        <div>
          <label className="text-xs text-gray-500">Relevant sources (up to 3 — attached as references to each statement)</label>
          <div className="mt-1 space-y-2">
            {sources.map((s, i) => (
              <input
                key={i}
                value={s}
                onChange={(e) => setSource(i, e.target.value)}
                placeholder={`Source URL ${i + 1} (e.g. docs, coingecko, official announcement)`}
                className="w-full rounded-lg border border-white/10 bg-gray-950/70 px-3 py-2 text-sm text-white placeholder:text-gray-600"
              />
            ))}
          </div>
          <p className="mt-1 text-[11px] text-gray-500">Official website, X, blog and Instagram are pulled from this brand&apos;s profile (My Brands).</p>
        </div>

        {/* preview */}
        <div className="rounded-lg border border-white/5 bg-gray-950/70 p-3">
          <p className="text-[11px] font-mono uppercase tracking-widest text-gray-500">Will write</p>
          <ul className="mt-1.5 space-y-0.5 text-xs text-gray-300">
            {willWrite.map((w) => <li key={w}>• {w}</li>)}
            {refCount > 0 && <li className="text-gray-500">• with {refCount} reference source{refCount > 1 ? "s" : ""} (P854) on each statement</li>}
          </ul>
          <p className="mt-2 text-[11px] text-gray-500">Creates a new Wikidata item. Edits are public under your account — only submit true facts, and note Wikidata&apos;s notability rules. Check it doesn&apos;t already exist at <a href="https://www.wikidata.org" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">wikidata.org</a>.</p>
        </div>

        {error && <p className="text-sm text-red-400">Error: {error}</p>}
        {result && (
          <p className="text-sm text-emerald-400">
            {result.created ? "Created" : result.added.length ? "Updated" : "Already up to date"} —{" "}
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="underline">{result.id}</a>
            {result.added.length ? ` (added: ${result.added.join(", ")})` : ""}
          </p>
        )}

        <button
          onClick={submit}
          disabled={submitting || !canSubmit}
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white hover:from-cyan-400 hover:to-violet-400 transition-all disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit to Wikidata"}
        </button>
      </div>
    </div>
  );
}
