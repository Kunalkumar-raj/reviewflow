"use client";

import { ExternalLink, Star } from "lucide-react";
import { getSessionKey, sendTrackingBeacon } from "./tracking-client";

interface GoogleReviewButtonProps {
  clientId: string;
  googleReviewUrl: string;
}

// The Google review button, with click tracking.
//
// Policy rules baked into this component:
// - It is a plain link to Google, rendered for EVERY visitor, always.
// - Tracking is fire-and-forget: it never delays, blocks, or changes
//   where the link goes, and it records a CLICK — never a "review".
export function GoogleReviewButton({
  clientId,
  googleReviewUrl,
}: GoogleReviewButtonProps) {
  const trackClick = () => {
    sendTrackingBeacon("/api/track/click", {
      client_id: clientId,
      session_key: getSessionKey(),
    });
  };

  return (
    <a
      href={googleReviewUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackClick}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-5 py-3.5 text-base font-bold text-zinc-950 shadow-lg shadow-amber-400/30 transition hover:bg-amber-300"
    >
      <Star className="h-5 w-5" fill="currentColor" />
      Write a Google Review
      <ExternalLink className="h-4 w-4 opacity-60" />
    </a>
  );
}
