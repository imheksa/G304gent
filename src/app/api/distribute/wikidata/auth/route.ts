import { NextResponse } from "next/server";
import { authorizeUrl, oauthConfigured } from "@/lib/server/wikidata";

export const runtime = "nodejs";

function originOf(req: Request): string {
  const h = new Headers(req.headers);
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  return `${proto}://${host}`;
}

// Kicks off the Wikimedia OAuth 2.0 flow: sets a state cookie and redirects to
// the authorization page.
export async function GET(req: Request) {
  if (!oauthConfigured()) return NextResponse.json({ error: "oauth_not_configured" }, { status: 501 });
  const redirectUri = `${originOf(req)}/api/distribute/wikidata/callback`;
  const state = crypto.randomUUID();
  const res = NextResponse.redirect(authorizeUrl(redirectUri, state));
  res.cookies.set("wd_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return res;
}
