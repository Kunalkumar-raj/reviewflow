"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Pencil, Power, Trash2 } from "lucide-react";
import { deleteClient, toggleClientStatus } from "@/actions/clients";

interface ClientRowActionsProps {
  clientId: string;
  businessName: string;
  isActive: boolean;
}

export function ClientRowActions({
  clientId,
  businessName,
  isActive,
}: ClientRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) => {
    setError(null);
    startTransition(async () => {
      const result = await fn();
      if (!result.ok) {
        setError(result.error ?? "Something went wrong.");
      } else {
        router.refresh();
      }
    });
  };

  return (
    <div className="flex items-center gap-1.5">
      <Link
        href={`/admin/clients/${clientId}/edit`}
        title="Edit client"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-300 transition hover:bg-zinc-700 hover:text-white"
      >
        <Pencil className="h-3.5 w-3.5" />
      </Link>
      <button
        type="button"
        disabled={isPending}
        title={isActive ? "Deactivate (hide public page)" : "Activate"}
        onClick={() => run(() => toggleClientStatus(clientId, isActive))}
        className={`flex h-8 w-8 items-center justify-center rounded-lg transition disabled:opacity-50 ${
          isActive
            ? "bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25"
            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
        }`}
      >
        {isPending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Power className="h-3.5 w-3.5" />
        )}
      </button>
      <button
        type="button"
        disabled={isPending}
        title="Delete client"
        onClick={() => {
          const confirmed = window.confirm(
            `Delete "${businessName}" permanently?\n\nThis will also delete its scan history, click history and feedback. This cannot be undone.`
          );
          if (confirmed) run(() => deleteClient(clientId));
        }}
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-300 transition hover:bg-red-500/20 disabled:opacity-50"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {error && (
        <span className="ml-1 max-w-[180px] text-[11px] leading-tight text-red-300">
          {error}
        </span>
      )}
    </div>
  );
}
