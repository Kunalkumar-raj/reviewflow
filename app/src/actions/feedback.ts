"use server";

import { createPublicClient } from "@/lib/supabase/public";
import { feedbackSchema } from "@/lib/validations";

export interface FeedbackState {
  success?: string;
  error?: string;
}

// Public feedback submission. Runs at request time (Server Action POST),
// inserts through the anon client — the database RLS policy only allows
// inserts for ACTIVE clients, and only the Super Admin can ever read them.
export async function submitFeedback(
  _prevState: FeedbackState,
  formData: FormData
): Promise<FeedbackState> {
  const parsed = feedbackSchema.safeParse({
    client_id: formData.get("client_id"),
    name: formData.get("name") ?? "",
    message: formData.get("message") ?? "",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid feedback" };
  }

  const supabase = createPublicClient();
  const { error } = await supabase.from("feedback").insert(parsed.data);

  if (error) {
    return {
      error:
        "Sorry, your feedback could not be sent right now. Please try again in a moment.",
    };
  }

  return {
    success:
      "Thank you! Your feedback has been shared directly with the business.",
  };
}
