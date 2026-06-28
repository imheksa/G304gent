import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// The backend is "configured" only when Supabase + the Privy server secret are
// present. Until then, API routes return 501 and the client falls back to
// localStorage.
export const backendConfigured = Boolean(url && serviceKey && process.env.PRIVY_APP_SECRET);

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!url || !serviceKey) throw new Error("Supabase is not configured");
  if (!client) {
    client = createClient(url, serviceKey, { auth: { persistSession: false } });
  }
  return client;
}
