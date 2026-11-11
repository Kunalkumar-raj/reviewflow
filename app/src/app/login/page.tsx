"use client";

import { useActionState } from "react";
import { LockKeyhole, Star } from "lucide-react";
import { signIn, type LoginState } from "@/actions/auth";

const initialState: LoginState = {};

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(signIn, initialState);

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-2 text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400 text-zinc-950">
            <Star className="h-5 w-5" fill="currentColor" />
          </span>
          <div>
            <h1 className="text-lg font-semibold leading-tight">ReviewFlow</h1>
            <p className="text-xs text-zinc-400">Super Admin Login</p>
          </div>
        </div>

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-sm text-zinc-300">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm text-zinc-300">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-400"
            />
          </div>

          {state.error && (
            <p className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-300 disabled:opacity-60"
          >
            <LockKeyhole className="h-4 w-4" />
            {isPending ? "Signing in..." : "Sign in to Dashboard"}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-zinc-500">
          This login is only for the platform owner. There is no public sign-up.
        </p>
      </div>
    </main>
  );
}
