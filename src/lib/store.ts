"use client";

import { getAccessToken } from "@privy-io/react-auth";
import {
  getBrandProfiles,
  saveBrandProfile,
  removeBrand,
  getCompetitorProfiles,
  saveCompetitorProfile,
  removeCompetitor,
  getUserTier,
  setUserTier,
  TIER_LABELS,
  generateData,
  type BrandProfile,
  type BrandData,
  type SubscriptionTier,
} from "./brand-data";

// When the backend (Vercel + Supabase) is configured, data lives in the
// database. Otherwise everything falls back to localStorage so the app keeps
// working unchanged.
const BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === "1";

// When the AI backend is enabled, the dashboard pulls real AI-visibility scans
// from /api/scan instead of the deterministic generator.
export const AI_ENABLED = process.env.NEXT_PUBLIC_AI_ENABLED === "1";

async function api(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token ?? ""}`,
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    // Surface the server's error code (e.g. "unauthorized", "not_configured")
    // so callers can show a meaningful message instead of failing silently.
    let detail = String(res.status);
    try {
      const body = await res.json();
      if (body?.error) detail = body.error;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(detail);
  }
  return res.json();
}

export async function fetchBrands(): Promise<BrandProfile[]> {
  if (!BACKEND) return getBrandProfiles();
  return (await api("/api/brands?type=brand")).brands;
}

export async function fetchCompetitors(): Promise<BrandProfile[]> {
  if (!BACKEND) return getCompetitorProfiles();
  return (await api("/api/brands?type=competitor")).brands;
}

export async function fetchBrandNames(): Promise<string[]> {
  return (await fetchBrands()).map((b) => b.name);
}

export async function fetchCompetitorNames(): Promise<string[]> {
  return (await fetchCompetitors()).map((b) => b.name);
}

export async function saveBrand(profile: BrandProfile, isCompetitor = false): Promise<void> {
  if (!BACKEND) {
    if (isCompetitor) saveCompetitorProfile(profile);
    else saveBrandProfile(profile);
    return;
  }
  await api("/api/brands", { method: "POST", body: JSON.stringify({ profile, isCompetitor }) });
}

export async function deleteBrand(name: string, isCompetitor = false): Promise<void> {
  if (!BACKEND) {
    if (isCompetitor) removeCompetitor(name);
    else removeBrand(name);
    return;
  }
  await api("/api/brands", { method: "DELETE", body: JSON.stringify({ name, isCompetitor }) });
}

export async function fetchTier(): Promise<SubscriptionTier> {
  if (!BACKEND) return getUserTier();
  try {
    return ((await api("/api/subscription")).tier ?? "free") as SubscriptionTier;
  } catch {
    return "free";
  }
}

// Records a successful payment and returns the activated tier.
export async function activateTierByPayment(
  plan: string,
  asset: string,
  signature: string
): Promise<SubscriptionTier> {
  if (!BACKEND) {
    const entry = (Object.entries(TIER_LABELS) as [SubscriptionTier, string][]).find(
      ([, label]) => label === plan
    );
    if (entry) setUserTier(entry[0]);
    return getUserTier();
  }
  const { tier } = await api("/api/verify-payment", {
    method: "POST",
    body: JSON.stringify({ plan, asset, signature }),
  });
  return tier as SubscriptionTier;
}

// Latest stored AI scan for a brand, or null if none has been run yet.
export async function fetchScan(brand: string): Promise<BrandData | null> {
  if (!AI_ENABLED) return generateData(brand);
  const { data } = await api(`/api/scan?brand=${encodeURIComponent(brand)}`);
  return (data as BrandData | null) ?? null;
}

// Runs a fresh AI scan for the brand and returns the assembled dashboard data.
export async function requestScan(brand: string): Promise<BrandData> {
  if (!AI_ENABLED) return generateData(brand);
  const { data } = await api("/api/scan", {
    method: "POST",
    body: JSON.stringify({ brand }),
  });
  return data as BrandData;
}

export type QuickScanResult =
  | { status: "ok"; data: BrandData }
  | { status: "cooldown"; data: BrandData | null; retryAfterMs: number }
  | { status: "disabled" }
  | { status: "error"; message: string };

// Like requestScan but never throws — surfaces the once-per-hour cooldown (429)
// as a result instead of an error, so the UI can show a friendly message.
export async function quickScan(brand: string): Promise<QuickScanResult> {
  if (!AI_ENABLED) return { status: "disabled" };
  const token = await getAccessToken();
  const res = await fetch("/api/scan", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token ?? ""}` },
    body: JSON.stringify({ brand }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.status === 429) {
    return { status: "cooldown", data: (body.data as BrandData) ?? null, retryAfterMs: Number(body.retryAfterMs) || 0 };
  }
  if (!res.ok) return { status: "error", message: String(body.error || res.status) };
  return { status: "ok", data: body.data as BrandData };
}
