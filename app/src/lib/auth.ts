import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string | null;
  role: "super_admin";
}

// Canonical Next.js 16 Cache Components pattern for reading a session
// (see Next.js guide: "Authentication with Cache Components").
//
// Why 'use cache: private' is required here:
// - Reading the Supabase session reads cookies() deep inside the auth library.
// - Validating the session compares the token expiry against the CURRENT TIME
//   (@supabase/auth-js calls Date.now() in _loadSession). That is a request-
//   and time-dependent read, so it can never be prerendered or server-cached.
// - 'use cache: private' is the directive designed exactly for this: it may
//   read cookies()/headers() and keeps the result only in the browser's
//   private cache, never on the server.
//
// redirect() calls throw, so they are never cached — only a verified
// Super Admin profile is ever returned.
export async function getAdminProfile(): Promise<AdminProfile> {
  "use cache: private";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, full_name, role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") {
    redirect("/login?error=not-admin");
  }

  return {
    id: user.id,
    email: profile.email as string,
    fullName: (profile.full_name as string | null) ?? null,
    role: "super_admin",
  };
}
