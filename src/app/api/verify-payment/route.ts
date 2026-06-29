import { NextResponse } from "next/server";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { getUserId, getUserSolanaWallets } from "@/lib/server/auth";
import { getSupabase, backendConfigured } from "@/lib/server/db";
import { getConnection, fetchSolUsdPrice } from "@/lib/pay";
import { PAYMENT_ASSETS, RECIPIENT_WALLET } from "@/lib/web3-config";

export const runtime = "nodejs";

// Maps a plan name to a subscription tier.
const PLAN_TIER: Record<string, string> = {
  Starter: "tier1",
  Pro: "tier2",
  Enterprise: "tier3",
};

// Server-side source of truth for what each paid plan costs (USD). The client
// is never trusted for the amount.
const PLAN_PRICE_USD: Record<string, number> = {
  Starter: 49,
  Pro: 149,
};

// Stablecoins are ~1:1 with USD; allow a tiny shortfall for rounding.
const STABLE_TOLERANCE = 0.99;
// SOL price moves between when the client computes the amount and when we
// verify, so allow generous downside slack while still rejecting dust.
const SOL_TOLERANCE = 0.9;

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
  const priceUsd = PLAN_PRICE_USD[plan];
  if (!priceUsd) return NextResponse.json({ error: "plan_not_payable" }, { status: 400 });
  const asset = PAYMENT_ASSETS.find((a) => a.symbol === assetSymbol);
  if (!asset) return NextResponse.json({ error: "unknown_asset" }, { status: 400 });

  const sb = getSupabase();

  // Idempotent: if we've already credited this signature, return its tier.
  const existing = await sb.from("payments").select("user_id").eq("signature", signature).maybeSingle();
  if (existing.data) {
    const sub = await sb.from("subscriptions").select("tier").eq("user_id", userId).maybeSingle();
    return NextResponse.json({ tier: sub.data?.tier ?? tier });
  }

  // The transaction must be paid by one of the authenticated user's own Privy
  // wallets — otherwise anyone could replay a stranger's payment signature.
  let userWallets: string[];
  try {
    userWallets = await getUserSolanaWallets(userId);
  } catch {
    // Privy lookup failed (transient) — let the client retry rather than
    // silently skipping the ownership check.
    return NextResponse.json({ error: "owner_lookup_failed" }, { status: 502 });
  }
  if (userWallets.length === 0) {
    return NextResponse.json({ error: "no_wallet_for_user" }, { status: 400 });
  }

  // Verify the tx landed, was paid by the user, and the recipient received the
  // correct amount for the plan.
  try {
    const tx = await getConnection().getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
    if (!tx || tx.meta?.err) {
      return NextResponse.json({ error: "tx_not_confirmed" }, { status: 400 });
    }

    // The fee payer (first account key) is the sender; bind it to the user.
    const keys = tx.transaction.message.accountKeys.map((k) => k.pubkey.toBase58());
    const feePayer = keys[0];
    if (!feePayer || !userWallets.includes(feePayer)) {
      return NextResponse.json({ error: "sender_mismatch" }, { status: 403 });
    }

    // How much the recipient actually received, in the paid asset's units.
    let receivedUi = 0;
    if (asset.kind === "native") {
      const idx = keys.indexOf(RECIPIENT_WALLET);
      if (idx >= 0 && tx.meta) {
        receivedUi = (tx.meta.postBalances[idx] - tx.meta.preBalances[idx]) / LAMPORTS_PER_SOL;
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
      receivedUi = postAmt - preAmt;
    }

    if (receivedUi <= 0) {
      return NextResponse.json({ error: "recipient_not_paid" }, { status: 400 });
    }

    // Validate the amount covers the plan price (so a dust payment can't unlock
    // a paid tier).
    let minRequired: number;
    if (asset.kind === "native") {
      const solPrice = await fetchSolUsdPrice(); // USD per SOL
      minRequired = (priceUsd / solPrice) * SOL_TOLERANCE;
    } else {
      minRequired = priceUsd * STABLE_TOLERANCE;
    }
    if (receivedUi < minRequired) {
      return NextResponse.json({ error: "amount_too_low" }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "verify_failed" }, { status: 502 });
  }

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
