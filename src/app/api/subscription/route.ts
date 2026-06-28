import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server/auth";
import { getSupabase, backendConfigured } from "@/lib/server/db";

export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!backendConfigured) return NextResponse.json({ error: "not_configured" }, { status: 501 });
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await getSupabase()
    .from("subscriptions")
    .select("tier")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ tier: data?.tier ?? "free" });
}
