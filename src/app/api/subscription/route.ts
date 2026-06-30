import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server/auth";
import { backendConfigured } from "@/lib/server/db";
import { getEffectiveTier } from "@/lib/server/access";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!backendConfigured) return NextResponse.json({ error: "not_configured" }, { status: 501 });
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const tier = await getEffectiveTier(userId);
    return NextResponse.json({ tier });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "tier_failed" }, { status: 500 });
  }
}
