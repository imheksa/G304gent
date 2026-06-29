# Deploy 6304 Agent on Vercel + Supabase

This app now runs as a native Next.js app (no static export). Data (brands,
competitors, subscriptions, payments) lives in **Supabase**; the API routes
verify the **Privy** access token server-side. Until you set
`NEXT_PUBLIC_USE_BACKEND=1`, the app falls back to `localStorage` so nothing
breaks during setup.

## 1. Supabase
1. Create a project at https://supabase.com → New project.
2. **SQL Editor → New query** → paste the contents of `supabase/schema.sql` → **Run**.
3. **Project Settings → API**, copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** secret key → `SUPABASE_SERVICE_ROLE_KEY` (server-only, keep secret)

## 2. Privy
1. https://home.privy.io/apps → your app → **Settings**.
2. Copy the **App secret** → `PRIVY_APP_SECRET`.
3. Under **Domains / Allowed origins**, add your Vercel URL (e.g.
   `https://your-project.vercel.app`) and later your custom domain.

## 3. Vercel
1. https://vercel.com → **Add New → Project** → import this GitHub repo.
2. Framework preset: **Next.js** (auto-detected). Build command/output: default.
3. **Settings → Environment Variables**, add (see `.env.example`):
   - `NEXT_PUBLIC_USE_BACKEND` = `1`
   - `PRIVY_APP_SECRET` = *(from step 2)*
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` = *(from step 1)*
   - *(AI engine, optional)* `NEXT_PUBLIC_AI_ENABLED` = `1` and
     `ANTHROPIC_API_KEY` = *(from https://console.anthropic.com)* — powers the
     dashboard with real AI-visibility scans (Claude). Leave both unset to use
     the built-in sample data.
   - *(optional)* `NEXT_PUBLIC_PRIVY_APP_ID`, `NEXT_PUBLIC_RECIPIENT_WALLET`,
     `NEXT_PUBLIC_SOLANA_RPC_URL` — defaults are already in the code.
4. Set the **Production Branch** to the branch with this code, then **Deploy**.

## 4. Custom domain (later)
- Vercel → **Settings → Domains** → add your domain and follow the DNS steps.
- Add the same domain to Privy **Allowed origins**.

## 5. Verify
- Open the Vercel URL → log in with Google.
- Add a brand → it should persist in Supabase (`brands` table) and survive across
  devices/browsers (not just localStorage).
- Pay a plan → `/api/verify-payment` checks the on-chain transfer to the recipient,
  records it in `payments`, and sets the tier in `subscriptions` → dashboard unlocks.

## Notes
- The GitHub Pages workflow (`.github/workflows/deploy.yml`) no longer applies once
  you move to Vercel; you can delete it after the Vercel deploy is confirmed.
- Payment verification confirms the recipient actually received funds and prevents
  replay (unique signature). Stricter amount-vs-plan validation can be added later.
