import Link from "next/link";
import { SearchX } from "lucide-react";

export default function GlobalNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-8 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-800 text-zinc-400">
          <SearchX className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-white">
          Page not found
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-400">
          The page you are looking for does not exist or may have moved.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
        >
          Go to Homepage
        </Link>
        <p className="mt-6 text-[11px] text-zinc-500">ReviewFlow</p>
      </div>
    </main>
  );
}
