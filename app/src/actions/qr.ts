"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireSuperAdmin } from "@/lib/require-admin";

// "Regenerate" bumps qr_version and stamps last_qr_generated_at.
// The encoded URL itself never changes (it is derived from the slug),
// so previously printed QR copies keep working — regeneration is for
// fresh prints, design/size changes, or replacing a damaged copy.
export async function regenerateQrCode(
  clientId: string
): Promise<{ ok: boolean; error?: string; version?: number }> {
  const supabase = await createClient();
  const user = await requireSuperAdmin(supabase);
  if (!user) return { ok: false, error: "Not authorized." };

  const { data: client, error: readError } = await supabase
    .from("clients")
    .select("qr_version")
    .eq("id", clientId)
    .single();

  if (readError || !client) {
    return { ok: false, error: "Client not found." };
  }

  const nextVersion = (client.qr_version as number) + 1;

  const { error } = await supabase
    .from("clients")
    .update({
      qr_version: nextVersion,
      last_qr_generated_at: new Date().toISOString(),
    })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/qr-codes");
  return { ok: true, version: nextVersion };
}
