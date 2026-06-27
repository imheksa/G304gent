"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets, useSignAndSendTransaction, useFundWallet } from "@privy-io/react-auth/solana";
import {
  PAYMENT_ASSETS,
  PAYMENTS_ENABLED,
  RECIPIENT_WALLET,
  type PaymentAsset,
} from "@/lib/web3-config";
import {
  buildPaymentTransaction,
  fetchSolUsdPrice,
  getConnection,
  getAssetBalance,
  base58Encode,
  explorerTxUrl,
} from "@/lib/pay";
import { setUserTier, TIER_LABELS, type SubscriptionTier } from "@/lib/brand-data";

type Props = {
  plan: string;
  amountUsd: number;
  onClose: () => void;
};

type Status =
  | { kind: "idle" }
  | { kind: "paying" }
  | { kind: "success"; signature: string }
  | { kind: "error"; message: string };

export default function CheckoutModal({ plan, amountUsd, onClose }: Props) {
  if (!PAYMENTS_ENABLED) return null;
  return <Inner plan={plan} amountUsd={amountUsd} onClose={onClose} />;
}

function Inner({ plan, amountUsd, onClose }: Props) {
  const { ready, authenticated, login } = usePrivy();
  const { wallets } = useWallets();
  const { signAndSendTransaction } = useSignAndSendTransaction();
  const { fundWallet } = useFundWallet();

  const [asset, setAsset] = useState<PaymentAsset>(PAYMENT_ASSETS[1]); // default USDC
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const [priceError, setPriceError] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  const wallet = wallets[0];

  // Check the connected wallet's balance for the selected asset.
  const checkBalance = useCallback(async () => {
    if (!wallet) return;
    setBalanceLoading(true);
    try {
      const bal = await getAssetBalance(getConnection(), new PublicKey(wallet.address), asset);
      setBalance(bal);
    } catch {
      setBalance(null);
    } finally {
      setBalanceLoading(false);
    }
  }, [wallet, asset]);

  useEffect(() => {
    setBalance(null);
    if (wallet && authenticated) checkBalance();
  }, [wallet, authenticated, checkBalance]);

  // Fetch the SOL price when SOL is selected (needed to convert USD -> SOL).
  useEffect(() => {
    if (asset.symbol !== "SOL" || solPrice !== null) return;
    let cancelled = false;
    fetchSolUsdPrice()
      .then((p) => !cancelled && setSolPrice(p))
      .catch(() => !cancelled && setPriceError(true));
    return () => {
      cancelled = true;
    };
  }, [asset.symbol, solPrice]);

  const amount = useMemo(() => {
    if (asset.kind === "spl") return amountUsd; // USDC/USDT are ~1:1 with USD
    if (!solPrice) return null;
    return amountUsd / solPrice;
  }, [asset, amountUsd, solPrice]);

  const amountLabel =
    amount === null
      ? asset.symbol === "SOL" && priceError
        ? "price unavailable"
        : "…"
      : `${asset.symbol === "SOL" ? amount.toFixed(4) : amount.toFixed(2)} ${asset.symbol}`;

  async function handlePay() {
    if (!wallet || amount === null) return;
    setStatus({ kind: "paying" });
    try {
      const connection = getConnection();
      const tx = await buildPaymentTransaction({
        connection,
        payer: new PublicKey(wallet.address),
        recipient: new PublicKey(RECIPIENT_WALLET),
        asset,
        uiAmount: amount,
      });
      const serialized = tx.serialize({ requireAllSignatures: false, verifySignatures: false });
      const { signature } = await signAndSendTransaction({
        transaction: new Uint8Array(serialized),
        wallet,
      });
      // Activate the subscription tier that matches the purchased plan.
      const tierEntry = (Object.entries(TIER_LABELS) as [SubscriptionTier, string][]).find(
        ([, label]) => label === plan
      );
      if (tierEntry) setUserTier(tierEntry[0]);
      setStatus({ kind: "success", signature: base58Encode(signature) });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Payment failed";
      setStatus({ kind: "error", message });
      // Refresh balance so the user can verify they have enough funds.
      checkBalance();
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-gray-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">Checkout</p>
            <h3 className="mt-1 text-lg font-semibold text-white">{plan} plan</h3>
            <p className="text-sm text-gray-500">${amountUsd} / month · pay with crypto on Solana</p>
          </div>
          <button onClick={onClose} className="rounded-md p-1.5 text-gray-500 hover:bg-white/5 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!ready ? (
          <div className="mt-8 flex justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          </div>
        ) : !authenticated ? (
          <div className="mt-6">
            <p className="text-sm text-gray-400">Log in to pay with your Solana wallet.</p>
            <button
              onClick={() => login()}
              className="mt-4 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all"
            >
              Continue with Google
            </button>
          </div>
        ) : status.kind === "success" ? (
          <div className="mt-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 text-xl">✓</div>
            <p className="mt-3 text-sm font-medium text-white">Payment sent</p>
            <a
              href={explorerTxUrl(status.signature)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block break-all text-xs font-mono text-cyan-400 hover:underline"
            >
              View on Solscan
            </a>
            <button onClick={onClose} className="mt-6 w-full rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-gray-300 hover:bg-white/5 transition-all">
              Done
            </button>
          </div>
        ) : (
          <div className="mt-6">
            {/* Asset selector */}
            <p className="text-xs font-medium text-gray-400 mb-2">Pay with</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_ASSETS.map((a) => (
                <button
                  key={a.symbol}
                  onClick={() => setAsset(a)}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    asset.symbol === a.symbol
                      ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                      : "border-white/10 text-gray-400 hover:bg-white/5"
                  }`}
                >
                  {a.symbol}
                </button>
              ))}
            </div>

            {/* Amount */}
            <div className="mt-5 rounded-xl border border-white/5 bg-gray-950/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Amount due</span>
                <span className="font-mono text-lg font-bold text-white">{amountLabel}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-gray-500">To</span>
                <span className="font-mono text-xs text-gray-400">
                  {RECIPIENT_WALLET.slice(0, 6)}…{RECIPIENT_WALLET.slice(-6)}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between border-t border-white/5 pt-2">
                <span className="text-xs text-gray-500">Your balance</span>
                {balanceLoading ? (
                  <span className="text-xs text-gray-500">checking…</span>
                ) : balance === null ? (
                  <button onClick={checkBalance} className="text-xs font-medium text-cyan-400 hover:underline">
                    Check balance
                  </button>
                ) : (
                  <span className={`font-mono text-xs ${amount !== null && balance < amount ? "text-red-400" : "text-gray-300"}`}>
                    {`${balance.toFixed(asset.symbol === "SOL" ? 4 : 2)} ${asset.symbol}`}
                  </span>
                )}
              </div>
            </div>

            {amount !== null && balance !== null && balance < amount && (
              <p className="mt-3 text-xs text-amber-400">
                Insufficient {asset.symbol} balance. Fund your wallet before paying.
              </p>
            )}

            {status.kind === "error" && (
              <div className="mt-3 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                <p className="text-xs font-medium text-red-400">Payment failed</p>
                <p className="mt-1 text-xs text-gray-400">
                  Check that your Privy wallet has enough <span className="font-mono">{asset.symbol}</span>
                  {asset.symbol !== "SOL" ? " and some SOL for network fees" : " for the amount plus network fees"}.
                  Use “Check balance” or “Fund wallet” below.
                </p>
                <p className="mt-1 break-words text-[10px] font-mono text-gray-600">{status.message}</p>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={status.kind === "paying" || amount === null || !wallet}
              className="mt-5 w-full rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3 text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all disabled:opacity-50"
            >
              {status.kind === "paying" ? "Confirming…" : `Pay ${amountLabel}`}
            </button>

            <button
              onClick={() => wallet && fundWallet({ address: wallet.address })}
              className="mt-2 w-full rounded-lg border border-white/10 px-4 py-2.5 text-xs font-medium text-gray-400 hover:bg-white/5 hover:text-white transition-all"
            >
              Need funds? Fund wallet
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
