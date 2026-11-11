// QR URL helpers — the single source of truth for what a QR encodes.
//
// A client's QR ALWAYS encodes:  {SITE_URL}/review/{slug}?src=qr
// - "?src=qr" lets Phase 6 analytics tell QR visits apart from direct links.
// - The URL is derived from the slug, so two businesses can never share a QR.
// - Regenerating a QR does NOT change this URL (the slug doesn't change),
//   which means old printed copies keep working forever.

export function getSiteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");
}

export function reviewPageUrl(slug: string, siteUrl = getSiteUrl()): string {
  return `${siteUrl}/review/${slug}`;
}

export function qrTargetUrl(slug: string, siteUrl = getSiteUrl()): string {
  return `${reviewPageUrl(slug, siteUrl)}?src=qr`;
}
