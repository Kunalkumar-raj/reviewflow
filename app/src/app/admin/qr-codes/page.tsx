import Link from "next/link";
import { connection } from "next/server";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { QrCard, type QrCardClient } from "@/components/admin/QrCard";
import { qrTargetUrl } from "@/lib/qr";

export const instant = false;

export default async function QrCodesPage() {
  await connection(); // request-time only: never prerender Supabase reads
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("clients")
    .select(
      "id, business_name, slug, logo_url, is_active, qr_version, last_qr_generated_at"
    )
    .order("business_name", { ascending: true });

  const clients = (data ?? []) as QrCardClient[];

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">QR Codes</h1>
      <p className="mt-0.5 max-w-2xl text-sm text-zinc-400">
        Every client gets one unique QR code for their own review page.
        Download the PNG, or open the print sheet and save it as a PDF for
        the shop counter.
      </p>

      {error && (
        <p className="mt-5 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Database error: {error.message}
        </p>
      )}

      {clients.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-5 py-12 text-center">
          <p className="text-sm text-zinc-400">No clients yet, so no QR codes yet.</p>
          <Link
            href="/admin/clients/new"
            className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
          >
            <Plus className="h-4 w-4" /> Add your first client
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {clients.map((client) => (
            <QrCard
              key={client.id}
              client={client}
              targetUrl={qrTargetUrl(client.slug)}
            />
          ))}
        </div>
      )}

      <p className="mt-6 rounded-xl border border-zinc-800/80 bg-zinc-900/60 px-4 py-3 text-xs leading-relaxed text-zinc-500">
        Important: a QR code permanently encodes the full web address,
        including the domain shown in each card. If your site address is
        still localhost or a temporary Vercel URL, use these QRs for testing
        only — decide the final domain before printing copies for a real
        shop.
      </p>
    </div>
  );
}
