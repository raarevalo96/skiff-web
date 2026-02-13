"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type User = {
  id: number;
  name: string;
  email: string;
  roles: string[];
};

type ListingRevisionReview = {
  id: number;
  type: "listing_revision";
  listing_id: number;
  listing_title: string | null;
  submitted_at: string | null;
  submitted_by: {
    id: number;
    name: string;
    email: string;
  } | null;
};

type InsuranceReview = {
  id: number;
  type: "insurance";
  listing_id: number;
  listing_title: string | null;
  submitted_at: string | null;
  verification_status: string;
};

type ReviewQueue = {
  listing_revisions: ListingRevisionReview[];
  insurances: InsuranceReview[];
};

type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
};

const tokenStorageKey = "skiff_admin_token";

export default function AdminHomePage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [queue, setQueue] = useState<ReviewQueue>({ listing_revisions: [], insurances: [] });
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [actionKeyLoading, setActionKeyLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const hasToken = token.trim().length > 0;

  const request = useCallback(
    async <T,>(path: string, init?: RequestInit): Promise<T> => {
      const headers = new Headers(init?.headers ?? {});
      headers.set("Content-Type", "application/json");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(`/api/skiff${path}`, {
        ...init,
        headers,
      });

      if (response.status === 204) {
        return undefined as T;
      }

      const text = await response.text();
      const data = text ? (JSON.parse(text) as T & ApiError) : ({} as T & ApiError);

      if (!response.ok) {
        const message = data?.error?.message ?? data?.message ?? "Request failed.";
        throw new Error(message);
      }

      return data as T;
    },
    [token]
  );

  const loadProfileAndQueue = useCallback(async () => {
    if (!hasToken) {
      setUser(null);
      setQueue({ listing_revisions: [], insurances: [] });
      return;
    }

    setErrorMessage(null);
    setIsQueueLoading(true);
    try {
      const me = await request<{ user: User }>("/v1/auth/me", { method: "GET" });
      if (!me.user.roles.includes("admin")) {
        throw new Error("This account is not an admin.");
      }
      setUser(me.user);

      const reviews = await request<{ data: ReviewQueue }>("/v1/admin/reviews", { method: "GET" });
      setQueue(reviews.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load admin data.";
      setErrorMessage(message);
      setUser(null);
    } finally {
      setIsQueueLoading(false);
      setIsAuthLoading(false);
    }
  }, [hasToken, request]);

  useEffect(() => {
    const stored = window.localStorage.getItem(tokenStorageKey) ?? "";
    setToken(stored);
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setQueue({ listing_revisions: [], insurances: [] });
      return;
    }

    window.localStorage.setItem(tokenStorageKey, token);
    void loadProfileAndQueue();
  }, [token, loadProfileAndQueue]);

  const totalPending = useMemo(
    () => queue.listing_revisions.length + queue.insurances.length,
    [queue.insurances.length, queue.listing_revisions.length]
  );

  async function onLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsLoginLoading(true);

    try {
      const result = await request<{ token: string; user: User }>("/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          device_name: "admin-web",
        }),
      });

      if (!result.user.roles.includes("admin")) {
        throw new Error("This account is not an admin.");
      }

      setToken(result.token);
      setUser(result.user);
      setPassword("");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to sign in.";
      setErrorMessage(message);
    } finally {
      setIsLoginLoading(false);
    }
  }

  async function logout() {
    try {
      await request<void>("/v1/auth/logout", { method: "POST" });
    } catch {
      // Ignore logout failures when clearing local session.
    }

    window.localStorage.removeItem(tokenStorageKey);
    setToken("");
    setUser(null);
    setQueue({ listing_revisions: [], insurances: [] });
    setErrorMessage(null);
  }

  async function approveRevision(revisionId: number) {
    const actionKey = `approve-revision-${revisionId}`;
    setActionKeyLoading(actionKey);
    setErrorMessage(null);
    try {
      await request(`/v1/admin/listing-revisions/${revisionId}/approve`, {
        method: "POST",
        body: JSON.stringify({
          review_notes: reviewNotes[`rev-${revisionId}`] || undefined,
        }),
      });
      await loadProfileAndQueue();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not approve revision.");
    } finally {
      setActionKeyLoading(null);
    }
  }

  async function requestChanges(revisionId: number) {
    const notes = reviewNotes[`rev-${revisionId}`]?.trim();
    if (!notes) {
      setErrorMessage("Review notes are required to request changes.");
      return;
    }

    const actionKey = `reject-revision-${revisionId}`;
    setActionKeyLoading(actionKey);
    setErrorMessage(null);
    try {
      await request(`/v1/admin/listing-revisions/${revisionId}/request-changes`, {
        method: "POST",
        body: JSON.stringify({ review_notes: notes }),
      });
      await loadProfileAndQueue();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not request changes.");
    } finally {
      setActionKeyLoading(null);
    }
  }

  async function verifyInsurance(listingId: number, insuranceId: number) {
    const actionKey = `verify-insurance-${insuranceId}`;
    setActionKeyLoading(actionKey);
    setErrorMessage(null);
    try {
      await request(`/v1/admin/listings/${listingId}/insurance/verify`, {
        method: "POST",
        body: JSON.stringify({
          review_notes: reviewNotes[`ins-${insuranceId}`] || undefined,
        }),
      });
      await loadProfileAndQueue();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not verify insurance.");
    } finally {
      setActionKeyLoading(null);
    }
  }

  async function rejectInsurance(listingId: number, insuranceId: number) {
    const notes = reviewNotes[`ins-${insuranceId}`]?.trim();
    if (!notes) {
      setErrorMessage("Review notes are required to reject insurance.");
      return;
    }

    const actionKey = `reject-insurance-${insuranceId}`;
    setActionKeyLoading(actionKey);
    setErrorMessage(null);
    try {
      await request(`/v1/admin/listings/${listingId}/insurance/reject`, {
        method: "POST",
        body: JSON.stringify({ review_notes: notes }),
      });
      await loadProfileAndQueue();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not reject insurance.");
    } finally {
      setActionKeyLoading(null);
    }
  }

  if (isAuthLoading) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
        <div className="mx-auto max-w-5xl">Loading admin…</div>
      </main>
    );
  }

  if (!hasToken || !user) {
    return (
      <main className="min-h-screen bg-slate-100 px-6 py-10 text-slate-900">
        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-[1.15fr_1fr]">
          <section className="rounded-3xl bg-gradient-to-br from-amber-300 via-orange-200 to-rose-200 p-8 shadow-sm">
            <p className="text-sm uppercase tracking-wide text-slate-700/80">SKIFF</p>
            <h1 className="mt-2 text-4xl font-semibold text-slate-900">Admin Review Console</h1>
            <p className="mt-4 max-w-md text-slate-700">
              Review listing revisions, verify insurance, and keep publish quality controls consistent.
            </p>
          </section>

          <section className="rounded-3xl bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold">Sign in</h2>
            <p className="mt-2 text-sm text-slate-500">Use an account with the <code>admin</code> role.</p>
            <form onSubmit={onLoginSubmit} className="mt-6 space-y-4">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-orange-300 transition focus:ring"
                  placeholder="admin@skiff.com"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-slate-700">Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 outline-none ring-orange-300 transition focus:ring"
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

  return (
    <main className="min-h-screen bg-slate-100 px-6 py-8 text-slate-900">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="rounded-3xl bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-wide text-slate-500">SKIFF Admin</p>
              <h1 className="text-3xl font-semibold">Review Queue</h1>
              <p className="mt-1 text-sm text-slate-500">
                Signed in as {user.name} ({user.email})
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => void loadProfileAndQueue()}
                disabled={isQueueLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
              >
                {isQueueLoading ? "Refreshing…" : "Refresh"}
              </button>
              <button
                onClick={() => void logout()}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard label="Total pending" value={totalPending} />
          <MetricCard label="Listing revisions" value={queue.listing_revisions.length} />
          <MetricCard label="Insurance reviews" value={queue.insurances.length} />
        </section>

        {errorMessage && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
        )}

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Listing revisions</h2>
          <p className="mt-1 text-sm text-slate-500">Approve to move listing to <code>approved</code>, or request changes with notes.</p>
          <div className="mt-4 space-y-4">
            {queue.listing_revisions.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No listing revisions pending.
              </p>
            )}
            {queue.listing_revisions.map((item) => {
              const noteKey = `rev-${item.id}`;
              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{item.listing_title ?? `Listing #${item.listing_id}`}</h3>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">Revision #{item.id}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Listing ID: {item.listing_id} • Submitted: {formatDate(item.submitted_at)} • By: {item.submitted_by?.name ?? "Unknown"}
                  </p>

                  <textarea
                    value={reviewNotes[noteKey] ?? ""}
                    onChange={(event) =>
                      setReviewNotes((prev) => ({
                        ...prev,
                        [noteKey]: event.target.value,
                      }))
                    }
                    className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-300 transition focus:ring"
                    placeholder="Optional for approve, required for request changes."
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => void approveRevision(item.id)}
                      disabled={actionKeyLoading === `approve-revision-${item.id}`}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                    >
                      {actionKeyLoading === `approve-revision-${item.id}` ? "Approving…" : "Approve"}
                    </button>
                    <button
                      onClick={() => void requestChanges(item.id)}
                      disabled={actionKeyLoading === `reject-revision-${item.id}`}
                      className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-60"
                    >
                      {actionKeyLoading === `reject-revision-${item.id}` ? "Sending…" : "Request changes"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold">Insurance reviews</h2>
          <p className="mt-1 text-sm text-slate-500">Verify or reject policy submissions. Rejection requires review notes.</p>
          <div className="mt-4 space-y-4">
            {queue.insurances.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No insurance reviews pending.
              </p>
            )}
            {queue.insurances.map((item) => {
              const noteKey = `ins-${item.id}`;
              return (
                <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold">{item.listing_title ?? `Listing #${item.listing_id}`}</h3>
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">Insurance #{item.id}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Listing ID: {item.listing_id} • Submitted: {formatDate(item.submitted_at)}
                  </p>

                  <textarea
                    value={reviewNotes[noteKey] ?? ""}
                    onChange={(event) =>
                      setReviewNotes((prev) => ({
                        ...prev,
                        [noteKey]: event.target.value,
                      }))
                    }
                    className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-300 transition focus:ring"
                    placeholder="Optional for verify, required for reject."
                  />

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => void verifyInsurance(item.listing_id, item.id)}
                      disabled={actionKeyLoading === `verify-insurance-${item.id}`}
                      className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                    >
                      {actionKeyLoading === `verify-insurance-${item.id}` ? "Verifying…" : "Verify insurance"}
                    </button>
                    <button
                      onClick={() => void rejectInsurance(item.listing_id, item.id)}
                      disabled={actionKeyLoading === `reject-insurance-${item.id}`}
                      className="rounded-lg bg-amber-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:opacity-60"
                    >
                      {actionKeyLoading === `reject-insurance-${item.id}` ? "Rejecting…" : "Reject insurance"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function formatDate(value: string | null): string {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
