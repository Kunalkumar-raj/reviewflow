import type { SupabaseClient } from "@supabase/supabase-js";
import { dayKey, dayLabel } from "@/lib/format";
import type { DayActivity } from "@/components/admin/ScansChart";

// Build a zero-filled last-N-days series from raw event timestamps.
export function buildDailySeries(
  scanDates: string[],
  clickDates: string[],
  days = 14
): DayActivity[] {
  const series: DayActivity[] = [];
  const byDay = new Map<string, DayActivity>();

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const entry: DayActivity = { date: dayLabel(d), scans: 0, clicks: 0 };
    byDay.set(dayKey(d), entry);
    series.push(entry);
  }

  for (const iso of scanDates) {
    const entry = byDay.get(dayKey(new Date(iso)));
    if (entry) entry.scans += 1;
  }
  for (const iso of clickDates) {
    const entry = byDay.get(dayKey(new Date(iso)));
    if (entry) entry.clicks += 1;
  }

  return series;
}

export type ActivityRange = "7d" | "30d" | "12m";

// Zero-filled monthly series for the 12-month view.
export function buildMonthlySeries(
  scanDates: string[],
  clickDates: string[],
  months = 12
): DayActivity[] {
  const series: DayActivity[] = [];
  const byMonth = new Map<string, DayActivity>();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry: DayActivity = {
      date: d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" }),
      scans: 0,
      clicks: 0,
    };
    byMonth.set(key, entry);
    series.push(entry);
  }

  const bump = (iso: string, field: "scans" | "clicks") => {
    const d = new Date(iso);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const entry = byMonth.get(key);
    if (entry) entry[field] += 1;
  };
  scanDates.forEach((iso) => bump(iso, "scans"));
  clickDates.forEach((iso) => bump(iso, "clicks"));

  return series;
}

async function fetchEventDates(
  supabase: SupabaseClient,
  since: Date
): Promise<{ scanDates: string[]; clickDates: string[] }> {
  const [scansRes, clicksRes] = await Promise.all([
    supabase
      .from("scan_events")
      .select("created_at")
      .gte("created_at", since.toISOString())
      .limit(20000),
    supabase
      .from("click_events")
      .select("created_at")
      .gte("created_at", since.toISOString())
      .limit(20000),
  ]);
  return {
    scanDates: (scansRes.data ?? []).map((r) => r.created_at as string),
    clickDates: (clicksRes.data ?? []).map((r) => r.created_at as string),
  };
}

export async function getActivityForRange(
  supabase: SupabaseClient,
  range: ActivityRange
): Promise<{ series: DayActivity[]; scansInRange: number; clicksInRange: number }> {
  if (range === "12m") {
    const since = new Date();
    since.setDate(1);
    since.setMonth(since.getMonth() - 11);
    since.setHours(0, 0, 0, 0);
    const { scanDates, clickDates } = await fetchEventDates(supabase, since);
    return {
      series: buildMonthlySeries(scanDates, clickDates, 12),
      scansInRange: scanDates.length,
      clicksInRange: clickDates.length,
    };
  }

  const days = range === "7d" ? 7 : 30;
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));
  const { scanDates, clickDates } = await fetchEventDates(supabase, since);
  return {
    series: buildDailySeries(scanDates, clickDates, days),
    scansInRange: scanDates.length,
    clicksInRange: clickDates.length,
  };
}

export async function getDailyActivity(
  supabase: SupabaseClient,
  days = 14
): Promise<DayActivity[]> {
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const [scansRes, clicksRes] = await Promise.all([
    supabase
      .from("scan_events")
      .select("created_at")
      .gte("created_at", since.toISOString())
      .limit(10000),
    supabase
      .from("click_events")
      .select("created_at")
      .gte("created_at", since.toISOString())
      .limit(10000),
  ]);

  const scanDates = (scansRes.data ?? []).map((r) => r.created_at as string);
  const clickDates = (clicksRes.data ?? []).map((r) => r.created_at as string);
  return buildDailySeries(scanDates, clickDates, days);
}
