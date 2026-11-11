import Link from "next/link";
import { QrCode, ShieldCheck, Star } from "lucide-react";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 px-4 text-center">
      <span className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-400 text-zinc-950">
        <Star className="h-7 w-7" fill="currentColor" />
      </span>
      <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
        ReviewFlow
      </h1>
      <p className="mt-4 max-w-md text-base text-zinc-400">
        Google review QR pages for local businesses — managed from one simple
        admin dashboard. Scan a business QR code to leave them a Google review.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link
          href="/login"
          className="rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
        >
          Super Admin Login
        </Link>
      </div>
      <div className="mt-12 flex flex-wrap justify-center gap-6 text-xs text-zinc-500">
        <span className="flex items-center gap-1.5">
          <QrCode className="h-4 w-4" /> One QR per business
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="h-4 w-4" /> No fake reviews, ever
        </span>
      </div>
    </main>
  );
}
