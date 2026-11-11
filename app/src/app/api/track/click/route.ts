import { NextResponse, type NextRequest } from "next/server";
import { createPublicClient } from "@/lib/supabase/public";
import { clickTrackSchema } from "@/lib/validations";
import { getIpHash, getUserAgent, isTrackingConfigured } from "@/lib/tracking";

// POST /api/track/click — records ONE click on "Write a Google Review".
// A tracked click means the visitor opened Google's review page.
// It NEVER means a review was submitted — Google shares no such data,
// and ReviewFlow labels it "clicks" everywhere for exactly that reason.
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = clickTrackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });
  }

  if (!isTrackingConfigured()) {
    return NextResponse.json({ ok: false, tracked: false, reason: "not_configured" });
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("log_click_event", {
    p_client_id: parsed.data.client_id,
    p_user_agent: getUserAgent(request),
    p_ip_hash: getIpHash(request),
    p_session_key: parsed.data.session_key,
  });

  if (error) {
    return NextResponse.json({ ok: false, tracked: false, error: "db_error" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, tracked: data === true });
}
