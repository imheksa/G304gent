import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server/auth";
import { getSupabase, backendConfigured } from "@/lib/server/db";
import { aiEnabled, analyzeBrandVisibility } from "@/lib/server/ai";
import { hasFullAccess } from "@/lib/server/access";
import { assembleBrandData } from "@/lib/brand-data";

export const runtime = "nodejs";
// The scan can take a few seconds — allow more than the default budget.
export const maxDuration = 60;

// A brand can be scanned at most once per hour.
const COOLDOWN_MS = 60 * 60 * 1000;

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

  const sb = backendConfigured ? getSupabase() : null;

  // Allowlisted (demo/test) wallets are exempt from the hourly cooldown.
  const fullAccess = await hasFullAccess(a.userId);

  // Rate limit: at most one scan per brand per hour. Return the cached scan
  // plus how long until the next one is allowed.
  if (sb && !fullAccess) {
    const { data: existing } = await sb
      .from("scans")
      .select("data, created_at")
      .eq("user_id", a.userId)
      .eq("brand_name", brand)
      .maybeSingle();
    if (existing?.created_at) {
      const ageMs = Date.now() - new Date(existing.created_at).getTime();
      if (ageMs < COOLDOWN_MS) {
        return NextResponse.json(
          { error: "rate_limited", retryAfterMs: COOLDOWN_MS - ageMs, data: existing.data },
          { status: 429 }
        );
      }
    }
  }

  let data;
  try {
    const { core, responses } = await analyzeBrandVisibility(brand);
    data = assembleBrandData(core, responses);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "scan_failed" }, { status: 502 });
  }

  if (sb) {
    const { error } = await sb
      .from("scans")
      .upsert(
        { user_id: a.userId, brand_name: brand, engine: "claude", data, created_at: new Date().toISOString() },
        { onConflict: "user_id,brand_name" }
      );
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
