import { connection } from "next/server";
import { getAdminProfile } from "@/lib/auth";
import { MobileNav, Sidebar } from "@/components/admin/Sidebar";

// Renders the authenticated admin chrome. This component is rendered
// INSIDE a <Suspense> boundary in the admin layout.
//
// connection() is awaited first: it tells Next.js "prerendering stops
// here — everything below only runs for a real incoming request."
// That is what keeps Supabase's session validation (which internally
// calls Date.now()) out of prerendering entirely.
export async function AdminShell({ children }: { children: React.ReactNode }) {
  await connection();

  // 'use cache: private' session read — redirects to /login when the
  // visitor is not a verified Super Admin.
  const profile = await getAdminProfile();

  return (
    <div className="flex">
      <Sidebar email={profile.email} />
      <div className="min-w-0 flex-1">
        <MobileNav />
        <main className="mx-auto w-full max-w-6xl p-5 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

export function AdminShellFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="animate-pulse text-sm text-zinc-500">
        Loading your dashboard…
      </p>
    </div>
  );
}
