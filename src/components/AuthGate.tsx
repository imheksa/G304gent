"use client";

import Link from "next/link";
import { usePrivy } from "@privy-io/react-auth";
import { PRIVY_ENABLED } from "@/lib/web3-config";
import { ChipLogo } from "@/components/Logo";

// Gates app pages behind Privy login. If Privy isn't configured (no App ID at
// build time) the gate is a no-op so the site stays usable.
export default function AuthGate({ children }: { children: React.ReactNode }) {
  if (!PRIVY_ENABLED) return <>{children}</>;
  return <Gate>{children}</Gate>;
}

function Gate({ children }: { children: React.ReactNode }) {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!authenticated) {
    return <LoginScreen onLogin={() => login()} />;
  }

  return <>{children}</>;
}

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950">
      <div className="absolute inset-0 bg-grid opacity-30" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px]" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-[128px]" />

      <div className="relative w-full max-w-md px-6">
        <div className="rounded-2xl border border-white/5 bg-gray-900/50 p-10 backdrop-blur-xl">
          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold tracking-tight">
              <ChipLogo className="w-7 h-7" />
              <span className="text-gradient">6304</span>
              <span className="text-white">&nbsp;Agent</span>
            </Link>
            <h1 className="mt-6 text-xl font-semibold text-white">Sign in to continue</h1>
            <p className="mt-2 text-sm text-gray-400">Log in to access your AI Visibility Dashboard</p>
          </div>

          <div className="mt-8">
            <button
              onClick={onLogin}
              className="flex w-full items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-3.5 text-sm font-medium text-white hover:from-cyan-400 hover:to-violet-400 transition-all"
            >
              Continue with Google
            </button>
          </div>

          <p className="mt-8 text-center text-xs text-gray-400">
            Secured by Privy. A Solana wallet is created for you automatically.
          </p>
        </div>
      </div>
    </div>
  );
}
