"use client";

import { useEffect } from "react";
import { getSessionKey, sendTrackingBeacon } from "./tracking-client";

interface ScanTrackerProps {
  clientId: string;
  source: "qr" | "direct_link";
}

const DEDUPE_MS = 30 * 60 * 1000; // matches the database function's window

// Records the page visit exactly once per browser session per client
// within 30 minutes. Refreshing the page does NOT inflate the count:
// a sessionStorage timestamp is checked first, and the database function
// dedupes again server-side even if storage was cleared.
export function ScanTracker({ clientId, source }: ScanTrackerProps) {
  useEffect(() => {
    const storageKey = `reviewflow-scan-${clientId}`;
    try {
      const last = Number(window.sessionStorage.getItem(storageKey) ?? 0);
      if (last && Date.now() - last < DEDUPE_MS) return;
      window.sessionStorage.setItem(storageKey, String(Date.now()));
    } catch {
      // Storage unavailable — the server-side dedupe still protects counts.
    }

    sendTrackingBeacon("/api/track/scan", {
      client_id: clientId,
      session_key: getSessionKey(),
      source,
    });
  }, [clientId, source]);

  return null;
}
