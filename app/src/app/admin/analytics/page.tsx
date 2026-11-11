import Link from "next/link";
import { BarChart3, MousePointerClick, ScanLine } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { connection } from "next/server";
import { SectionShell } from "@/components/admin/SectionShell";
import { StatsCard } from "@/components/admin/StatsCard";
import { ScansChart } from "@/components/admin/ScansChart";
import { getActivityForRange, type ActivityRange } from "@/lib/analytics";

export const instant = false;

interface ClientActivity {
  business_name: string;
  scans: number;
  clicks: number;
}

const RANGE_OPTIONS: Array<{ value: ActivityRange; label: string; chartTitle: string }> = [
  { value: "7d", label: "Last 7 days", chartTitle: "Activity — Last 7 Days" },
  { value: "30d", label: "Last 30 days", chartTitle: "Activity — Last 30 Days" },
  { value: "12m", label: "Last 12 months", chartTitle: "Activity — Last 12 Months" },
];

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  await connection(); // request-time only: never prerender Supabase/auth reads
  const { range: rangeParam } = await searchParams;
  const range: ActivityRange =
    rangeParam === "7d" || rangeParam === "12m" ? rangeParam : "30d";
  const rangeMeta = RANGE_OPTIONS.find((o) => o.value === range)!;
  const supabase = await createClient();

  const [scansRes, clicksRes, rangeActivity, clientsRes, scanEventsRes, clickEventsRes] =
    await Promise.all([
      supabase.from("scan_events").select("*", { count: "exact", head: true }),
      supabase.from("click_events").select("*", { count: "exact", head: true }),
      getActivityForRange(supabase, range),
      supabase.from("clients").select("id, business_name"),
      supabase.from("scan_events").select("client_id").limit(10000),
      supabase.from("click_events").select("client_id").limit(10000),
    ]);

  const totalScans = scansRes.count ?? 0;
  const totalClicks = clicksRes.count ?? 0;
  const { series: activity, scansInRange, clicksInRange } = rangeActivity;
  const clickRate =
    scansInRange > 0 ? Math.round((clicksInRange / scansInRange) * 100) : 0;

  // Per-client totals, counted from real events.
  const scanCounts = new Map<string, number>();
  for (const row of scanEventsRes.data ?? [])
    scanCounts.set(row.client_id, (scanCounts.get(row.client_id) ?? 0) + 1);
  const clickCounts = new Map<string, number>();
  for (const row of clickEventsRes.data ?? [])
    clickCounts.set(row.client_id, (clickCounts.get(row.client_id) ?? 0) + 1);

  const perClient: ClientActivity[] = (clientsRes.data ?? [])
    .map((client) => ({
      business_name: client.business_name as string,
      scans: scanCounts.get(client.id as string) ?? 0,
      clicks: clickCounts.get(client.id as string) ?? 0,
    }))
    .sort((a, b) => b.scans - a.scans);

  return (
    <SectionShell
      title="Analytics"
      description="Scans and review-button clicks across all your clients."
      phaseNote="Tracking is LIVE: every review-page visit and every Google button click is recorded with duplicate protection (a refresh does not count twice). Remember: clicks are not submitted reviews — Google never shares submission data, so always cross-check real reviews in the Google Business Profile dashboard."
      icon={BarChart3}
    >
      {/* Range selector */}
      <div className="mt-6 flex flex-wrap gap-2">
        {RANGE_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={`/admin/analytics?range=${option.value}`}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
              range === option.value
                ? "bg-amber-400 text-zinc-950"
                : "bg-zinc-800/70 text-zinc-300 hover:bg-zinc-800"
            }`}
          >
            {option.label}
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatsCard
          label={`Scans — ${rangeMeta.label}`}
          value={scansInRange}
          subtext={`All-time total: ${totalScans}`}
          icon={ScanLine}
          accentClassName="bg-amber-400/15 text-amber-300"
        />
        <StatsCard
          label={`Review Clicks — ${rangeMeta.label}`}
          value={clicksInRange}
          subtext={`All-time total: ${totalClicks} · clicks, not reviews`}
          icon={MousePointerClick}
          accentClassName="bg-violet-400/15 text-violet-300"
        />
        <StatsCard
          label="Click Rate"
          value={`${clickRate}%`}
          subtext={`Share of scans that clicked (${rangeMeta.label.toLowerCase()})`}
          icon={BarChart3}
          accentClassName="bg-sky-400/15 text-sky-300"
        />
      </div>

      <div className="mt-4">
        <ScansChart data={activity} title={rangeMeta.chartTitle} />
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60">
        <h2 className="border-b border-zinc-800 px-5 py-3.5 font-semibold">
          Client-wise Activity (All-time)
        </h2>
        {perClient.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-zinc-500">
            No clients yet. Per-client scans and clicks will appear here.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-xs uppercase tracking-wide text-zinc-500">
                  <th className="px-5 py-3 font-medium">Business</th>
                  <th className="px-5 py-3 font-medium">Scans</th>
                  <th className="px-5 py-3 font-medium">Review Clicks</th>
                  <th className="px-5 py-3 font-medium">Click Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/80">
                {perClient.map((row) => (
                  <tr key={row.business_name} className="hover:bg-zinc-800/40">
                    <td className="px-5 py-3.5 font-medium text-white">
                      {row.business_name}
                    </td>
                    <td className="px-5 py-3.5 text-zinc-300">{row.scans}</td>
                    <td className="px-5 py-3.5 text-zinc-300">{row.clicks}</td>
                    <td className="px-5 py-3.5 text-zinc-300">
                      {row.scans > 0
                        ? `${Math.round((row.clicks / row.scans) * 100)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SectionShell>
  );
}
