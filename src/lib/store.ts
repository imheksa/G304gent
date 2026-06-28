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
  type BrandProfile,
  type SubscriptionTier,
} from "./brand-data";

// When the backend (Vercel + Supabase) is configured, data lives in the
// database. Otherwise everything falls back to localStorage so the app keeps
// working unchanged.
const BACKEND = process.env.NEXT_PUBLIC_USE_BACKEND === "1";

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
  if (!res.ok) throw new Error(`${path} → ${res.status}`);
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
