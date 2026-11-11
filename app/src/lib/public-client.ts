import { createPublicClient } from "@/lib/supabase/public";
import type { PublicClient } from "@/types/database";

// Reads ONE active business from the public_clients VIEW by slug.
// The view exposes only safe columns (no email/phone/address) and only
// active clients, so an unknown OR deactivated slug both return null.
export async function getPublicClientBySlug(
  slug: string
): Promise<PublicClient | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url || url.includes("placeholder")) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("public_clients")
    .select(
      "id, business_name, slug, category, website, google_review_url, logo_url, welcome_message, is_active"
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data as PublicClient;
}
