import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server/auth";
import { getSupabase, backendConfigured } from "@/lib/server/db";
import { aiEnabled, analyzeBrandVisibility, type ScanEvent } from "@/lib/server/ai";
import { hasFullAccess } from "@/lib/server/access";
import { assembleBrandData } from "@/lib/brand-data";

export const runtime = "nodejs";
export const maxDuration = 60;

const COOLDOWN_MS = 60 * 60 * 1000;

// Streaming scan: emits per-engine progress as Server-Sent-Event-style JSON
// lines while the scan runs, then a final "done" event with the assembled data
// (which is also stored). Read on the client with fetch + a stream reader.
export async function POST(req: Request) {
  if (!aiEnabled) return NextResponse.json({ error: "ai_disabled" }, { status: 501 });
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const brand = String(body.brand ?? "").trim();
  if (!brand) return NextResponse.json({ error: "brand_required" }, { status: 400 });

  const sb = backendConfigured ? getSupabase() : null;
  const fullAccess = await hasFullAccess(userId);

  // Cooldown (skipped for allowlisted wallets) — returned as a plain JSON 429
  // with the cached scan so the client can show a message.
  if (sb && !fullAccess) {
    const { data: existing } = await sb
      .from("scans")
      .select("data, created_at")
      .eq("user_id", userId)
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

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: ScanEvent | { type: "done"; data: unknown } | { type: "error"; error: string }) =>
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        const { core, responses } = await analyzeBrandVisibility(brand, (e) => send(e));
        const data = assembleBrandData(core, responses);
        if (sb) {
          await sb
            .from("scans")
            .upsert(
              { user_id: userId, brand_name: brand, engine: "claude", data, created_at: new Date().toISOString() },
              { onConflict: "user_id,brand_name" }
            );
        }
        send({ type: "done", data });
      } catch (e) {
        send({ type: "error", error: e instanceof Error ? e.message : "scan_failed" });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
