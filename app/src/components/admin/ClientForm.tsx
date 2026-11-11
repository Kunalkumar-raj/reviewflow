"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { Building2, ImagePlus, Loader2, Sparkles } from "lucide-react";
import type { ClientFormState } from "@/actions/clients";
import { slugify } from "@/lib/slug";
import { MM_ENTERPRISES_PREFILL } from "@/lib/first-client";

export interface ClientFormValues {
  business_name: string;
  slug: string;
  owner_name: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  website: string;
  google_review_url: string;
  welcome_message: string;
  is_active: boolean;
  logo_url?: string | null;
}

const EMPTY_VALUES: ClientFormValues = {
  business_name: "",
  slug: "",
  owner_name: "",
  email: "",
  phone: "",
  address: "",
  category: "",
  website: "",
  google_review_url: "",
  welcome_message: "Thank you for visiting us! Your feedback helps us grow.",
  is_active: true,
  logo_url: null,
};

type FormAction = (
  prevState: ClientFormState,
  formData: FormData
) => Promise<ClientFormState>;

interface ClientFormProps {
  action: FormAction;
  initialValues?: Partial<ClientFormValues>;
  submitLabel: string;
  showPrefill?: boolean;
}

const inputClass =
  "w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400";
const labelClass = "mb-1 block text-sm font-medium text-zinc-300";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-xs text-red-300">{message}</p>;
}

export function ClientForm({
  action,
  initialValues,
  submitLabel,
  showPrefill = false,
}: ClientFormProps) {
  const [state, formAction, isPending] = useActionState(action, {});
  const [values, setValues] = useState<ClientFormValues>({
    ...EMPTY_VALUES,
    ...initialValues,
  });
  const [slugTouched, setSlugTouched] = useState(
    Boolean(initialValues?.slug)
  );
  const [logoPreview, setLogoPreview] = useState<string | null>(
    initialValues?.logo_url ?? null
  );

  const set = (key: keyof ClientFormValues, value: string | boolean) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      // Keep the slug following the business name until the admin edits it.
      if (key === "business_name" && !slugTouched) {
        next.slug = slugify(String(value));
      }
      return next;
    });
  };

  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      {showPrefill && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-amber-400/5 px-5 py-4">
          <p className="text-sm text-zinc-300">
            <strong className="text-white">Testing?</strong> Fill the whole
            form with the prepared M.M. Enterprises details in one click, then
            just press Save.
          </p>
          <button
            type="button"
            onClick={() => {
              setValues({ ...MM_ENTERPRISES_PREFILL, logo_url: null });
              setSlugTouched(true);
            }}
            className="flex shrink-0 items-center gap-2 rounded-lg bg-amber-400 px-3.5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300"
          >
            <Sparkles className="h-4 w-4" /> Fill M.M. Enterprises
          </button>
        </div>
      )}

      {state.error && (
        <p className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {state.error}
        </p>
      )}

      {/* Business details */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-semibold">
          <Building2 className="h-4 w-4 text-amber-300" /> Business Details
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="business_name" className={labelClass}>
              Business name *
            </label>
            <input
              id="business_name"
              name="business_name"
              required
              value={values.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              placeholder="M.M. Enterprises"
              className={inputClass}
            />
            <FieldError message={errors.business_name} />
          </div>
          <div>
            <label htmlFor="slug" className={labelClass}>
              URL slug *
            </label>
            <input
              id="slug"
              name="slug"
              required
              value={values.slug}
              onChange={(e) => {
                setSlugTouched(true);
                set("slug", e.target.value);
              }}
              placeholder="mm-enterprises"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Public page: /review/{values.slug || "your-slug"}
            </p>
            <FieldError message={errors.slug} />
          </div>
          <div>
            <label htmlFor="owner_name" className={labelClass}>
              Owner name
            </label>
            <input
              id="owner_name"
              name="owner_name"
              value={values.owner_name}
              onChange={(e) => set("owner_name", e.target.value)}
              className={inputClass}
            />
            <FieldError message={errors.owner_name} />
          </div>
          <div>
            <label htmlFor="category" className={labelClass}>
              Business category
            </label>
            <input
              id="category"
              name="category"
              value={values.category}
              onChange={(e) => set("category", e.target.value)}
              placeholder="Water treatment supplier"
              className={inputClass}
            />
            <FieldError message={errors.category} />
          </div>
          <div>
            <label htmlFor="email" className={labelClass}>
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={values.email}
              onChange={(e) => set("email", e.target.value)}
              className={inputClass}
            />
            <FieldError message={errors.email} />
          </div>
          <div>
            <label htmlFor="phone" className={labelClass}>
              Phone number
            </label>
            <input
              id="phone"
              name="phone"
              value={values.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 ..."
              className={inputClass}
            />
            <FieldError message={errors.phone} />
          </div>
          <div>
            <label htmlFor="website" className={labelClass}>
              Website
            </label>
            <input
              id="website"
              name="website"
              value={values.website}
              onChange={(e) => set("website", e.target.value)}
              placeholder="https://example.com"
              className={inputClass}
            />
            <FieldError message={errors.website} />
          </div>
          <div>
            <label htmlFor="address" className={labelClass}>
              Business address
            </label>
            <input
              id="address"
              name="address"
              value={values.address}
              onChange={(e) => set("address", e.target.value)}
              className={inputClass}
            />
            <FieldError message={errors.address} />
          </div>
        </div>
      </section>

      {/* Review setup */}
      <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 p-5 sm:p-6">
        <h2 className="mb-4 font-semibold">Review Setup</h2>
        <div className="space-y-4">
          <div>
            <label htmlFor="google_review_url" className={labelClass}>
              Google review URL *
            </label>
            <input
              id="google_review_url"
              name="google_review_url"
              required
              value={values.google_review_url}
              onChange={(e) => set("google_review_url", e.target.value)}
              placeholder="https://g.page/r/.../review"
              className={inputClass}
            />
            <p className="mt-1 text-xs text-zinc-500">
              Copy it from the business&apos;s Google Business Profile →
              Ask for reviews. It must start with https://
            </p>
            <FieldError message={errors.google_review_url} />
          </div>
          <div>
            <label htmlFor="welcome_message" className={labelClass}>
              Welcome message (shown on the public review page) *
            </label>
            <textarea
              id="welcome_message"
              name="welcome_message"
              required
              rows={2}
              maxLength={300}
              value={values.welcome_message}
              onChange={(e) => set("welcome_message", e.target.value)}
              className={inputClass}
            />
            <FieldError message={errors.welcome_message} />
          </div>
          <div>
            <label htmlFor="logo" className={labelClass}>
              Business logo (PNG, JPG, WEBP or SVG, max 2 MB)
            </label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoPreview}
                  alt="Logo preview"
                  className="h-14 w-14 rounded-xl border border-zinc-700 bg-white object-contain p-1"
                />
              ) : (
                <span className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-zinc-700 text-zinc-500">
                  <ImagePlus className="h-5 w-5" />
                </span>
              )}
              <input
                id="logo"
                name="logo"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  setLogoPreview(
                    file ? URL.createObjectURL(file) : (initialValues?.logo_url ?? null)
                  );
                }}
                className="text-sm text-zinc-400 file:mr-3 file:rounded-lg file:border-0 file:bg-zinc-800 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700"
              />
            </div>
            <FieldError message={errors.logo} />
          </div>
          <label className="flex cursor-pointer items-center gap-3 text-sm text-zinc-200">
            <input
              type="checkbox"
              name="is_active"
              checked={values.is_active}
              onChange={(e) => set("is_active", e.target.checked)}
              className="h-4 w-4 rounded accent-amber-400"
            />
            Client is active (public review page is live)
          </label>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="flex items-center gap-2 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-semibold text-zinc-950 shadow-lg shadow-amber-400/20 transition hover:bg-amber-300 disabled:opacity-60"
        >
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          {isPending ? "Saving..." : submitLabel}
        </button>
        <Link
          href="/admin/clients"
          className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-zinc-800"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
