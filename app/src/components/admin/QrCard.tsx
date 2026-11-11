"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import {
  Check,
  Copy,
  Download,
  Loader2,
  Printer,
  RefreshCw,
} from "lucide-react";
import { regenerateQrCode } from "@/actions/qr";

export interface QrCardClient {
  id: string;
  business_name: string;
  slug: string;
  logo_url: string | null;
  is_active: boolean;
  qr_version: number;
  last_qr_generated_at: string | null;
}

interface QrCardProps {
  client: QrCardClient;
  targetUrl: string; // full URL the QR encodes, computed on the server
}

export function QrCard({ client, targetUrl }: QrCardProps) {
  const router = useRouter();
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [qrError, setQrError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [regenError, setRegenError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Generate the QR image in the browser from the exact target URL.
  // qr_version is part of the effect deps so Regenerate redraws it too.
  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(targetUrl, {
      width: 1024,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#18181b", light: "#ffffff" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrError("Could not generate the QR image.");
      });
    return () => {
      cancelled = true;
    };
  }, [targetUrl, client.qr_version]);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard can be blocked (permissions/insecure context) — fall back
      // to selecting via a temporary textarea.
      const ta = document.createElement("textarea");
      ta.value = targetUrl;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const regenerate = () => {
    setRegenError(null);
    startTransition(async () => {
      const result = await regenerateQrCode(client.id);
      if (!result.ok) {
        setRegenError(result.error ?? "Regenerate failed.");
      } else {
        router.refresh();
      }
    });
  };

  const btnClass =
    "flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition disabled:opacity-50";

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5">
      <div className="flex items-start gap-3">
        {client.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={client.logo_url}
            alt=""
            className="h-11 w-11 rounded-xl border border-zinc-700 bg-white object-contain p-0.5"
          />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-800 text-base font-bold text-amber-300">
            {client.business_name.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-white">
            {client.business_name}
          </p>
          <p className="truncate text-xs text-zinc-500">/review/{client.slug}</p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
            client.is_active
              ? "bg-emerald-400/15 text-emerald-300"
              : "bg-zinc-700/60 text-zinc-300"
          }`}
        >
          {client.is_active ? "Active" : "Inactive"}
        </span>
      </div>

      <div className="mt-4 flex justify-center rounded-2xl bg-white p-4">
        {qrError ? (
          <p className="py-10 text-center text-sm text-red-600">{qrError}</p>
        ) : qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt={`QR code for ${client.business_name}`}
            className="h-44 w-44"
          />
        ) : (
          <span className="flex h-44 w-44 items-center justify-center text-zinc-400">
            <Loader2 className="h-6 w-6 animate-spin" />
          </span>
        )}
      </div>

      <p className="mt-3 break-all text-center text-[11px] leading-relaxed text-zinc-500">
        {targetUrl}
      </p>
      <p className="mt-1 text-center text-[11px] text-zinc-600">
        QR version {client.qr_version}
        {client.last_qr_generated_at
          ? ` · regenerated ${new Date(client.last_qr_generated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
          : ""}
      </p>
      {!client.is_active && (
        <p className="mt-2 rounded-lg border border-amber-400/25 bg-amber-400/5 px-3 py-2 text-center text-[11px] text-amber-200/80">
          This client is inactive — scans will land on the “not available”
          page until you reactivate it.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        {qrDataUrl ? (
          <a
            href={qrDataUrl}
            download={`${client.slug}-qr.png`}
            className={`${btnClass} bg-amber-400 font-semibold text-zinc-950 hover:bg-amber-300`}
          >
            <Download className="h-4 w-4" /> PNG
          </a>
        ) : (
          <span className={`${btnClass} bg-zinc-800 text-zinc-500`}>
            <Download className="h-4 w-4" /> PNG
          </span>
        )}
        <Link
          href={`/admin/qr-codes/${client.id}/print`}
          className={`${btnClass} bg-zinc-800 text-zinc-100 hover:bg-zinc-700`}
        >
          <Printer className="h-4 w-4" /> Print / PDF
        </Link>
        <button
          type="button"
          onClick={copyUrl}
          className={`${btnClass} bg-zinc-800 text-zinc-100 hover:bg-zinc-700`}
        >
          {copied ? (
            <Check className="h-4 w-4 text-emerald-300" />
          ) : (
            <Copy className="h-4 w-4" />
          )}
          {copied ? "Copied!" : "Copy URL"}
        </button>
        <button
          type="button"
          onClick={regenerate}
          disabled={isPending}
          className={`${btnClass} bg-zinc-800 text-zinc-100 hover:bg-zinc-700`}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Regenerate
        </button>
      </div>
      {regenError && (
        <p className="mt-2 text-center text-xs text-red-300">{regenError}</p>
      )}
    </div>
  );
}
