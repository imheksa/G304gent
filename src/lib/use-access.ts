"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { getUserTier } from "@/lib/brand-data";

// Access tiers:
//  - guest:      not logged in — limited preview only
//  - free:       logged in, no active subscription — more, but not everything
//  - subscribed: logged in with a paid plan — full access
export type AccessLevel = "guest" | "free" | "subscribed";

const RANK: Record<AccessLevel, number> = { guest: 0, free: 1, subscribed: 2 };

export function useAccess() {
  const { ready, authenticated, login, logout } = usePrivy();
  const [tier, setTier] = useState<string>("free");

  useEffect(() => {
    setTier(getUserTier());
  }, [authenticated]);

  const level: AccessLevel = !authenticated
    ? "guest"
    : tier !== "free"
    ? "subscribed"
    : "free";

  function canAccess(required: AccessLevel) {
    return RANK[level] >= RANK[required];
  }

  return { ready, authenticated, level, canAccess, login: () => login(), logout };
}

export function goToPricing() {
  window.location.href = "/G304gent/#pricing";
}
