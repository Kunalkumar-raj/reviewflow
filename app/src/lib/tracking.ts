import { createHash } from "crypto";
import type { NextRequest } from "next/server";

// Privacy-first request facts for tracking:
// - The raw IP address is NEVER stored. Only a SHA-256 hash of it is kept,
//   which is enough for the database abuse cap and nothing more.
// - User-Agent is truncated by the database function (300 chars).

export function getIpHash(request: NextRequest): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    null;

  if (!ip) return null;
  return createHash("sha256").update(ip).digest("hex");
}

export function getUserAgent(request: NextRequest): string {
  return request.headers.get("user-agent") ?? "";
}

export function isTrackingConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(url && !url.includes("placeholder"));
}
