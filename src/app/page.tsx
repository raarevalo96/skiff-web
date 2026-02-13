"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { DashboardSection } from "../features/admin/components/DashboardSection";
import { LiveListingsSection } from "../features/admin/components/LiveListingsSection";
import { LoginView } from "../features/admin/components/LoginView";
import { ModerationSection } from "../features/admin/components/ModerationSection";
import { PreviewDrawer } from "../features/admin/components/PreviewDrawer";
import { SidebarItem } from "../features/admin/components/Primitives";
import { ReviewDetailModal } from "../features/admin/components/ReviewDetailModal";
import {
  ActivityFilters,
  AdminSection,
  ApiError,
  ListingPreviewResponse,
  LiveListing,
  ModerationAction,
  ModerationActionResponse,
  ModerationTab,
  PaginatedResponse,
  PaginationMeta,
  ReviewDetailItem,
  ReviewQueue,
  User,
} from "../features/admin/types";
import { sectionTitle } from "../features/admin/utils";

const tokenStorageKey = "skiff_admin_token";
const defaultActivityFilters: ActivityFilters = {
  action: "",
  targetType: "",
  listingId: "",
};
const defaultMeta: PaginationMeta = {
  current_page: 1,
  last_page: 1,
  per_page: 20,
  total: 0,
};

export default function AdminHomePage() {
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);

  const [selectedSection, setSelectedSection] = useState<AdminSection>("dashboard");
  const [moderationTab, setModerationTab] = useState<ModerationTab>("queue");

  const [queue, setQueue] = useState<ReviewQueue>({ listing_revisions: [], insurances: [] });
  const [activities, setActivities] = useState<ModerationAction[]>([]);
  const [activityMeta, setActivityMeta] = useState<PaginationMeta>(defaultMeta);
  const [activityFilters, setActivityFilters] = useState<ActivityFilters>(defaultActivityFilters);

  const [liveListings, setLiveListings] = useState<LiveListing[]>([]);
  const [liveListingsMeta, setLiveListingsMeta] = useState<PaginationMeta>(defaultMeta);

  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<ListingPreviewResponse["data"] | null>(null);
  const [previewOrigin, setPreviewOrigin] = useState<"moderation" | "live_listings" | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isQueueLoading, setIsQueueLoading] = useState(false);
  const [isActivityLoading, setIsActivityLoading] = useState(false);
  const [isLiveListingsLoading, setIsLiveListingsLoading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [actionKeyLoading, setActionKeyLoading] = useState<string | null>(null);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<ReviewDetailItem | null>(null);

  const hasToken = token.trim().length > 0;

  const totalPending = useMemo(
    () => queue.listing_revisions.length + queue.insurances.length,
    [queue.insurances.length, queue.listing_revisions.length]
  );

  const hasActivityFilters = useMemo(
    () =>
      activityFilters.action.length > 0 ||
      activityFilters.targetType.length > 0 ||
      activityFilters.listingId.trim().length > 0,
    [activityFilters]
  );

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

  const buildModerationActionPath = useCallback((page: number, filters: ActivityFilters) => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("per_page", "20");

    if (filters.action) {
      params.set("action", filters.action);
    }
    if (filters.targetType) {
      params.set("target_type", filters.targetType);
    }
    if (filters.listingId.trim().length > 0) {
      params.set("listing_id", filters.listingId.trim());
    }

    return `/v1/admin/moderation-actions?${params.toString()}`;
  }, []);

  const loadModerationQueue = useCallback(async () => {
    if (!hasToken) {
      setQueue({ listing_revisions: [], insurances: [] });
      return;
    }

    setIsQueueLoading(true);
    try {
      const reviews = await request<{ data: ReviewQueue }>("/v1/admin/reviews", { method: "GET" });
      setQueue(reviews.data);
    } finally {
      setIsQueueLoading(false);
    }
  }, [hasToken, request]);

  const loadModerationActions = useCallback(
    async (page = 1, filters = activityFilters) => {
      if (!hasToken) {
        setActivities([]);
        return;
      }

      setIsActivityLoading(true);
      try {
        const response = await request<ModerationActionResponse>(buildModerationActionPath(page, filters), {
          method: "GET",
        });
        setActivities(response.data);
        setActivityMeta(response.meta);
      } finally {
        setIsActivityLoading(false);
      }
    },
    [activityFilters, buildModerationActionPath, hasToken, request]
  );

  const loadLiveListings = useCallback(
    async (page = 1) => {
      setIsLiveListingsLoading(true);
      try {
        const response = await request<PaginatedResponse<LiveListing>>(
          `/v1/listings?page=${page}&sort=newest`,
          { method: "GET" }
        );
        setLiveListings(response.data);
        setLiveListingsMeta(response.meta ?? defaultMeta);
      } finally {
        setIsLiveListingsLoading(false);
      }
    },
    [request]
  );

  const loadPreview = useCallback(
    async (kind: "listing" | "revision", id: number, origin: "moderation" | "live_listings") => {
      setIsPreviewLoading(true);
      try {
        const path =
          kind === "listing" ? `/v1/admin/listings/${id}/preview` : `/v1/admin/listing-revisions/${id}/preview`;
        const response = await request<ListingPreviewResponse>(path, { method: "GET" });
        setPreviewData(response.data);
        setPreviewOrigin(origin);
        setIsPreviewOpen(true);
      } finally {
        setIsPreviewLoading(false);
      }
    },
    [request]
  );

  const loadProfileAndData = useCallback(async () => {
    if (!hasToken) {
      setUser(null);
      setQueue({ listing_revisions: [], insurances: [] });
      setActivities([]);
      setLiveListings([]);
      return;
    }

    setErrorMessage(null);
    try {
      const me = await request<{ user: User }>("/v1/auth/me", { method: "GET" });
      if (!me.user.roles.includes("admin")) {
        throw new Error("This account is not an admin.");
      }
      setUser(me.user);

      await Promise.all([
        loadModerationQueue(),
        loadModerationActions(1, activityFilters),
        loadLiveListings(1),
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load admin data.";
      setErrorMessage(message);
      setUser(null);
    } finally {
      setIsAuthLoading(false);
    }
  }, [hasToken, request, loadModerationQueue, loadModerationActions, loadLiveListings, activityFilters]);

  useEffect(() => {
    const stored = window.localStorage.getItem(tokenStorageKey) ?? "";
    setToken(stored);
    setIsAuthLoading(false);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setQueue({ listing_revisions: [], insurances: [] });
      setActivities([]);
      setLiveListings([]);
      return;
    }

    window.localStorage.setItem(tokenStorageKey, token);
    void loadProfileAndData();
  }, [token, loadProfileAndData]);

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
    setActivities([]);
    setLiveListings([]);
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
      await Promise.all([loadModerationQueue(), loadModerationActions(1, activityFilters)]);
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
      await Promise.all([loadModerationQueue(), loadModerationActions(1, activityFilters)]);
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
      await Promise.all([loadModerationQueue(), loadModerationActions(1, activityFilters)]);
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
      await Promise.all([loadModerationQueue(), loadModerationActions(1, activityFilters)]);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Could not reject insurance.");
    } finally {
      setActionKeyLoading(null);
    }
  }

  async function refreshCurrentSection() {
    if (selectedSection === "dashboard") {
      await Promise.all([
        loadModerationQueue(),
        loadModerationActions(1, activityFilters),
        loadLiveListings(1),
      ]);
      return;
    }

    if (selectedSection === "moderation") {
      if (moderationTab === "queue") {
        await loadModerationQueue();
      } else {
        await loadModerationActions(activityMeta.current_page, activityFilters);
      }
      return;
    }

    await loadLiveListings(liveListingsMeta.current_page);
  }

  function openReviewDetails(kind: "listing_revision" | "insurance", id: number) {
    if (kind === "listing_revision") {
      const item = queue.listing_revisions.find((review) => review.id === id);
      if (item) {
        setSelectedReview({ kind, item });
      }
      return;
    }

    const item = queue.insurances.find((review) => review.id === id);
    if (item) {
      setSelectedReview({ kind, item });
    }
  }

  function handleModerationTabChange(nextTab: ModerationTab) {
    setModerationTab(nextTab);
    if (nextTab === "activity" && activities.length === 0) {
      void loadModerationActions(1, activityFilters);
    }
  }

  function clearActivityFiltersAndReload() {
    setActivityFilters(defaultActivityFilters);
    void loadModerationActions(1, defaultActivityFilters);
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
      <LoginView
        email={email}
        password={password}
        isLoginLoading={isLoginLoading}
        errorMessage={errorMessage}
        onEmailChange={setEmail}
        onPasswordChange={setPassword}
        onSubmit={onLoginSubmit}
        onUseSeededAdmin={() => {
          setEmail("admin@skiff.test");
          setPassword("password");
        }}
      />
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 p-4 text-slate-900 md:p-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 md:flex-row">
        <aside className="rounded-3xl bg-white p-4 shadow-sm md:w-72 md:p-5">
          <p className="text-sm uppercase tracking-wide text-slate-500">SKIFF Admin</p>
          <h1 className="mt-1 text-2xl font-semibold">Control Center</h1>

          <nav className="mt-5 space-y-2">
            <SidebarItem
              label="Dashboard"
              selected={selectedSection === "dashboard"}
              onClick={() => setSelectedSection("dashboard")}
            />
            <SidebarItem
              label="Moderation"
              selected={selectedSection === "moderation"}
              onClick={() => setSelectedSection("moderation")}
              badge={totalPending > 0 ? String(totalPending) : undefined}
            />
            <SidebarItem
              label="Live Listings"
              selected={selectedSection === "live_listings"}
              onClick={() => setSelectedSection("live_listings")}
              badge={liveListingsMeta.total > 0 ? String(liveListingsMeta.total) : undefined}
            />
          </nav>

          <div className="mt-6 rounded-2xl bg-slate-50 p-3">
            <p className="text-xs uppercase tracking-wide text-slate-500">Signed in</p>
            <p className="mt-1 font-medium text-slate-900">{user.name}</p>
            <p className="text-xs text-slate-500">{user.email}</p>
          </div>

          <button
            onClick={() => void logout()}
            className="mt-4 w-full rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Logout
          </button>
        </aside>

        <section className="flex-1 space-y-4">
          <header className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500">Section</p>
                <h2 className="text-2xl font-semibold">{sectionTitle(selectedSection)}</h2>
              </div>
              <button
                onClick={() => void refreshCurrentSection()}
                disabled={isQueueLoading || isActivityLoading || isLiveListingsLoading}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-60"
              >
                {isQueueLoading || isActivityLoading || isLiveListingsLoading ? "Refreshing…" : "Refresh"}
              </button>
            </div>
          </header>

          {errorMessage && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
          )}

          {selectedSection === "dashboard" && (
            <DashboardSection queue={queue} activities={activities} liveListingsMeta={liveListingsMeta} />
          )}

          {selectedSection === "moderation" && (
            <ModerationSection
              moderationTab={moderationTab}
              onTabChange={handleModerationTabChange}
              queue={queue}
              reviewNotes={reviewNotes}
              onReviewNotesChange={(key, value) =>
                setReviewNotes((prev) => ({
                  ...prev,
                  [key]: value,
                }))
              }
              actionKeyLoading={actionKeyLoading}
              onApproveRevision={(revisionId) => void approveRevision(revisionId)}
              onRequestChanges={(revisionId) => void requestChanges(revisionId)}
              onVerifyInsurance={(listingId, insuranceId) => void verifyInsurance(listingId, insuranceId)}
              onRejectInsurance={(listingId, insuranceId) => void rejectInsurance(listingId, insuranceId)}
              onOpenReviewDetails={openReviewDetails}
              onOpenPreviewFromRevision={(revisionId) => void loadPreview("revision", revisionId, "moderation")}
              onOpenPreviewFromListing={(listingId) => void loadPreview("listing", listingId, "moderation")}
              activities={activities}
              isActivityLoading={isActivityLoading}
              activityFilters={activityFilters}
              onActivityFiltersChange={setActivityFilters}
              onClearActivityFilters={clearActivityFiltersAndReload}
              hasActivityFilters={hasActivityFilters}
              onLoadActivity={(page, filters) => void loadModerationActions(page, filters)}
              activityMeta={activityMeta}
            />
          )}

          {selectedSection === "live_listings" && (
            <LiveListingsSection
              listings={liveListings}
              meta={liveListingsMeta}
              isLoading={isLiveListingsLoading}
              onPreview={(listingId) => void loadPreview("listing", listingId, "live_listings")}
              onPrevPage={() => void loadLiveListings(Math.max(1, liveListingsMeta.current_page - 1))}
              onNextPage={() =>
                void loadLiveListings(Math.min(liveListingsMeta.last_page, liveListingsMeta.current_page + 1))
              }
            />
          )}
        </section>
      </div>

      <ReviewDetailModal selectedReview={selectedReview} onClose={() => setSelectedReview(null)} />

      <PreviewDrawer
        isOpen={isPreviewOpen}
        isLoading={isPreviewLoading}
        origin={previewOrigin}
        data={previewData}
        onClose={() => setIsPreviewOpen(false)}
      />
    </main>
  );
}
