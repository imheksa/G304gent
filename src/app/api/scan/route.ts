import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server/auth";
import { getSupabase, backendConfigured } from "@/lib/server/db";
import { aiEnabled, analyzeBrandVisibility } from "@/lib/server/ai";
import { assembleBrandData } from "@/lib/brand-data";

export const runtime = "nodejs";
// The Claude call can take a few seconds — allow more than the default budget.
export const maxDuration = 60;

async function requireUser(req: Request) {
  if (!aiEnabled) return { error: NextResponse.json({ error: "ai_disabled" }, { status: 501 }) };
  const userId = await getUserId(req);
  if (!userId) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  return { userId };
}

// Returns the latest stored scan for a brand, or { data: null } if none.
export async function GET(req: Request) {
  const a = await requireUser(req);
  if (a.error) return a.error;
  const brand = new URL(req.url).searchParams.get("brand")?.trim();
  if (!brand) return NextResponse.json({ error: "brand_required" }, { status: 400 });
  if (!backendConfigured) return NextResponse.json({ data: null });

  const { data, error } = await getSupabase()
    .from("scans")
    .select("data")
    .eq("user_id", a.userId)
    .eq("brand_name", brand)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ data: data?.data ?? null });
}

// Runs a fresh AI scan for the brand, stores it (when the backend is
// configured), and returns the assembled dashboard data.
export async function POST(req: Request) {
  const a = await requireUser(req);
  if (a.error) return a.error;
  const body = await req.json().catch(() => ({}));
  const brand = String(body.brand ?? "").trim();
  if (!brand) return NextResponse.json({ error: "brand_required" }, { status: 400 });

  let data;
  try {
    const core = await analyzeBrandVisibility(brand);
    data = assembleBrandData(core);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "scan_failed" }, { status: 502 });
  }

  if (backendConfigured) {
    const { error } = await getSupabase()
      .from("scans")
      .upsert(
        { user_id: a.userId, brand_name: brand, engine: "claude", data, created_at: new Date().toISOString() },
        { onConflict: "user_id,brand_name" }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
