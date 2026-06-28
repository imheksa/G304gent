# 6304 Agent

**Most Powerful GEO (Generative Engine Optimization) Agent for Web3**

> Make sure AI displays your protocol correctly — and become the answer when users ask AI about CEXs, DEXs, RWA, Payment, Stablecoins, and GameFi.

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Live

https://geoagents.xyz/

## About

6304 Agent is a Generative Engine Optimization (GEO) agent that helps Web3 projects monitor and improve how AI engines (ChatGPT, Gemini, Claude, Grok, Deepseek, and Google AI) represent them. Catch misinformation about trading fees, audits, custody, and tokenomics — then become the trusted answer.

### Verticals

- **CEXs** — Centralized Exchanges
- **DEXs** — Decentralized Exchanges
- **RWA** — Real World Assets
- **Payment**
- **Stablecoin**
- **GameFi**

## Login & Payments

- **Login** is handled by [Privy](https://home.privy.io/apps) (Google login with an
  auto-created embedded Solana wallet). The app (brands / dashboard / compare) is gated
  behind login.
- **Payments** accept **SOL, USDC, and USDT** on Solana **mainnet-beta**, sent from the
  user's Privy wallet to a configured recipient address from the pricing checkout.

### Configuration

Set these as GitHub Actions repository **Variables** (Settings → Secrets and variables →
Actions → Variables). They are public, client-side values — not secrets. See `.env.example`.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy App ID from https://home.privy.io/apps |
| `NEXT_PUBLIC_RECIPIENT_WALLET` | Solana address that receives payments |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | (optional) custom mainnet RPC URL |

> In the Privy dashboard, enable **Google** as a login method and **Solana** embedded
> wallets. If `NEXT_PUBLIC_PRIVY_APP_ID` is unset, login/payments are disabled and the
> app stays open so a deploy is never blocked.

---

*6304 Agent — GEO for Web3.*
