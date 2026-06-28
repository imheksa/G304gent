import { NextResponse } from "next/server";
import { getUserId } from "@/lib/server/auth";
import { getSupabase, backendConfigured } from "@/lib/server/db";
import { getConnection } from "@/lib/pay";
import { PAYMENT_ASSETS, RECIPIENT_WALLET } from "@/lib/web3-config";

export const runtime = "nodejs";

// Maps a plan name to a subscription tier.
const PLAN_TIER: Record<string, string> = {
  Starter: "tier1",
  Pro: "tier2",
  Enterprise: "tier3",
};

export async function POST(req: Request) {
  if (!backendConfigured) return NextResponse.json({ error: "not_configured" }, { status: 501 });
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { plan, asset: assetSymbol, signature } = await req.json();
  if (!plan || !assetSymbol || !signature) {
    return NextResponse.json({ error: "missing_fields" }, { status: 400 });
  }
  const tier = PLAN_TIER[plan];
  if (!tier) return NextResponse.json({ error: "unknown_plan" }, { status: 400 });
  const asset = PAYMENT_ASSETS.find((a) => a.symbol === assetSymbol);
  if (!asset) return NextResponse.json({ error: "unknown_asset" }, { status: 400 });

  const sb = getSupabase();

  // Idempotent: if we've already credited this signature, return its tier.
  const existing = await sb.from("payments").select("user_id").eq("signature", signature).maybeSingle();
  if (existing.data) {
    const sub = await sb.from("subscriptions").select("tier").eq("user_id", userId).maybeSingle();
    return NextResponse.json({ tier: sub.data?.tier ?? tier });
  }

  // Verify the transaction landed and the recipient actually received funds.
  let received = false;
  try {
    const tx = await getConnection().getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (!tx || tx.meta?.err) {
      return NextResponse.json({ error: "tx_not_confirmed" }, { status: 400 });
    }
    if (asset.kind === "native") {
      const keys = tx.transaction.message.accountKeys.map((k) => k.pubkey.toBase58());
      const idx = keys.indexOf(RECIPIENT_WALLET);
      if (idx >= 0 && tx.meta) {
        received = tx.meta.postBalances[idx] - tx.meta.preBalances[idx] > 0;
      }
    } else {
      const post = tx.meta?.postTokenBalances ?? [];
      const pre = tx.meta?.preTokenBalances ?? [];
      const postAmt = Number(
        post.find((b) => b.owner === RECIPIENT_WALLET && b.mint === asset.mint)?.uiTokenAmount.uiAmount ?? 0
      );
      const preAmt = Number(
        pre.find((b) => b.owner === RECIPIENT_WALLET && b.mint === asset.mint)?.uiTokenAmount.uiAmount ?? 0
      );
      received = postAmt > preAmt;
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "verify_failed" }, { status: 502 });
  }

  if (!received) return NextResponse.json({ error: "recipient_not_paid" }, { status: 400 });

  // Record the payment and activate the tier.
  const ins = await sb.from("payments").insert({
    user_id: userId,
    plan,
    asset: assetSymbol,
    signature,
  });
  if (ins.error && !ins.error.message.includes("duplicate")) {
    return NextResponse.json({ error: ins.error.message }, { status: 500 });
  }
  const up = await sb
    .from("subscriptions")
    .upsert({ user_id: userId, tier, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (up.error) return NextResponse.json({ error: up.error.message }, { status: 500 });

  return NextResponse.json({ tier });
}
