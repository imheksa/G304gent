import { getUserSolanaWallets } from "@/lib/server/auth";
import { getSupabase, backendConfigured } from "@/lib/server/db";

// Wallets that are granted full (tier3) access without paying — for demos and
// testing. Comma-separated override via FULL_ACCESS_WALLETS; a default is
// baked in so it works even if the env var isn't set.
const DEFAULT_FULL_ACCESS = "G6Jtps5Bi5vuizP6dccgBm6rb6RVQLYy6QdFAv6Kzh32";

const FULL_ACCESS_WALLETS = new Set(
  (process.env.FULL_ACCESS_WALLETS || DEFAULT_FULL_ACCESS)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

// True if the user owns an allowlisted wallet — full access, and also exempt
// from rate limits (for the demo/test account).
export async function hasFullAccess(userId: string): Promise<boolean> {
  if (FULL_ACCESS_WALLETS.size === 0) return false;
  try {
    const wallets = await getUserSolanaWallets(userId);
    return wallets.some((w) => FULL_ACCESS_WALLETS.has(w));
  } catch {
    return false;
  }
}

// The user's effective subscription tier: allowlisted wallets get "tier3";
// otherwise the stored subscription (or "free"). Used everywhere access is
// gated so a demo wallet unlocks the whole app consistently.
export async function getEffectiveTier(userId: string): Promise<string> {
  if (await hasFullAccess(userId)) return "tier3";
  if (!backendConfigured) return "free";
  const { data } = await getSupabase()
    .from("subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.tier ?? "free";
}
