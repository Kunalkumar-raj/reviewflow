import { Settings } from "lucide-react";
import { connection } from "next/server";
import { getAdminProfile } from "@/lib/auth";
import { SectionShell } from "@/components/admin/SectionShell";

export const instant = false;

export default async function SettingsPage() {
  await connection(); // request-time only: never prerender auth reads
  // Shared 'use cache: private' session read (same one the layout uses).
  const profile = await getAdminProfile();

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const rows: Array<[string, string]> = [
    ["Platform", "ReviewFlow"],
    ["Your role", "Super Admin"],
    ["Admin email", profile.email],
    ["Public site URL", siteUrl],
    ["Business model", "Free — no plans, no billing, no payments"],
  ];

  return (
    <SectionShell
      title="Settings"
      description="Your platform and account information."
      phaseNote="Settings is read-only in Phase 2 on purpose — there are no save buttons that pretend to work. Editable settings (app name, default welcome message) will be wired to the database in a later phase if you want them."
      icon={Settings}
    >
      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-800/80 bg-zinc-900/60">
        <dl className="divide-y divide-zinc-800/80">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex flex-wrap items-center justify-between gap-2 px-5 py-4"
            >
              <dt className="text-sm text-zinc-400">{label}</dt>
              <dd className="text-sm font-medium text-white">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 text-sm leading-relaxed text-zinc-400">
        <p className="font-medium text-zinc-200">Good to know</p>
        <ul className="mt-2 list-disc space-y-1.5 pl-5">
          <li>
            To change your admin password or email, use Supabase Dashboard →
            Authentication → Users.
          </li>
          <li>
            The public site URL above decides which domain your QR codes will
            point to. Decide your final domain before printing QR codes in
            Phase 5.
          </li>
          <li>
            ReviewFlow never stores a Supabase service-role key in code. If any
            tutorial asks you to add one to the frontend, do not.
          </li>
        </ul>
      </div>
    </SectionShell>
  );
}
