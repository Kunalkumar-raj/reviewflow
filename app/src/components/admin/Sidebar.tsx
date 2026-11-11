"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  QrCode,
  Settings,
  Star,
  Users,
} from "lucide-react";
import { signOut } from "@/actions/auth";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/clients", label: "Clients", icon: Users },
  { href: "/admin/qr-codes", label: "QR Codes", icon: QrCode },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ email }: { email: string }) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-zinc-800/80 bg-zinc-900/60 p-5 lg:flex">
      <div className="mb-8 flex items-center gap-2.5 px-1">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/20">
          <Star className="h-5 w-5" fill="currentColor" />
        </span>
        <div className="leading-tight">
          <p className="text-[15px] font-bold tracking-tight">ReviewFlow</p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
            Super Admin
          </p>
        </div>
      </div>

      <nav className="space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                active
                  ? "bg-amber-400 text-zinc-950 shadow-lg shadow-amber-400/10"
                  : "text-zinc-400 hover:bg-zinc-800/70 hover:text-white"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3 border-t border-zinc-800/80 pt-4">
        <div className="px-1">
          <p className="text-[11px] uppercase tracking-wider text-zinc-500">
            Signed in as
          </p>
          <p className="truncate text-sm font-medium text-zinc-200">{email}</p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 px-3 py-2.5 text-sm font-medium text-zinc-300 transition hover:border-zinc-700 hover:bg-zinc-800/70 hover:text-white"
          >
            <LogOut className="h-[18px] w-[18px]" /> Logout
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileNav() {
  const pathname = usePathname();

  return (
    <div className="border-b border-zinc-800/80 bg-zinc-900/60 lg:hidden">
      <div className="flex items-center gap-2 overflow-x-auto px-4 py-3">
        <span className="mr-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-400 text-zinc-950">
          <Star className="h-4 w-4" fill="currentColor" />
        </span>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium transition ${
                active
                  ? "bg-amber-400 text-zinc-950"
                  : "bg-zinc-800/70 text-zinc-300"
              }`}
            >
              <Icon className="h-3.5 w-3.5" /> {item.label}
            </Link>
          );
        })}
        <form action={signOut} className="shrink-0">
          <button
            type="submit"
            className="flex items-center gap-1.5 rounded-full bg-zinc-800/70 px-3 py-1.5 text-[13px] font-medium text-zinc-300"
          >
            <LogOut className="h-3.5 w-3.5" /> Logout
          </button>
        </form>
      </div>
    </div>
  );
}
