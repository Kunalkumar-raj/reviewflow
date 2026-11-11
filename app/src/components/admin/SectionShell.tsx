import type { LucideIcon } from "lucide-react";

interface SectionShellProps {
  title: string;
  description: string;
  phaseNote: string;
  icon: LucideIcon;
  children?: React.ReactNode;
}

// Shared shell for sections whose full features arrive in a later phase.
// The page is real and navigable today; the note is honest about what
// is still to come instead of showing fake buttons.
export function SectionShell({
  title,
  description,
  phaseNote,
  icon: Icon,
  children,
}: SectionShellProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
      <p className="mt-0.5 text-sm text-zinc-400">{description}</p>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/5 p-5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
          <Icon className="h-5 w-5" />
        </span>
        <p className="text-sm leading-relaxed text-zinc-300">{phaseNote}</p>
      </div>

      {children}
    </div>
  );
}
