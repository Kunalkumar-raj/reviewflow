import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Public client for anonymous, read-only access.
// - Uses ONLY the anon key and the public_clients VIEW (safe columns only).
// - Deliberately does NOT touch cookies/sessions: public pages must never
//   trigger auth session loading (which is request-time only in Next.js 16
//   Cache Components and caused the Date.now() prerender issue in /admin).
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
