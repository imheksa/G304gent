-- 6304 Agent — Supabase schema
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query).
-- Rows are keyed by the Privy user id (DID). All access goes through the
-- server (service role), so RLS is enabled with no public policies — the anon
-- key cannot read or write these tables.

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  website text not null default '',
  blog text not null default '',
  twitter text not null default '',
  instagram text not null default '',
  linkedin text not null default '',
  is_competitor boolean not null default false,
  created_at timestamptz not null default now(),
  unique (user_id, name, is_competitor)
);
create index if not exists brands_user_idx on public.brands (user_id);

create table if not exists public.subscriptions (
  user_id text primary key,
  tier text not null default 'free',
  updated_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  plan text not null,
  asset text not null,
  signature text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists payments_user_idx on public.payments (user_id);

-- Lock down: only the service role (used by the server) may access these.
alter table public.brands enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
