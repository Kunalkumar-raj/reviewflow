import { createBrowserClient } from "@supabase/ssr";

// Browser client — uses ONLY the public anon key. Safe to run in the browser.
// RLS in the database is what actually protects the data.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
