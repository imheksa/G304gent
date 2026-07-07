import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server/auth";
import { checkSurfaces } from "@/lib/server/surfaces";

export const runtime = "nodejs";
export const maxDuration = 20;

// GET /api/distribute/surfaces?name=Solana — presence check across the
// high-authority sources AI engines cite.
export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const name = new URL(req.url).searchParams.get("name")?.trim();
  if (!name) return NextResponse.json({ error: "name_required" }, { status: 400 });
  try {
    return NextResponse.json({ surfaces: await checkSurfaces(name) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "check_failed" }, { status: 502 });
  }
}
