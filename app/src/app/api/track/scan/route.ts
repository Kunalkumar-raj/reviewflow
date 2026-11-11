import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { scanTrackSchema } from "@/lib/validations";
import { getIpHash, getUserAgent, isTrackingConfigured } from "@/lib/tracking";

// POST /api/track/scan — records ONE review-page visit.
// The real dedupe + abuse checks live in the database function
// log_scan_event (migration 005), not in trusting the browser.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = scanTrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  if (!isTrackingConfigured()) {
    return NextResponse.json({ ok: false, tracked: false, reason: "not_configured" });
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("log_scan_event", {
    p_client_id: parsed.data.client_id,
    p_source: parsed.data.source,
    p_user_agent: getUserAgent(request),
    p_ip_hash: getIpHash(request),
    p_session_key: parsed.data.session_key,
  });

  if (error) {
    return NextResponse.json({ ok: false, tracked: false, error: "db_error" }, { status: 500 });
  }

  // data === true only when a row was actually inserted.
  return NextResponse.json({ ok: true, tracked: data === true });
}
