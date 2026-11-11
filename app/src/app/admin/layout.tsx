import { Suspense } from "react";
import { AdminShell, AdminShellFallback } from "@/components/admin/AdminShell";

// Next.js 16 Cache Components fix (canonical, per the official
// "Authentication with Cache Components" guide):
//
// 1. `instant = false` must be set on the LAYOUT itself, not only on the
//    pages. A layout is its own segment: page-level flags do not stop the
//    layout from being validated/prerendered, which is exactly where the
//    "unstable value Date.now() while prerendering" error came from
//    (AdminLayout -> Supabase _loadSession -> Date.now()).
//
// 2. The session is NEVER read at the layout's top level. The auth check
//    lives in <AdminShell>, behind a <Suspense> boundary, with
//    connection() + a 'use cache: private' session read inside it.
export const instant = false;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Suspense fallback={<AdminShellFallback />}>
        <AdminShell>{children}</AdminShell>
      </Suspense>
    </div>
  );
}
