import { notFound } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { QrPrintSheet } from "@/components/admin/QrPrintSheet";
import { qrTargetUrl } from "@/lib/qr";

export const instant = false;

export default async function QrPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection(); // request-time only
  const { id } = await params;
  const supabase = await createClient();

  const { data: client, error } = await supabase
    .from("clients")
    .select("business_name, slug, logo_url")
    .eq("id", id)
    .single();

  if (error || !client) {
    notFound();
  }

  return (
    <QrPrintSheet
      businessName={client.business_name}
      logoUrl={client.logo_url}
      targetUrl={qrTargetUrl(client.slug)}
    />
  );
}
