import type { SupabaseClient } from "@supabase/supabase-js";

// Shared server-side guard for Server Actions: returns the user only when
// a session exists AND its profile role is super_admin. Otherwise null.
export async function requireSuperAdmin(supabase: SupabaseClient) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "super_admin") return null;
  return user;
}
