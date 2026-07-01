import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { oauthConfigured, whoAmI } from "@/lib/server/wikidata";

export const runtime = "nodejs";

// Is OAuth configured, and is the current browser connected to a Wikimedia
// account? Returns the username when connected.
export async function GET() {
  const configured = oauthConfigured();
  const bearer = (await cookies()).get("wd_at")?.value;
  if (!bearer) return NextResponse.json({ configured, connected: false });
  const username = await whoAmI(bearer).catch(() => null);
  return NextResponse.json({ configured, connected: Boolean(username), username: username ?? undefined });
}

// Disconnect: clear the stored token.
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete("wd_at");
  return res;
}
