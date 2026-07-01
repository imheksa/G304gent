import { NextResponse } from "next/server";
import { exchangeCode } from "@/lib/server/wikidata";

export const runtime = "nodejs";

function originOf(req: Request): string {
  const h = new Headers(req.headers);
  const proto = h.get("x-forwarded-proto") || "https";
  const host = h.get("x-forwarded-host") || h.get("host") || "";
  return `${proto}://${host}`;
}

// OAuth callback: verifies state, exchanges the code for an access token, stores
// it in an httpOnly cookie, and returns the user to the Distribute page.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const saved = req.headers.get("cookie")?.match(/(?:^|;\s*)wd_state=([^;]+)/)?.[1];
  const back = `${originOf(req)}/distribute`;

  if (!code || !state || !saved || decodeURIComponent(saved) !== state) {
    const res = NextResponse.redirect(`${back}?wd=error`);
    res.cookies.delete("wd_state");
    return res;
  }

  try {
    const token = await exchangeCode(code, `${originOf(req)}/api/distribute/wikidata/callback`);
    const res = NextResponse.redirect(`${back}?wd=connected`);
    res.cookies.set("wd_at", token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
    res.cookies.delete("wd_state");
    return res;
  } catch {
    const res = NextResponse.redirect(`${back}?wd=error`);
    res.cookies.delete("wd_state");
    return res;
  }
}
