import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server/auth";
import { getSupabase, backendConfigured } from "@/lib/server/db";
import { getEffectiveTier } from "@/lib/server/access";
import { TIER_LIMITS, type SubscriptionTier } from "@/lib/brand-data";

export const runtime = "nodejs";

type Row = {
  name: string;
  website: string;
  blog: string;
  twitter: string;
  instagram: string;
  linkedin: string;
  is_competitor: boolean;
  created_at: string;
};

function toProfile(r: Row) {
  return {
    name: r.name,
    website: r.website || "",
    blog: r.blog || "",
    twitter: r.twitter || "",
    instagram: r.instagram || "",
    linkedin: r.linkedin || "",
    createdAt: r.created_at,
  };
}

async function auth(req: Request) {
  if (!backendConfigured) return { error: NextResponse.json({ error: "not_configured" }, { status: 501 }) };
  const userId = await getUserId(req);
  if (!userId) return { error: NextResponse.json({ error: "unauthorized" }, { status: 401 }) };
  return { userId };
}

export async function GET(req: Request) {
  const a = await auth(req);
  if (a.error) return a.error;
  const isCompetitor = new URL(req.url).searchParams.get("type") === "competitor";
  const { data, error } = await getSupabase()
    .from("brands")
    .select("*")
    .eq("user_id", a.userId)
    .eq("is_competitor", isCompetitor)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ brands: (data as Row[]).map(toProfile) });
}

export async function POST(req: Request) {
  const a = await auth(req);
  if (a.error) return a.error;
  const body = await req.json();
  const p = body.profile ?? {};
  const isCompetitor = Boolean(body.isCompetitor);
  if (!p.name) return NextResponse.json({ error: "name_required" }, { status: 400 });

  const sb = getSupabase();

  // Enforce the competitor cap for the user's tier server-side (the client cap
  // alone can be bypassed by calling this route directly). Updates to an
  // existing competitor don't count against the limit.
  if (isCompetitor) {
    const [{ data: comps }, tierStr] = await Promise.all([
      sb.from("brands").select("name").eq("user_id", a.userId).eq("is_competitor", true),
      getEffectiveTier(a.userId),
    ]);
    const tier = (tierStr as SubscriptionTier) ?? "free";
    const limit = TIER_LIMITS[tier] ?? TIER_LIMITS.free;
    const names = (comps ?? []).map((c) => c.name);
    const isNew = !names.includes(p.name);
    if (isNew && names.length >= limit) {
      return NextResponse.json({ error: "competitor_limit_reached" }, { status: 403 });
    }
  }

  const { error } = await sb
    .from("brands")
    .upsert(
      {
        user_id: a.userId,
        name: p.name,
        website: p.website || "",
        blog: p.blog || "",
        twitter: p.twitter || "",
        instagram: p.instagram || "",
        linkedin: p.linkedin || "",
        is_competitor: isCompetitor,
      },
      { onConflict: "user_id,name,is_competitor" }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const a = await auth(req);
  if (a.error) return a.error;
  const body = await req.json();
  const isCompetitor = Boolean(body.isCompetitor);
  if (!body.name) return NextResponse.json({ error: "name_required" }, { status: 400 });
  const { error } = await getSupabase()
    .from("brands")
    .delete()
    .eq("user_id", a.userId)
    .eq("name", body.name)
    .eq("is_competitor", isCompetitor);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
