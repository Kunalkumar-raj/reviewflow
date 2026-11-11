import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/slug";

export const loginSchema = z.object({
  email: z.string().trim().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// Empty optional fields arrive as "" from the form — turn them into null
// so the database stays clean.
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null));

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v && v.length > 0 ? v : null))
  .refine((v) => v === null || /^https?:\/\/.+/i.test(v), {
    message: "Website must start with http:// or https://",
  });

export const clientFormSchema = z.object({
  business_name: z
    .string()
    .trim()
    .min(2, "Business name is required (min 2 characters)")
    .max(120, "Business name is too long"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(2, "Slug is too short")
    .max(80)
    .regex(
      SLUG_PATTERN,
      "Slug can only use small letters, numbers and hyphens (e.g. mm-enterprises)"
    ),
  owner_name: optionalText(120),
  email: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null))
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
      message: "Please enter a valid email address",
    }),
  phone: optionalText(30),
  address: optionalText(300),
  category: optionalText(80),
  website: optionalUrl,
  google_review_url: z
    .string()
    .trim()
    .min(1, "Google review URL is required")
    .refine((v) => /^https:\/\/.+/i.test(v), {
      message: "Google review URL must start with https://",
    }),
  welcome_message: z
    .string()
    .trim()
    .min(1, "Welcome message cannot be empty")
    .max(300, "Welcome message is too long (max 300 characters)"),
  is_active: z.boolean(),
});

export type ClientFormInput = z.infer<typeof clientFormSchema>;

// Neutral public feedback. NOTE: there is deliberately NO rating field —
// asking for a rating and then deciding who sees the Google button would
// be review gating, which Google prohibits and ReviewFlow never does.
export const feedbackSchema = z.object({
  client_id: z.string().uuid("Invalid business"),
  name: z
    .string()
    .trim()
    .max(80)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : null)),
  message: z
    .string()
    .trim()
    .min(3, "Please write a few words (min 3 characters)")
    .max(2000, "Feedback is too long (max 2000 characters)"),
});

// Analytics tracking payloads (Phase 6).
export const scanTrackSchema = z.object({
  client_id: z.string().uuid(),
  session_key: z.string().min(8).max(100),
  source: z.enum(["qr", "direct_link", "unknown"]).optional().default("unknown"),
});

export const clickTrackSchema = z.object({
  client_id: z.string().uuid(),
  session_key: z.string().min(8).max(100),
});

export const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2 MB — matches the storage bucket limit
export const ALLOWED_LOGO_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};
