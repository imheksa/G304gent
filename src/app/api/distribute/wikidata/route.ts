import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getUserId } from "@/lib/server/auth";
import { searchItems, submitToWikidata, login, oauthConfigured, type Auth, type WikidataIdentity } from "@/lib/server/wikidata";

export const runtime = "nodejs";
export const maxDuration = 30;

// GET /api/distribute/wikidata?name=Solana — search for an existing item.
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("name")?.trim();
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });
  try {
    return NextResponse.json({ matches: await searchItems(name) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "search_failed" }, { status: 502 });
  }
}

// POST — submit structured identity. Auth via the OAuth cookie (preferred) or a
// bot-password credential in the body (fallback when OAuth isn't configured).
export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const name = String(b.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });
  const mode = b.mode === "create" ? "create" : "existing";

  const identity: WikidataIdentity = {
    name,
    description: typeof b.description === "string" ? b.description : undefined,
    website: typeof b.website === "string" ? b.website : undefined,
    twitter: typeof b.twitter === "string" ? b.twitter : undefined,
    blog: typeof b.blog === "string" ? b.blog : undefined,
    instagram: typeof b.instagram === "string" ? b.instagram : undefined,
    sources: Array.isArray(b.sources) ? b.sources.filter((s: unknown) => typeof s === "string") : undefined,
  };

  try {
    // Prefer the connected OAuth account.
    const bearer = (await cookies()).get("wd_at")?.value;
    let auth: Auth;
    if (bearer) {
      auth = { bearer };
    } else {
      const username = String(b.username ?? "").trim();
      const password = String(b.password ?? "").trim();
      if (!username || !password) {
        return NextResponse.json(
          { error: oauthConfigured() ? "connect_wikidata" : "credentials_required" },
          { status: 400 }
        );
      }
      auth = await login(username, password);
    }
    const result = await submitToWikidata(auth, identity, mode, typeof b.qid === "string" ? b.qid : undefined);
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "submit_failed" }, { status: 502 });
  }
}
