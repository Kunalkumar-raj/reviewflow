"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/slug";
import {
  ALLOWED_LOGO_TYPES,
  MAX_LOGO_BYTES,
  clientFormSchema,
} from "@/lib/validations";

export interface ClientFormState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

// Every client action re-verifies the Super Admin role on the server.
// The admin layout check alone is never trusted.
async function requireSuperAdmin(supabase: SupabaseClient) {
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

function parseForm(formData: FormData) {
  const rawSlug = String(formData.get("slug") ?? "").trim();
  const businessName = String(formData.get("business_name") ?? "");
  return {
    business_name: businessName,
    // Slug blank -> auto-generate from the business name.
    slug: rawSlug.length > 0 ? rawSlug : slugify(businessName),
    owner_name: String(formData.get("owner_name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    address: String(formData.get("address") ?? ""),
    category: String(formData.get("category") ?? ""),
    website: String(formData.get("website") ?? ""),
    google_review_url: String(formData.get("google_review_url") ?? ""),
    welcome_message: String(
      formData.get("welcome_message") ??
        "Thank you for visiting us! Your feedback helps us grow."
    ),
    is_active: formData.get("is_active") === "on",
  };
}

function toState(error: {
  issues: Array<{ path: PropertyKey[]; message: string }>;
}): ClientFormState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return { error: "Please fix the highlighted fields.", fieldErrors };
}

// Uploads a logo to the client-logos bucket at {clientId}/logo.{ext}
// and returns its public URL. Returns { error } on a validation/storage failure.
async function uploadLogo(
  supabase: SupabaseClient,
  clientId: string,
  file: File
): Promise<{ url?: string; error?: string }> {
  const ext = ALLOWED_LOGO_TYPES[file.type];
  if (!ext) {
    return { error: "Logo must be a PNG, JPG, WEBP or SVG image." };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { error: "Logo is too large. Maximum size is 2 MB." };
  }

  const path = `${clientId}/logo.${ext}`;
  const { error } = await supabase.storage
    .from("client-logos")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) return { error: `Logo upload failed: ${error.message}` };

  const { data } = supabase.storage.from("client-logos").getPublicUrl(path);
  // Cache-bust so a replaced logo shows immediately on public pages.
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}

function getLogoFile(formData: FormData): File | null {
  const file = formData.get("logo");
  if (file instanceof File && file.size > 0) return file;
  return null;
}

export async function addClient(
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const supabase = await createClient();
  const user = await requireSuperAdmin(supabase);
  if (!user) return { error: "Not authorized. Please log in again." };

  const parsed = clientFormSchema.safeParse(parseForm(formData));
  if (!parsed.success) return toState(parsed.error);
  const input = parsed.data;

  // Friendly duplicate-slug check before hitting the database constraint.
  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", input.slug)
    .maybeSingle();
  if (existing) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: {
        slug: `The slug "${input.slug}" is already used by another client. Try "${input.slug}-2".`,
      },
    };
  }

  const { data: created, error } = await supabase
    .from("clients")
    .insert({ ...input, created_by: user.id })
    .select("id")
    .single();

  if (error || !created) {
    return { error: `Could not save the client: ${error?.message ?? "unknown error"}` };
  }

  const logoFile = getLogoFile(formData);
  if (logoFile) {
    const logo = await uploadLogo(supabase, created.id, logoFile);
    if (logo.error) {
      // The client WAS saved — say so honestly instead of pretending total failure.
      redirect(
        `/admin/clients?msg=${encodeURIComponent(
          "Client saved, but the logo was not uploaded: " + logo.error
        )}`
      );
    }
    await supabase
      .from("clients")
      .update({ logo_url: logo.url })
      .eq("id", created.id);
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin/dashboard");
  redirect(
    `/admin/clients?msg=${encodeURIComponent(
      `${input.business_name} added successfully.`
    )}`
  );
}

export async function updateClient(
  clientId: string,
  _prevState: ClientFormState,
  formData: FormData
): Promise<ClientFormState> {
  const supabase = await createClient();
  const user = await requireSuperAdmin(supabase);
  if (!user) return { error: "Not authorized. Please log in again." };

  const parsed = clientFormSchema.safeParse(parseForm(formData));
  if (!parsed.success) return toState(parsed.error);
  const input = parsed.data;

  const { data: existing } = await supabase
    .from("clients")
    .select("id")
    .eq("slug", input.slug)
    .neq("id", clientId)
    .maybeSingle();
  if (existing) {
    return {
      error: "Please fix the highlighted fields.",
      fieldErrors: {
        slug: `The slug "${input.slug}" is already used by another client.`,
      },
    };
  }

  const { error } = await supabase
    .from("clients")
    .update(input)
    .eq("id", clientId);
  if (error) {
    return { error: `Could not update the client: ${error.message}` };
  }

  const logoFile = getLogoFile(formData);
  if (logoFile) {
    const logo = await uploadLogo(supabase, clientId, logoFile);
    if (logo.error) return { error: logo.error };
    await supabase
      .from("clients")
      .update({ logo_url: logo.url })
      .eq("id", clientId);
  }

  revalidatePath("/admin/clients");
  revalidatePath("/admin/dashboard");
  redirect(
    `/admin/clients?msg=${encodeURIComponent(
      `${input.business_name} updated successfully.`
    )}`
  );
}

export async function toggleClientStatus(
  clientId: string,
  currentlyActive: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await requireSuperAdmin(supabase);
  if (!user) return { ok: false, error: "Not authorized." };

  const { error } = await supabase
    .from("clients")
    .update({ is_active: !currentlyActive })
    .eq("id", clientId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}

export async function deleteClient(
  clientId: string
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const user = await requireSuperAdmin(supabase);
  if (!user) return { ok: false, error: "Not authorized." };

  // Remove the client's logo files first (best effort), then the row.
  // Deleting the row cascades to its scan/click/feedback events.
  const { data: files } = await supabase.storage
    .from("client-logos")
    .list(clientId);
  if (files && files.length > 0) {
    await supabase.storage
      .from("client-logos")
      .remove(files.map((f) => `${clientId}/${f.name}`));
  }

  const { error } = await supabase.from("clients").delete().eq("id", clientId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/clients");
  revalidatePath("/admin/dashboard");
  return { ok: true };
}
