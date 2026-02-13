import { FormEvent } from "react";
import { AuthFeature } from "./Primitives";

type LoginViewProps = {
  email: string;
  password: string;
  isLoginLoading: boolean;
  errorMessage: string | null;
  onEmailChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onUseSeededAdmin: () => void;
};

export function LoginView({
  email,
  password,
  isLoginLoading,
  errorMessage,
  onEmailChange,
  onPasswordChange,
  onSubmit,
  onUseSeededAdmin,
}: LoginViewProps) {
  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-8">
      <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1.2fr_1fr]">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-300 via-orange-200 to-rose-200 p-8 shadow-sm md:p-10">
          <div className="absolute -top-20 -right-16 h-64 w-64 rounded-full bg-white/25 blur-2xl" />
          <div className="absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-orange-400/20 blur-2xl" />
          <div className="relative">
            <p className="inline-flex rounded-full bg-white/45 px-3 py-1 text-xs font-semibold tracking-wide text-slate-700">
              SKIFF Internal
            </p>
            <h1 className="mt-4 text-4xl font-semibold leading-tight text-slate-900 md:text-5xl">
              Admin Review Console
            </h1>
            <p className="mt-4 max-w-xl text-slate-700">
              Moderate listing revisions, verify insurance submissions, and keep marketplace quality high.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <AuthFeature label="Review Queue" value="Listings + Insurance" />
              <AuthFeature label="Activity Logs" value="Full audit trail" />
              <AuthFeature label="Live Inventory" value="Renter-visible listings" />
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-2 text-sm text-slate-500">
            Use an account with the <code>admin</code> role.
          </p>

          <button
            type="button"
            onClick={onUseSeededAdmin}
            className="mt-4 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Use seeded local admin
          </button>

          <form onSubmit={onSubmit} className="mt-5 space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-orange-300 transition focus:ring"
                placeholder="admin@skiff.com"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-slate-700">Password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none ring-orange-300 transition focus:ring"
                placeholder="••••••••"
              />
            </label>
            <button
              type="submit"
              disabled={isLoginLoading}
              className="w-full rounded-xl bg-slate-900 px-4 py-2.5 font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoginLoading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          {errorMessage && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
          )}
        </section>
      </div>
    </main>
  );
}
