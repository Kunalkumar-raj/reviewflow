"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { ArrowLeft, Loader2, Printer, Star } from "lucide-react";

interface QrPrintSheetProps {
  businessName: string;
  logoUrl: string | null;
  targetUrl: string;
}

// A clean, print-first sheet for the shop counter / table tent.
// The global print CSS (globals.css) hides everything except #qr-sheet,
// so the admin sidebar and these buttons never reach the paper/PDF.
export function QrPrintSheet({
  businessName,
  logoUrl,
  targetUrl,
}: QrPrintSheetProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    QRCode.toDataURL(targetUrl, {
      width: 1400,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#18181b", light: "#ffffff" },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, [targetUrl]);

  return (
    <div>
      <div className="no-print mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/admin/qr-codes"
          className="flex items-center gap-2 rounded-lg border border-zinc-700 px-3.5 py-2 text-sm text-zinc-200 transition hover:bg-zinc-800"
        >
          <ArrowLeft className="h-4 w-4" /> Back to QR Codes
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
        >
          <Printer className="h-4 w-4" /> Print / Save as PDF
        </button>
        <p className="text-xs text-zinc-500">
          In the print dialog, choose “Save as PDF” for a PDF file, and set
          margins to “None” for the cleanest sheet.
        </p>
      </div>

      {/* ===== The printable sheet ===== */}
      <div
        id="qr-sheet"
        className="mx-auto max-w-[560px] rounded-[28px] bg-white px-8 py-10 text-center text-zinc-900 shadow-2xl"
      >
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={`${businessName} logo`}
            className="mx-auto h-20 w-20 rounded-2xl border border-zinc-200 object-contain p-1.5"
          />
        ) : (
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-400 text-3xl font-bold text-zinc-950">
            {businessName.charAt(0).toUpperCase()}
          </span>
        )}

        <h1 className="mt-4 text-3xl font-bold tracking-tight">
          {businessName}
        </h1>

        <div
          className="mt-3 flex items-center justify-center gap-1 text-amber-400"
          aria-hidden="true"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-6 w-6" fill="currentColor" strokeWidth={0} />
          ))}
        </div>

        <p className="mt-3 text-lg font-semibold">
          Enjoyed your experience?
        </p>
        <p className="mx-auto mt-1 max-w-sm text-[15px] leading-relaxed text-zinc-500">
          Scan this QR code with your phone camera and share your feedback
          with a Google review. It takes less than a minute.
        </p>

        <div className="mx-auto mt-6 w-fit rounded-3xl border-2 border-zinc-900 p-4">
          {qrDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qrDataUrl}
              alt={`QR code for ${businessName}`}
              className="h-64 w-64"
            />
          ) : (
            <span className="flex h-64 w-64 items-center justify-center text-zinc-400">
              <Loader2 className="h-8 w-8 animate-spin" />
            </span>
          )}
        </div>

        <p className="mt-5 text-sm font-bold uppercase tracking-[0.2em]">
          Scan to review us on Google
        </p>
        <p className="mt-2 break-all text-[11px] text-zinc-400">{targetUrl}</p>
        <p className="mt-6 border-t border-zinc-100 pt-4 text-[11px] text-zinc-400">
          Powered by ReviewFlow
        </p>
      </div>
    </div>
  );
}
