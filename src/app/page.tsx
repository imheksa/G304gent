"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { useI18n } from "@/i18n/context";
import AccountButton from "@/components/AccountButton";
import CheckoutModal from "@/components/CheckoutModal";
import PrimaryCTA from "@/components/PrimaryCTA";
import { PAYMENTS_ENABLED } from "@/lib/web3-config";
import { fetchBrandNames } from "@/lib/store";
import { ChipLogo } from "@/components/Logo";
import { EngineIcon } from "@/components/EngineIcon";

function HexIcon({ className = "w-5 h-5" }: { className?: string }) {
  return <ChipLogo className={className} />;
}

function Navbar() {
  const { t } = useI18n();
  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 items-center justify-between px-6 sm:px-10 lg:px-16 xl:px-24">
        <a href="#" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <HexIcon className="w-6 h-6 text-cyan-400" />
          <span>
            <span className="text-gradient">6304</span>
            <span className="text-white">&nbsp;Agent</span>
          </span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">
            {t.nav.features}
          </a>
          <a href="#pricing" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">
            {t.nav.pricing}
          </a>
          <a href="#contact" className="text-sm text-gray-400 hover:text-cyan-400 transition-colors">
            {t.nav.contact}
          </a>
          <AccountButton />
          <Link
            href="/dashboard"
            className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all"
          >
            Live Dashboard
          </Link>
        </div>
        <Link
          href="/dashboard"
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white md:hidden"
        >
          Live Dashboard
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  const { t } = useI18n();
  return (
    <section className="relative overflow-hidden bg-gray-950 pt-28 pb-20 lg:pt-36 lg:pb-28">
      <div className="absolute inset-0 bg-grid animate-grid-fade" />
      <div className="absolute top-20 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px]" />

      <div className="relative mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <div>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-1.5 text-sm font-mono text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse-glow" />
              {t.hero.tagline}
            </div>
            <h1 className="text-4xl font-bold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl xl:text-7xl">
              {t.hero.title}
              <span className="text-gradient">{t.hero.titleHighlight}</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-gray-400 leading-relaxed lg:text-xl">
              {t.hero.subtitle}
            </p>
            <div className="mt-8 flex flex-col gap-4 sm:flex-row">
              <PrimaryCTA
                href="/dashboard"
                authedHref="/#pricing"
                authedChildren={t.hero.ctaLoggedIn}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 transition-all"
              >
                {t.hero.cta}
              </PrimaryCTA>
              <a
                href="#solution"
                className="rounded-lg border border-white/10 bg-white/5 px-8 py-4 text-base font-semibold text-gray-300 hover:bg-white/10 hover:text-white transition-all"
              >
                {t.hero.ctaSecondary}
              </a>
            </div>
            <div className="mt-10 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-mono text-gray-500 uppercase tracking-wider text-xs">Monitors:</span>
              {["ChatGPT", "Gemini", "Claude", "Grok", "Deepseek", "Google AI"].map((e) => (
                <span
                  key={e}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-xs text-gray-400"
                >
                  {e}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Visual */}
          <div className="relative hidden lg:flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-violet-500/10 rounded-3xl blur-3xl" />
            <div className="relative w-full max-w-lg">
              {/* Animated dashboard mockup */}
              <div className="rounded-2xl border border-white/10 bg-gray-900/80 p-6 backdrop-blur-xl shadow-2xl">
                <div className="flex items-center gap-2 mb-5">
                  <span className="h-3 w-3 rounded-full bg-red-500/60" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/60" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/60" />
                  <span className="ml-3 text-xs font-mono text-gray-500">AI Visibility Dashboard</span>
                </div>
                {/* Score cards */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="rounded-xl border border-white/5 bg-gray-950/60 p-4 animate-float" style={{ animationDelay: "0s" }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Brand Score</p>
                    <p className="mt-1 text-2xl font-bold text-cyan-400">78<span className="text-xs text-gray-500">/100</span></p>
                    <span className="text-[10px] font-mono text-emerald-400">+5 this week</span>
                  </div>
                  <div className="rounded-xl border border-white/5 bg-gray-950/60 p-4 animate-float" style={{ animationDelay: "1s" }}>
                    <p className="text-[10px] font-mono uppercase tracking-widest text-gray-500">Share of Answer</p>
                    <p className="mt-1 text-2xl font-bold text-violet-400">42<span className="text-xs text-gray-500">%</span></p>
                    <span className="text-[10px] font-mono text-emerald-400">+8 this week</span>
                  </div>
                </div>
                {/* Engine status */}
                <div className="space-y-2">
                  {[
                    { name: "ChatGPT", status: true, icon: "G" },
                    { name: "Gemini", status: true, icon: "Gm" },
                    { name: "Claude", status: true, icon: "C" },
                    { name: "Grok", status: true, icon: "Gr" },
                    { name: "Deepseek", status: true, icon: "D" },
                    { name: "Google AI", status: false, icon: "GA" },
                  ].map((engine) => (
                    <div key={engine.name} className="flex items-center justify-between rounded-lg border border-white/5 bg-gray-950/40 px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/5 text-gray-300"><EngineIcon name={engine.name} className="h-3.5 w-3.5" /></span>
                        <span className="text-xs text-white">{engine.name}</span>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-mono ${
                        engine.status ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {engine.status ? "Found" : "Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Floating alert card */}
              <div className="absolute -bottom-4 -left-8 rounded-xl border border-red-500/20 bg-gray-900/90 p-3 shadow-xl backdrop-blur-sm animate-float" style={{ animationDelay: "2s" }}>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                  <span className="text-[10px] font-mono text-red-400">Alert: Incorrect trading fee on ChatGPT</span>
                </div>
              </div>
              {/* Floating accuracy card */}
              <div className="absolute -top-4 -right-6 rounded-xl border border-emerald-500/20 bg-gray-900/90 p-3 shadow-xl backdrop-blur-sm animate-float" style={{ animationDelay: "3s" }}>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400 text-sm">✓</span>
                  <span className="text-[10px] font-mono text-emerald-400">Accuracy: 92%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Problem() {
  const { t } = useI18n();
  const cards = [
    { icon: <EyeOffIcon />, title: t.problem.card1Title, desc: t.problem.card1Desc },
    { icon: <AlertIcon />, title: t.problem.card2Title, desc: t.problem.card2Desc },
    { icon: <ChartIcon />, title: t.problem.card3Title, desc: t.problem.card3Desc },
  ];
  return (
    <section className="relative bg-gray-950 py-24 border-t border-white/5">
      <div className="absolute inset-0 bg-dot-pattern opacity-30" />
      <div className="relative mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-red-400">
            {t.problem.label}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t.problem.title}
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {cards.map((c) => (
            <div
              key={c.title}
              className="card-glow rounded-xl border border-white/5 bg-gray-900/50 p-8 backdrop-blur-sm hover:border-white/10 transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-400">
                {c.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-gray-400 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Solution() {
  const { t } = useI18n();
  const steps = [
    { num: "01", label: t.solution.step1Label, title: t.solution.step1Title, desc: t.solution.step1Desc, color: "cyan" },
    { num: "02", label: t.solution.step2Label, title: t.solution.step2Title, desc: t.solution.step2Desc, color: "violet" },
    { num: "03", label: t.solution.step3Label, title: t.solution.step3Title, desc: t.solution.step3Desc, color: "emerald" },
    { num: "04", label: t.solution.step4Label, title: t.solution.step4Title, desc: t.solution.step4Desc, color: "amber" },
  ];
  const colorMap: Record<string, string> = {
    cyan: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
    violet: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  };
  return (
    <section id="solution" className="relative bg-gray-950 py-24 border-t border-white/5">
      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-cyan-400">
            {t.solution.label}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t.solution.title}
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => {
            const colors = colorMap[s.color];
            return (
              <div key={s.num} className="card-glow rounded-xl border border-white/5 bg-gray-900/50 p-8 backdrop-blur-sm hover:border-white/10 transition-all">
                <div className="font-mono text-4xl font-bold text-white/5">{s.num}</div>
                <span className={`mt-2 inline-block rounded-full border px-3 py-1 font-mono text-xs font-semibold uppercase ${colors}`}>
                  {s.label}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Integrations() {
  return (
    <section className="relative overflow-hidden bg-gray-950 py-24 border-t border-white/5">
      <div className="absolute inset-0 bg-grid opacity-40" />
      <div className="absolute top-1/2 left-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-500/5 blur-[140px]" />
      <div className="relative mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="font-mono text-sm uppercase tracking-[3px] text-cyan-400">One integration</div>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              One agent.<br /><span className="text-gradient">Every AI engine.</span>
            </h2>
            <p className="mt-5 max-w-md text-lg leading-relaxed text-gray-400">
              6304 Agent connects to the six engines people actually ask — ChatGPT, Gemini, Claude,
              Grok, Deepseek and Google AI — and measures how each one represents your brand, side by side.
            </p>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {["ChatGPT", "Gemini", "Claude", "Grok", "Deepseek", "Google AI"].map((e) => (
                <span key={e} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 font-mono text-xs text-gray-300">
                  <EngineIcon name={e} className="h-3.5 w-3.5" /> {e}
                </span>
              ))}
            </div>
          </div>
          <div className="relative flex justify-center">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-cyan-500/10 to-violet-500/10 blur-3xl" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/6304-engines.png"
              alt="6304 Agent connected to ChatGPT, Gemini, Claude, Grok, Deepseek and Google AI"
              className="relative w-full max-w-md drop-shadow-2xl"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metrics() {
  const { t } = useI18n();
  const items = [
    { label: t.metrics.soa, desc: t.metrics.soaDesc, value: "SoA", color: "text-cyan-400" },
    { label: t.metrics.accuracy, desc: t.metrics.accuracyDesc, value: "%", color: "text-violet-400" },
    { label: t.metrics.citation, desc: t.metrics.citationDesc, value: "#", color: "text-emerald-400" },
  ];
  return (
    <section className="relative border-y border-white/5 bg-gray-900/50 py-20">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="relative mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
        <h2 className="text-center text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
          {t.metrics.title}
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {items.map((m) => (
            <div key={m.label} className="text-center">
              <div className={`font-mono text-5xl font-bold ${m.color}`}>{m.value}</div>
              <h3 className="mt-3 text-lg font-semibold text-white">{m.label}</h3>
              <p className="mt-1 text-gray-500">{m.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const { t } = useI18n();
  const items = [
    { icon: <RadarIcon />, title: t.features.f1Title, desc: t.features.f1Desc },
    { icon: <ShieldIcon />, title: t.features.f2Title, desc: t.features.f2Desc },
    { icon: <GlobeIcon />, title: t.features.f3Title, desc: t.features.f3Desc },
    { icon: <SearchIcon />, title: t.features.f4Title, desc: t.features.f4Desc },
    { icon: <RocketIcon />, title: t.features.f5Title, desc: t.features.f5Desc },
    { icon: <ChartIcon />, title: t.features.f6Title, desc: t.features.f6Desc },
  ];
  return (
    <section id="features" className="relative bg-gray-950 py-24 border-t border-white/5">
      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-cyan-400">
            {t.features.label}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t.features.title}
          </h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <div
              key={f.title}
              className="card-glow group rounded-xl border border-white/5 bg-gray-900/50 p-8 backdrop-blur-sm hover:border-cyan-500/20 transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
                {f.icon}
              </div>
              <h3 className="mt-5 text-lg font-semibold text-white">{f.title}</h3>
              <p className="mt-2 text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const { t } = useI18n();
  const { ready, authenticated } = usePrivy();
  const isAuthed = ready && authenticated;
  const [checkout, setCheckout] = useState<{ plan: string; amountUsd: number } | null>(null);
  const plans = [
    { ...t.pricing.audit, popular: false },
    { ...t.pricing.foundations, popular: false },
    { ...t.pricing.growth, popular: true },
    { ...t.pricing.enterprise, popular: false },
  ];
  return (
    <section id="pricing" className="relative bg-gray-950 py-24 border-t border-white/5">
      <div className="absolute inset-0 bg-dot-pattern opacity-20" />
      <div className="relative mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-cyan-400">
            {t.pricing.label}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t.pricing.title}
          </h2>
          <p className="mt-3 text-gray-400">{t.pricing.subtitle}</p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan, idx) => (
            <div
              key={plan.name}
              className={`group relative flex flex-col rounded-xl p-8 backdrop-blur-sm transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl animate-fade-in-up ${
                plan.popular
                  ? "border border-cyan-500/30 bg-gradient-to-b from-cyan-500/10 to-violet-500/10 shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/20"
                  : "border border-white/5 bg-gray-900/50 hover:border-white/10 hover:shadow-white/5"
              }`}
              style={{ animationDelay: `${idx * 150}ms` }}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-1 text-xs font-semibold text-white animate-pulse-glow">
                  Popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-white">{plan.name}</h3>
              <p className="mt-1 text-sm text-gray-500">{plan.desc}</p>
              <div className="mt-6">
                <span className="text-3xl font-bold text-white transition-colors group-hover:text-cyan-400">{plan.price}</span>
                {"period" in plan && (
                  <span className="text-sm text-gray-500">{plan.period}</span>
                )}
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-400">
                    <span className="mt-0.5 text-cyan-400 transition-transform group-hover:scale-110">&#10003;</span>
                    {f}
                  </li>
                ))}
              </ul>
              {(() => {
                const m = /^\$(\d+)/.exec(plan.price);
                const priceUsd = m ? parseInt(m[1], 10) : 0;
                const ctaClass = `mt-8 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-all duration-300 hover:scale-105 ${
                  plan.popular
                    ? "bg-gradient-to-r from-cyan-500 to-violet-500 text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:from-cyan-400 hover:to-violet-400"
                    : "border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/20"
                }`;
                // Paid plans (Starter / Pro): open crypto checkout.
                if (PAYMENTS_ENABLED && priceUsd > 0) {
                  return (
                    <button
                      onClick={() => setCheckout({ plan: plan.name, amountUsd: priceUsd })}
                      className={ctaClass}
                    >
                      {isAuthed ? `Upgrade to ${plan.name}` : plan.cta}
                    </button>
                  );
                }
                // Enterprise / custom: contact.
                if (priceUsd === 0 && !plan.price.trim().startsWith("$")) {
                  return (
                    <a href="#contact" className={ctaClass}>
                      {plan.cta}
                    </a>
                  );
                }
                // Free plan.
                return (
                  <PrimaryCTA
                    href="/brands"
                    authedHref="/dashboard"
                    authedChildren="Go to Dashboard"
                    className={ctaClass}
                  >
                    {plan.cta}
                  </PrimaryCTA>
                );
              })()}
            </div>
          ))}
        </div>
      </div>
      {checkout && (
        <CheckoutModal
          plan={checkout.plan}
          amountUsd={checkout.amountUsd}
          onClose={() => setCheckout(null)}
        />
      )}
    </section>
  );
}

function Industries() {
  const { t } = useI18n();
  const items = [
    { icon: <ExchangeIcon />, name: t.industries.cex },
    { icon: <SwapIcon />, name: t.industries.dex },
    { icon: <RwaIcon />, name: t.industries.rwa },
    { icon: <PaymentIcon />, name: t.industries.payment },
    { icon: <StablecoinIcon />, name: t.industries.stablecoin },
    { icon: <GameFiIcon />, name: t.industries.gamefi },
  ];
  return (
    <section className="relative bg-gray-950 py-24 border-t border-white/5">
      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-cyan-400">
            {t.industries.label}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t.industries.title}
          </h2>
        </div>
        <div className="mt-14 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {items.map((i) => (
            <div
              key={i.name}
              className="flex flex-col items-center gap-3 rounded-xl border border-white/5 bg-gray-900/50 p-6 text-center hover:border-cyan-500/20 transition-all"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
                {i.icon}
              </div>
              <span className="text-sm font-medium text-gray-300">{i.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  const { t } = useI18n();
  const { ready, authenticated } = usePrivy();
  const isAuthed = ready && authenticated;
  return (
    <section id="contact" className="relative overflow-hidden border-t border-white/5 bg-gray-950 py-24">
      <div className="absolute inset-0 bg-grid" />
      <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[200px]" />
      <div className="absolute bottom-0 right-1/3 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[200px]" />
      <div className="relative mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl font-bold text-white sm:text-4xl lg:text-5xl">{isAuthed ? t.cta.titleLoggedIn : t.cta.title}</h2>
        <p className="mt-4 text-lg text-gray-400 leading-relaxed">{isAuthed ? t.cta.subtitleLoggedIn : t.cta.subtitle}</p>
        <PrimaryCTA
          href="/dashboard"
          authedHref="/#pricing"
          authedChildren={t.cta.buttonLoggedIn}
          className="mt-10 inline-block rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:from-cyan-400 hover:to-violet-400 transition-all"
        >
          {t.cta.button}
        </PrimaryCTA>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-white/5 bg-gray-950 py-12">
      <div className="mx-auto px-6 sm:px-10 lg:px-16 xl:px-24">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <span className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <HexIcon className="w-5 h-5 text-cyan-400" />
              <span className="text-gradient">6304</span>
              <span className="text-white">&nbsp;Agent</span>
            </span>
            <p className="mt-2 text-sm text-gray-500">{t.footer.tagline}</p>
            <a
              href="https://x.com/Agent6304"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="6304 Agent on X"
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-400 hover:border-cyan-500/30 hover:text-cyan-400 transition-all"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              @Agent6304
            </a>
          </div>
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">{t.footer.product}</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li><a href="#features" className="hover:text-cyan-400 transition-colors">{t.footer.monitoring}</a></li>
              <li><a href="#features" className="hover:text-cyan-400 transition-colors">{t.footer.distribution}</a></li>
              <li><a href="#pricing" className="hover:text-cyan-400 transition-colors">{t.footer.audit}</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-widest text-gray-400">{t.footer.company}</h4>
            <ul className="mt-3 space-y-2 text-sm text-gray-500">
              <li><a href="#" className="hover:text-cyan-400 transition-colors">{t.footer.about}</a></li>
              <li><a href="#contact" className="hover:text-cyan-400 transition-colors">{t.footer.contact}</a></li>
              <li><a href="#" className="hover:text-cyan-400 transition-colors">{t.footer.privacy}</a></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/5 pt-6 text-center font-mono text-xs text-gray-400">
          &copy; {new Date().getFullYear()} 6304 Agent. {t.footer.rights}
        </div>
      </div>
    </footer>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
    </svg>
  );
}

function RadarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 00-2.91-.09z" />
      <path d="M12 15l-3-3a22 22 0 012-3.95A12.88 12.88 0 0122 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 01-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

function ExchangeIcon() {
  // Centralized Exchanges — candlestick trading
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M7 3v3M7 16v5" />
      <rect x="4.5" y="6" width="5" height="10" rx="1.2" />
      <path d="M17 3v5M17 18v3" />
      <rect x="14.5" y="8" width="5" height="10" rx="1.2" />
    </svg>
  );
}

function SwapIcon() {
  // Decentralized Exchanges — token swap
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M17 4l3 3-3 3" />
      <path d="M20 7H8" />
      <path d="M7 20l-3-3 3-3" />
      <path d="M4 17h12" />
    </svg>
  );
}

function RwaIcon() {
  // Real World Assets — tokenized property
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M3 21h18" />
      <path d="M5 21V8l7-4 7 4v13" />
      <path d="M10 21v-5h4v5" />
      <path d="M9 11h.01M15 11h.01" />
    </svg>
  );
}

function PaymentIcon() {
  // Payment — card rails
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="2" y="5" width="20" height="14" rx="2.5" />
      <path d="M2 10h20" />
      <path d="M6 15h4" />
    </svg>
  );
}

function StablecoinIcon() {
  // Stablecoin — pegged dollar coin
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M14.6 9.2c-.6-.8-1.6-1.2-2.6-1.2-1.5 0-2.7.9-2.7 2.1 0 1.3 1.2 1.7 2.7 2 1.5.3 2.7.7 2.7 2 0 1.2-1.2 2.1-2.7 2.1-1 0-2-.4-2.6-1.2" />
    </svg>
  );
}

function GameFiIcon() {
  // GameFi — gamepad
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M6 11h4M8 9v4" />
      <path d="M15 11h.01M18 13h.01" />
      <rect x="2" y="6" width="20" height="12" rx="6" />
    </svg>
  );
}

function QuickScan() {
  const { t } = useI18n();
  const [brand, setBrand] = useState("");
  const [phase, setPhase] = useState<"idle" | "scanning">("idle");
  const [scanProgress, setScanProgress] = useState(0);

  function startScan() {
    if (!brand.trim()) return;
    setPhase("scanning");
    setScanProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 15 + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setScanProgress(100);
        setTimeout(() => {
          window.location.href = `/dashboard?brand=${encodeURIComponent(brand.trim())}`;
        }, 400);
      } else {
        setScanProgress(Math.round(progress));
      }
    }, 300);
  }

  return (
    <section className="relative bg-gray-950 py-24 border-t border-white/5">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-[150px]" />
      <div className="relative mx-auto max-w-5xl px-6">
        <div className="text-center">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-cyan-400">
            {t.quickScan.label}
          </span>
          <h2 className="mt-3 text-3xl font-bold text-white sm:text-4xl lg:text-5xl">
            {t.quickScan.title}
          </h2>
          <p className="mt-3 text-gray-400">
            {t.quickScan.subtitle}
          </p>
        </div>

        <div className="mt-10 mx-auto max-w-2xl">
          {phase === "idle" && (
            <div className="flex gap-3">
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && startScan()}
                placeholder={t.quickScan.placeholder}
                className="flex-1 rounded-lg border border-white/10 bg-gray-900/80 px-5 py-3.5 text-white placeholder:text-gray-500 focus:border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-500/30 transition-all"
              />
              <button
                onClick={startScan}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-6 py-3.5 text-sm font-semibold text-white hover:from-cyan-400 hover:to-violet-400 transition-all whitespace-nowrap"
              >
                {t.quickScan.button}
              </button>
            </div>
          )}

          {phase === "scanning" && (
            <div className="rounded-xl border border-white/5 bg-gray-900/50 p-8 text-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-4 py-2 text-sm font-mono text-cyan-400">
                <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                {t.quickScan.scanning} &ldquo;{brand}&rdquo; {t.quickScan.scanSuffix}
              </div>
              <div className="mt-6 mx-auto max-w-sm">
                <div className="flex justify-between mb-2">
                  <span className="text-xs font-mono text-gray-500">{t.quickScan.progress}</span>
                  <span className="text-xs font-mono text-cyan-400">{scanProgress}%</span>
                </div>
                <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-cyan-500 to-violet-500 transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <div className="mt-4 space-y-1.5 text-left">
                  <ScanStep label={t.quickScan.step1} done={scanProgress > 15} />
                  <ScanStep label={t.quickScan.step2} done={scanProgress > 30} />
                  <ScanStep label={t.quickScan.step3} done={scanProgress > 45} />
                  <ScanStep label={t.quickScan.step4} done={scanProgress > 60} />
                  <ScanStep label={t.quickScan.step5} done={scanProgress > 75} />
                  <ScanStep label={t.quickScan.step6} done={scanProgress > 88} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

function ScanStep({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-2">
      {done ? (
        <span className="text-emerald-400 text-xs">✓</span>
      ) : (
        <span className="h-3 w-3 rounded-full border border-gray-600 animate-pulse" />
      )}
      <span className={`text-xs font-mono ${done ? "text-gray-400" : "text-gray-400"}`}>{label}</span>
    </div>
  );
}

export default function Home() {
  const { ready, authenticated } = usePrivy();
  const [redirecting, setRedirecting] = useState(false);

  // Signed-in users shouldn't see the marketing page — send them into the app.
  // Skip when there's a hash (e.g. #pricing) so the upgrade flow still works.
  useEffect(() => {
    if (!ready || !authenticated) return;
    if (typeof window !== "undefined" && window.location.hash) return;
    setRedirecting(true);
    fetchBrandNames()
      .then((names) => {
        window.location.href = names.length > 0 ? "/dashboard" : "/brands";
      })
      .catch(() => {
        // If the lookup fails, don't strand the user on an endless spinner —
        // fall back to showing the marketing page.
        setRedirecting(false);
      });
  }, [ready, authenticated]);

  if (redirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Hero />
      <QuickScan />
      <Problem />
      <Solution />
      <Integrations />
      <Metrics />
      <Features />
      <Pricing />
      <Industries />
      <CTA />
      <Footer />
    </>
  );
}
