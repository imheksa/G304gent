"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useWallets } from "@privy-io/react-auth/solana";
import { PRIVY_ENABLED } from "@/lib/web3-config";

function truncate(addr?: string) {
  if (!addr) return "";
  return `${addr.slice(0, 4)}…${addr.slice(-4)}`;
}

export default function AccountButton() {
  if (!PRIVY_ENABLED) return null;
  return <Inner />;
}

function Inner() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();
  const [open, setOpen] = useState(false);

  if (!ready) {
    return <div className="h-8 w-20 animate-pulse rounded-lg bg-white/5" />;
  }

  if (!authenticated) {
    return (
      <button
        onClick={() => login()}
        className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2 text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all"
      >
        Log In
      </button>
    );
  }

  const address = wallets[0]?.address;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-gray-200 hover:bg-white/10 transition-all"
      >
        <span className="h-2 w-2 rounded-full bg-emerald-400" />
        <span className="font-mono text-xs">{address ? truncate(address) : "Account"}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-white/10 bg-gray-900 p-2 shadow-xl z-50">
          <div className="px-3 py-2 border-b border-white/5">
            <p className="text-xs font-mono uppercase tracking-widest text-gray-500">Solana Wallet</p>
            <p className="mt-1 font-mono text-xs text-gray-300 break-all">{address || "—"}</p>
          </div>
          <button
            onClick={async () => {
              await logout();
              setOpen(false);
            }}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-4 w-4">
              <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
            </svg>
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
