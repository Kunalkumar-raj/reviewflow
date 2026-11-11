import Link from "next/link";
import { CheckCircle2, Plus, Search } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";
import { ClientRowActions } from "@/components/admin/ClientRowActions";
import { formatDate } from "@/lib/format";

export const instant = false;

interface ClientRow {
  id: string;
  business_name: string;
  slug: string;
  category: string | null;
  email: string | null;
  phone: string | null;
  logo_url: string | null;
  is_active: boolean;
  created_at: string;
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; msg?: string }>;
}) {
  const { q = "", status = "all", msg } = await searchParams;
  await connection(); // request-time only: never prerender Supabase/auth reads

  const supabase = await createClient();
  let query = supabase
    .from("clients")
    .select(
      "id, business_name, slug, category, email, phone, logo_url, is_active, created_at"
    )
    .order("created_at", { ascending: false });

  if (q.trim()) {
    const term = `%${q.trim()}%`;
    query = query.or(
      `business_name.ilike.${term},slug.ilike.${term},category.ilike.${term}`
    );
  }
  if (status === "active") query = query.eq("is_active", true);
  if (status === "inactive") query = query.eq("is_active", false);

  const { data, error } = await query;
  const clients = (data ?? []) as ClientRow[];

  const inputClass =
    "rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Add, edit, activate, deactivate or delete your businesses.
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300"
        >
          <Plus className="h-4 w-4" /> Add Client
        </Link>
      </div>

      {msg && (
        <p className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> {msg}
        </p>
      )}

      {/* Search + filter (plain GET form — works without JavaScript) */}
      <form method="get" className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            name="q"
            defaultValue={q}
            placeholder="Search business, slug or category..."
            className={`${inputClass} w-full pl-9`}
          />
        </div>
        <select name="status" defaultValue={status} className={inputClass}>
          <option value="all">All status</option>
          <option value="active">Active only</option>
          <option value="inactive">Inactive only</option>
        </select>
        <button
          type="submit"
          className="rounded-lg bg-zinc-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700"
        >
          Filter
        </button>
        {(q || status !== "all") && (
          <Link
            href="/admin/clients"
            className="text-sm text-zinc-400 underline-offset-2 hover:text-white hover:underline"
          >
            Clear
          </Link>
        )}
      </form>

      {error && (
        <p className="mt-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Database error: {error.message}
        </p>
      )}

      <div className="mt-5 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60">
        {clients.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm text-zinc-400">
              {q || status !== "all"
                ? "No clients match your search/filter."
                : "No clients yet."}
            </p>
            {!q && status === "all" && (
              <Link
                href="/admin/clients/new"
                className="mt-3 inline-flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
              >
                <Plus className="h-4 w-4" /> Add your first client
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">Review Page</th>
                  <th className="px-5 py-3 font-medium">Contact</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Added</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {clients.map((client) => (
                  <tr key={client.id} className="hover:bg-zinc-800/40">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {client.logo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={client.logo_url}
                            alt=""
                            className="h-9 w-9 rounded-lg border border-zinc-700 bg-white object-contain p-0.5"
                          />
                        ) : (
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-amber-300">
                            {client.business_name.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div>
                          <p className="font-medium text-white">
                            {client.business_name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {client.category ?? "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">
                      /review/{client.slug}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">
                      <p>{client.email ?? "—"}</p>
                      <p className="text-xs text-zinc-500">
                        {client.phone ?? ""}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          client.is_active
                            ? "bg-emerald-400/15 text-emerald-300"
                            : "bg-zinc-700/60 text-zinc-300"
                        }`}
                      >
                        {client.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400">
                      {formatDate(client.created_at)}
                    </td>
                    <td className="px-5 py-3.5">
                      <ClientRowActions
                        clientId={client.id}
                        businessName={client.business_name}
                        isActive={client.is_active}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-zinc-500">
        Deleting a client also deletes its scan history, click history and
        feedback. Deactivated clients keep their data — only their public
        page is hidden.
      </p>
    </div>
  );
}
