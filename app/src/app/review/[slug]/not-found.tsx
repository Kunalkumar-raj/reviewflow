import { SearchX } from "lucide-react";

export default function ReviewNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 text-center shadow-xl shadow-zinc-200">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400">
          <SearchX className="h-8 w-8" />
        </span>
        <h1 className="mt-4 text-xl font-bold text-zinc-900">
          This review page is not available
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          The business may have moved, or this review page is currently
          paused. Please check the QR code or link and try again, or contact
          the business directly.
        </p>
        <p className="mt-6 text-[11px] text-zinc-400">Powered by ReviewFlow</p>
      </div>
    </main>
  );
}
