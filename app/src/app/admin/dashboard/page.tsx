import Link from "next/link";
import {
  MousePointerClick,
  Plus,
  QrCode,
  ScanLine,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";
import { StatsCard } from "@/components/admin/StatsCard";
import { ScansChart } from "@/components/admin/ScansChart";
import { getDailyActivity } from "@/lib/analytics";
import { formatDateTime, timeAgo } from "@/lib/format";

// Auth-protected route: reads cookies/session per request, so it renders
// on demand instead of being prerendered (Next.js 16 Cache Components).
export const instant = false;

interface RecentClient {
  id: string;
  business_name: string;
  slug: string;
  category: string | null;
  is_active: boolean;
  created_at: string;
}

interface RecentScan {
  id: string;
  created_at: string;
  source: string;
  clients: { business_name: string } | { business_name: string }[] | null;
}

function scanClientName(scan: RecentScan): string {
  if (!scan.clients) return "Unknown business";
  if (Array.isArray(scan.clients))
    return scan.clients[0]?.business_name ?? "Unknown business";
  return scan.clients.business_name;
}

export default async function DashboardPage() {
  await connection(); // request-time only: never prerender Supabase/auth reads
  const supabase = await createClient();

  const [
    totalRes,
    activeRes,
    scansRes,
    clicksRes,
    recentClientsRes,
    recentScansRes,
    activity,
  ] = await Promise.all([
    supabase.from("clients").select("*", { count: "exact", head: true }),
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase.from("scan_events").select("*", { count: "exact", head: true }),
    supabase.from("click_events").select("*", { count: "exact", head: true }),
    supabase
      .from("clients")
      .select("id, business_name, slug, category, is_active, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("scan_events")
      .select("id, created_at, source, clients(business_name)")
      .order("created_at", { ascending: false })
      .limit(6),
    getDailyActivity(supabase, 14),
  ]);

  const dbError = totalRes.error;
  const totalClients = totalRes.count ?? 0;
  const activeClients = activeRes.count ?? 0;
  const inactiveClients = Math.max(totalClients - activeClients, 0);
  const totalScans = scansRes.count ?? 0;
  const totalClicks = clicksRes.count ?? 0;
  const clickRate =
    totalScans > 0 ? Math.round((totalClicks / totalScans) * 100) : 0;

  const recentClients = (recentClientsRes.data ?? []) as RecentClient[];
  const recentScans = (recentScansRes.data ?? []) as unknown as RecentScan[];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-0.5 text-sm text-zinc-400">
            Your review pages at a glance — all numbers are live from your
            database.
          </p>
        </div>
        <Link
          href="/admin/clients"
          className="flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300"
        >
          <Plus className="h-4 w-4" /> Add Client
        </Link>
      </div>

      {dbError && (
        <p className="mt-6 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          Database error: {dbError.message}. If tables are missing, run the
          SQL files from <code>supabase/migrations/</code> in the Supabase SQL
          Editor.
        </p>
      )}

      {/* Stats */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard
          label="Total Clients"
          value={totalClients}
          subtext="Businesses on ReviewFlow"
          icon={Users}
          accentClassName="bg-sky-400/15 text-sky-300"
        />
        <StatsCard
          label="Active Clients"
          value={activeClients}
          subtext="Review pages live"
          icon={UserCheck}
          accentClassName="bg-emerald-400/15 text-emerald-300"
        />
        <StatsCard
          label="Inactive Clients"
          value={inactiveClients}
          subtext="Pages currently paused"
          icon={UserX}
          accentClassName="bg-zinc-400/15 text-zinc-300"
        />
        <StatsCard
          label="Total QR Scans"
          value={totalScans}
          subtext="Review page visits"
          icon={ScanLine}
          accentClassName="bg-amber-400/15 text-amber-300"
        />
        <StatsCard
          label="Google Review Clicks"
          value={totalClicks}
          subtext={
            totalScans > 0
              ? `${clickRate}% of scans clicked`
              : "Button clicks, not submitted reviews"
          }
          icon={MousePointerClick}
          accentClassName="bg-violet-400/15 text-violet-300"
        />
      </div>

      {/* Chart */}
      <div className="mt-4">
        <ScansChart data={activity} />
      </div>

      {/* Recent activity */}
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent Clients</h2>
            <Link
              href="/admin/clients"
              className="text-xs font-medium text-amber-300 hover:text-amber-200"
            >
              View all →
            </Link>
          </div>
          {recentClients.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center">
              <Users className="mb-2 h-6 w-6 text-zinc-600" />
              <p className="text-sm text-zinc-400">No clients yet</p>
              <p className="mt-1 max-w-[240px] text-xs text-zinc-500">
                Client management opens in Phase 3 — M.M. Enterprises will be
                your first client.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/80">
              {recentClients.map((client) => (
                <li key={client.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-sm font-bold text-amber-300">
                    {client.business_name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {client.business_name}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      /review/{client.slug}
                      {client.category ? ` · ${client.category}` : ""}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      client.is_active
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-zinc-700/60 text-zinc-300"
                    }`}
                  >
                    {client.is_active ? "Active" : "Inactive"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold">Recent Scans</h2>
            <Link
              href="/admin/analytics"
              className="text-xs font-medium text-amber-300 hover:text-amber-200"
            >
              Analytics →
            </Link>
          </div>
          {recentScans.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-800 px-4 py-8 text-center">
              <QrCode className="mb-2 h-6 w-6 text-zinc-600" />
              <p className="text-sm text-zinc-400">No scans yet</p>
              <p className="mt-1 max-w-[240px] text-xs text-zinc-500">
                Scans appear here the moment a customer opens a review page
                or scans a QR code.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-zinc-800/80">
              {recentScans.map((scan) => (
                <li key={scan.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-400/15 text-amber-300">
                    <ScanLine className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {scanClientName(scan)}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {scan.source === "qr" ? "QR scan" : "Direct link"} ·{" "}
                      {formatDateTime(scan.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-zinc-500">
                    {timeAgo(scan.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
