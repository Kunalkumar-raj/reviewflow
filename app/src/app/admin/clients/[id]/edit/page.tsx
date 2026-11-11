import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";
import { updateClient } from "@/actions/clients";
import { ClientForm, type ClientFormValues } from "@/components/admin/ClientForm";

export const instant = false;

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connection(); // request-time only: never prerender Supabase/auth reads
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !client) {
    notFound();
  }

  const initialValues: ClientFormValues = {
    business_name: client.business_name,
    slug: client.slug,
    owner_name: client.owner_name ?? "",
    email: client.email ?? "",
    phone: client.phone ?? "",
    address: client.address ?? "",
    category: client.category ?? "",
    website: client.website ?? "",
    google_review_url: client.google_review_url,
    welcome_message: client.welcome_message,
    is_active: client.is_active,
    logo_url: client.logo_url,
  };

  // Bind this client's id into the update action.
  const action = updateClient.bind(null, id);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold tracking-tight">
        Edit — {client.business_name}
      </h1>
      <p className="mt-0.5 text-sm text-zinc-400">
        Public page: /review/{client.slug}. Changing the slug also changes
        the public URL and its QR code.
      </p>
      <div className="mt-6">
        <ClientForm
          action={action}
          initialValues={initialValues}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}
