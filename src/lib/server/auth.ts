import { PrivyClient } from "@privy-io/server-auth";
import { PRIVY_APP_ID } from "@/lib/web3-config";

// Must match the App ID the browser SDK uses to mint tokens, otherwise
// verifyAuthToken rejects on an audience mismatch. web3-config carries the
// hardcoded default, so the server verifies correctly even when
// NEXT_PUBLIC_PRIVY_APP_ID is left unset in the deployment environment.
const appId = PRIVY_APP_ID;
const appSecret = process.env.PRIVY_APP_SECRET || "";

let privy: PrivyClient | null = null;

function getPrivy(): PrivyClient {
  if (!appSecret) throw new Error("PRIVY_APP_SECRET is not set");
  if (!privy) privy = new PrivyClient(appId, appSecret);
  return privy;
}

// Verifies the Privy access token from the Authorization header and returns the
// Privy user id (DID), or null if missing/invalid.
export async function getUserId(req: Request): Promise<string | null> {
  const header = req.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  if (!token) return null;
  try {
    const claims = await getPrivy().verifyAuthToken(token);
    return claims.userId;
  } catch {
    return null;
  }
}

// Returns the Solana wallet addresses linked to a Privy user. Used to bind an
// on-chain payment to the authenticated user (the tx must be paid by one of
// their wallets). Throws if the Privy lookup fails so callers can distinguish a
// transient outage from a user that simply has no Solana wallet.
export async function getUserSolanaWallets(userId: string): Promise<string[]> {
  const user = await getPrivy().getUser(userId);
  const accounts = (user?.linkedAccounts ?? []) as unknown as Array<Record<string, unknown>>;
  return accounts
    .filter((a) => {
      const addr = a.address;
      if (typeof addr !== "string" || addr.startsWith("0x")) return false;
      // Privy tags Solana wallets with chainType "solana"; fall back to any
      // non-EVM wallet address for older account shapes.
      return a.chainType === "solana" || a.type === "wallet";
    })
    .map((a) => a.address as string);
}
