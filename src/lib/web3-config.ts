// Web3 / payments configuration.
// All values are public, client-side identifiers. They can be overridden at
// build time via NEXT_PUBLIC_* env vars; otherwise the defaults below are used.

// Default Privy App ID (public). Override with NEXT_PUBLIC_PRIVY_APP_ID if set.
const DEFAULT_PRIVY_APP_ID = "cmquwmdev00h40cle8tosg0uy";

// Default Solana wallet that receives SOL / USDC / USDT payments (public).
// Set this once you have the receiving address, or override via env var.
const DEFAULT_RECIPIENT_WALLET = "";

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || DEFAULT_PRIVY_APP_ID;

export const SOLANA_NETWORK = "mainnet-beta" as const;

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";

// The wallet that receives SOL / USDC / USDT payments.
export const RECIPIENT_WALLET =
  process.env.NEXT_PUBLIC_RECIPIENT_WALLET || DEFAULT_RECIPIENT_WALLET;

export type PaymentAsset = {
  symbol: "SOL" | "USDC" | "USDT";
  label: string;
  kind: "native" | "spl";
  decimals: number;
  mint?: string;
};

// Accepted assets on Solana mainnet-beta.
export const PAYMENT_ASSETS: PaymentAsset[] = [
  { symbol: "SOL", label: "Solana", kind: "native", decimals: 9 },
  {
    symbol: "USDC",
    label: "USD Coin",
    kind: "spl",
    decimals: 6,
    mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  },
  {
    symbol: "USDT",
    label: "Tether USD",
    kind: "spl",
    decimals: 6,
    mint: "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB",
  },
];

// Feature flags derived from configuration. When Privy isn't configured the
// app stays open (no gate) so a deploy is never bricked by a missing App ID.
export const PRIVY_ENABLED = PRIVY_APP_ID.length > 0;
export const PAYMENTS_ENABLED = PRIVY_ENABLED && RECIPIENT_WALLET.length > 0;
