"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { I18nProvider } from "@/i18n/context";
import LoginRedirect from "@/components/LoginRedirect";
import { PRIVY_APP_ID, PRIVY_ENABLED } from "@/lib/web3-config";

export default function Providers({ children }: { children: React.ReactNode }) {
  // When Privy isn't configured (no App ID at build time), skip the provider
  // entirely so the site still works.
  if (!PRIVY_ENABLED) {
    return <I18nProvider>{children}</I18nProvider>;
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        loginMethods: ["google"],
        appearance: {
          theme: "dark",
          accentColor: "#06b6d4",
          walletChainType: "solana-only",
        },
        embeddedWallets: {
          solana: { createOnLogin: "users-without-wallets" },
        },
      }}
    >
      <LoginRedirect />
      <I18nProvider>{children}</I18nProvider>
    </PrivyProvider>
  );
}
