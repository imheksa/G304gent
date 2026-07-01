import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server/auth";
import { searchItems, submitToWikidata } from "@/lib/server/wikidata";

export const runtime = "nodejs";
export const maxDuration = 30;

// GET /api/distribute/wikidata?name=Solana — search for an existing item so the
// UI can offer "add to existing" vs "create new". No auth needed (public data).
export async function GET(req: Request) {
  const name = new URL(req.url).searchParams.get("name")?.trim();
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });
  try {
    const matches = await searchItems(name);
    return NextResponse.json({ matches });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "search_failed" }, { status: 502 });
  }
}

// POST — submit the brand's structured identity to Wikidata using the user's
// bot-password credentials. Requires the user to be signed in to 6304.
export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const username = String(b.username ?? "").trim();
  const password = String(b.password ?? "").trim();
  const name = String(b.name ?? "").trim();
  const mode = b.mode === "create" ? "create" : "existing";
  if (!username || !password) return NextResponse.json({ error: "credentials_required" }, { status: 400 });
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  try {
    const result = await submitToWikidata({
      username,
      password,
      name,
      description: typeof b.description === "string" ? b.description : undefined,
      website: typeof b.website === "string" ? b.website : undefined,
      twitter: typeof b.twitter === "string" ? b.twitter : undefined,
      mode,
      qid: typeof b.qid === "string" ? b.qid : undefined,
    });
    return NextResponse.json({ result });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "submit_failed" }, { status: 502 });
  }
}
