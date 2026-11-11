"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface DayActivity {
  date: string; // e.g. "5 Nov"
  scans: number;
  clicks: number;
}

export function ScansChart({
  data,
  title = "Activity — Last 14 Days",
}: {
  data: DayActivity[];
  title?: string;
}) {
  const hasData = data.some((d) => d.scans > 0 || d.clicks > 0);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="font-semibold text-white">{title}</h2>
        <span className="rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-zinc-400">
          Real data
        </span>
      </div>
      <p className="mb-4 text-xs text-zinc-500">
        QR page scans vs Google review button clicks. A click is not a
        submitted review — Google does not share submission data.
      </p>

      {!hasData ? (
        <div className="flex h-[260px] items-center justify-center rounded-xl border border-dashed border-zinc-800 text-center">
          <p className="max-w-xs px-4 text-sm text-zinc-500">
            No scans yet. Once you add a client in Phase 3 and their QR code is
            scanned, the chart will fill in here automatically.
          </p>
        </div>
      ) : (
        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="scansFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="clicksFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#27272a" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: "#a1a1aa", fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#18181b",
                  border: "1px solid #3f3f46",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                labelStyle={{ color: "#fafafa" }}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="scans" name="QR Scans" stroke="#fbbf24" strokeWidth={2} fill="url(#scansFill)" />
              <Area type="monotone" dataKey="clicks" name="Review Clicks" stroke="#34d399" strokeWidth={2} fill="url(#clicksFill)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
