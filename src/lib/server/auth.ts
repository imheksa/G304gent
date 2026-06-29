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
