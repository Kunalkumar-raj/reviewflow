import type { LucideIcon } from "lucide-react";

interface StatsCardProps {
  label: string;
  value: number | string;
  subtext: string;
  icon: LucideIcon;
  accentClassName: string;
}

export function StatsCard({
  label,
  value,
  subtext,
  icon: Icon,
  accentClassName,
}: StatsCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 transition hover:border-zinc-700">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[13px] font-medium text-zinc-400">{label}</p>
          <p className="mt-1.5 text-3xl font-bold tracking-tight text-white">
            {value}
          </p>
          <p className="mt-1.5 text-xs text-zinc-500">{subtext}</p>
        </div>
        <span
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${accentClassName}`}
        >
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  );
}
