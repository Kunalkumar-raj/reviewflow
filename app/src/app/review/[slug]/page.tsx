import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Globe, Star } from "lucide-react";
import { getPublicClientBySlug } from "@/lib/public-client";
import { FeedbackForm } from "@/components/review/FeedbackForm";
import { GoogleReviewButton } from "@/components/review/GoogleReviewButton";
import { ScanTracker } from "@/components/review/ScanTracker";

interface ReviewPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ src?: string }>;
}

export async function generateMetadata({
  params,
}: ReviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const business = await getPublicClientBySlug(slug);

  if (!business) {
    return {
      title: "Review page not found — ReviewFlow",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: `Review ${business.business_name} on Google — ReviewFlow`,
    description: `Enjoyed your experience with ${business.business_name}? Tap to write them a Google review.`,
    // Review landing pages are for QR visitors — keep them out of search results.
    robots: { index: false, follow: false },
  };
}

// Blocking request-time render: the business lookup finishes before the
// page content renders, so an unknown or deactivated slug shows the
// friendly not-found screen. (With Partial Prerendering the streamed
// shell means the HTTP status stays 200 — a soft-404. That is acceptable
// here: these pages are noindex and exist for QR visitors, not search.)
export const instant = false;

export default async function ReviewPage({
  params,
  searchParams,
}: ReviewPageProps) {
  await connection(); // request-time only — public data is never prerendered
  const { slug } = await params;
  const { src } = await searchParams;
  const business = await getPublicClientBySlug(slug);

  if (!business) {
    notFound();
  }

  // QR codes encode ?src=qr — everything else counts as a direct link.
  const scanSource = src === "qr" ? "qr" : "direct_link";

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 text-center shadow-xl shadow-zinc-200 sm:p-8">
        {/* Logo / initial */}
        {business.logo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={business.logo_url}
            alt={`${business.business_name} logo`}
            className="mx-auto h-20 w-20 rounded-2xl border border-zinc-200 bg-white object-contain p-1.5"
          />
        ) : (
          <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-amber-400 text-3xl font-bold text-zinc-950">
            {business.business_name.charAt(0).toUpperCase()}
          </span>
        )}

        <h1 className="mt-4 text-2xl font-bold tracking-tight text-zinc-900">
          {business.business_name}
        </h1>

        {business.category && (
          <span className="mt-2 inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-600">
            {business.category}
          </span>
        )}

        <div className="mt-3 flex items-center justify-center gap-1 text-amber-400" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-5 w-5" fill="currentColor" strokeWidth={0} />
          ))}
        </div>

        <p className="mt-3 text-[15px] leading-relaxed text-zinc-600">
          {business.welcome_message}
        </p>

        {/* Records this visit (Phase 6) — renders nothing. */}
        <ScanTracker clientId={business.id} source={scanSource} />

        {/* THE Google review button — shown to every visitor, always.
            Its click tracking is fire-and-forget and never changes
            where the link goes or who can see it. */}
        <GoogleReviewButton
          clientId={business.id}
          googleReviewUrl={business.google_review_url}
        />
        <p className="mt-2 text-xs text-zinc-400">
          Opens Google in a new tab — you write and post the review yourself,
          in your own words.
        </p>

        {business.website && (
          <a
            href={business.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
          >
            <Globe className="h-4 w-4" /> Visit our website
          </a>
        )}

        {/* Optional private feedback — additional, never a replacement,
            and never conditional on any rating (there is no rating here). */}
        <div className="my-6 flex items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-zinc-200" />
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
            or
          </span>
          <span className="h-px flex-1 bg-zinc-200" />
        </div>

        <h2 className="text-left text-sm font-semibold text-zinc-800">
          Share feedback directly with {business.business_name}{" "}
          <span className="font-normal text-zinc-400">(optional, private)</span>
        </h2>
        <div className="mt-3">
          <FeedbackForm clientId={business.id} />
        </div>

        <p className="mt-8 border-t border-zinc-100 pt-4 text-[11px] text-zinc-400">
          Powered by ReviewFlow · Reviews are written by customers on Google.
          This page never posts a review for you.
        </p>
      </div>
    </main>
  );
}
