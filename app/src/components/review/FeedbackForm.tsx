"use client";

import { useActionState } from "react";
import { CheckCircle2, Loader2, Send } from "lucide-react";
import { submitFeedback, type FeedbackState } from "@/actions/feedback";

const initialState: FeedbackState = {};

// Optional, neutral feedback — shown to EVERY visitor, always below the
// Google review button, and never conditional on any rating or sentiment.
// There is intentionally no star-rating input in this form.
export function FeedbackForm({ clientId }: { clientId: string }) {
  const [state, formAction, isPending] = useActionState(
    submitFeedback,
    initialState
  );

  if (state.success) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm text-emerald-800">{state.success}</p>
      </div>
    );
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";

  return (
    <form action={formAction} className="space-y-3 text-left">
      <input type="hidden" name="client_id" value={clientId} />
      <div>
        <label htmlFor="fb-name" className="mb-1 block text-sm font-medium text-zinc-700">
          Your name <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <input id="fb-name" name="name" maxLength={80} className={inputClass} placeholder="e.g. Rahul Kumar" />
      </div>
      <div>
        <label htmlFor="fb-message" className="mb-1 block text-sm font-medium text-zinc-700">
          Your feedback
        </label>
        <textarea
          id="fb-message"
          name="message"
          required
          rows={3}
          maxLength={2000}
          className={inputClass}
          placeholder="Share your experience with this business..."
        />
      </div>
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-60"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isPending ? "Sending..." : "Send Feedback to the Business"}
      </button>
    </form>
  );
}
