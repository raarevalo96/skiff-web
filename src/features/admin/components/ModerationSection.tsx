import {
  ActivityFilters,
  ModerationAction,
  ModerationTab,
  PaginationMeta,
  ReviewQueue,
} from "../types";
import { formatDate, humanizeAction } from "../utils";

type ModerationSectionProps = {
  moderationTab: ModerationTab;
  onTabChange: (tab: ModerationTab) => void;
  queue: ReviewQueue;
  reviewNotes: Record<string, string>;
  onReviewNotesChange: (key: string, value: string) => void;
  actionKeyLoading: string | null;
  onApproveRevision: (revisionId: number) => void;
  onRequestChanges: (revisionId: number) => void;
  onVerifyInsurance: (listingId: number, insuranceId: number) => void;
  onRejectInsurance: (listingId: number, insuranceId: number) => void;
  onOpenReviewDetails: (type: "listing_revision" | "insurance", index: number) => void;
  onOpenPreviewFromRevision: (revisionId: number) => void;
  onOpenPreviewFromListing: (listingId: number) => void;
  activities: ModerationAction[];
  isActivityLoading: boolean;
  activityFilters: ActivityFilters;
  onActivityFiltersChange: (next: ActivityFilters) => void;
  onClearActivityFilters: () => void;
  hasActivityFilters: boolean;
  onLoadActivity: (page?: number, filters?: ActivityFilters) => void;
  activityMeta: PaginationMeta;
};

export function ModerationSection({
  moderationTab,
  onTabChange,
  queue,
  reviewNotes,
  onReviewNotesChange,
  actionKeyLoading,
  onApproveRevision,
  onRequestChanges,
  onVerifyInsurance,
  onRejectInsurance,
  onOpenReviewDetails,
  onOpenPreviewFromRevision,
  onOpenPreviewFromListing,
  activities,
  isActivityLoading,
  activityFilters,
  onActivityFiltersChange,
  onClearActivityFilters,
  hasActivityFilters,
  onLoadActivity,
  activityMeta,
}: ModerationSectionProps) {
  return (
    <>
      <section className="rounded-3xl bg-white p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onTabChange("queue")}
            className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
              moderationTab === "queue"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Review queue
          </button>
          <button
            onClick={() => onTabChange("activity")}
            className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
              moderationTab === "activity"
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            Activity log
          </button>
        </div>
      </section>

      {moderationTab === "queue" && (
        <>
          <section className="rounded-3xl bg-white p-6 shadow-sm">
            <h3 className="text-xl font-semibold">Listing revisions</h3>
            <p className="mt-1 text-sm text-slate-500">
              Approve to move listing to <code>approved</code>, or request changes with notes.
            </p>
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
                      <h4 className="font-semibold">{item.listing_title ?? `Listing #${item.listing_id}`}</h4>
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                        Revision #{item.id}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Listing ID: {item.listing_id} • Submitted: {formatDate(item.submitted_at)} • By:{" "}
                      {item.submitted_by?.name ?? "Unknown"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => onOpenReviewDetails("listing_revision", item.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        View details
                      </button>
                      <button
                        onClick={() => onOpenPreviewFromRevision(item.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Preview listing
                      </button>
                    </div>

                    <textarea
                      value={reviewNotes[noteKey] ?? ""}
                      onChange={(event) => onReviewNotesChange(noteKey, event.target.value)}
                      className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-300 transition focus:ring"
                      placeholder="Optional for approve, required for request changes."
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => onApproveRevision(item.id)}
                        disabled={actionKeyLoading === `approve-revision-${item.id}`}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {actionKeyLoading === `approve-revision-${item.id}` ? "Approving…" : "Approve"}
                      </button>
                      <button
                        onClick={() => onRequestChanges(item.id)}
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
            <h3 className="text-xl font-semibold">Insurance reviews</h3>
            <p className="mt-1 text-sm text-slate-500">
              Verify or reject policy submissions. Rejection requires review notes.
            </p>
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
                      <h4 className="font-semibold">{item.listing_title ?? `Listing #${item.listing_id}`}</h4>
                      <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700">
                        Insurance #{item.id}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-500">
                      Listing ID: {item.listing_id} • Submitted: {formatDate(item.submitted_at)}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => onOpenReviewDetails("insurance", item.id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        View details
                      </button>
                      <button
                        onClick={() => onOpenPreviewFromListing(item.listing_id)}
                        className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Preview listing
                      </button>
                    </div>

                    <textarea
                      value={reviewNotes[noteKey] ?? ""}
                      onChange={(event) => onReviewNotesChange(noteKey, event.target.value)}
                      className="mt-3 min-h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-orange-300 transition focus:ring"
                      placeholder="Optional for verify, required for reject."
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => onVerifyInsurance(item.listing_id, item.id)}
                        disabled={actionKeyLoading === `verify-insurance-${item.id}`}
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
                      >
                        {actionKeyLoading === `verify-insurance-${item.id}` ? "Verifying…" : "Verify insurance"}
                      </button>
                      <button
                        onClick={() => onRejectInsurance(item.listing_id, item.id)}
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
        </>
      )}

      {moderationTab === "activity" && (
        <section className="rounded-3xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Moderation activity</h3>
          <p className="mt-1 text-sm text-slate-500">
            Immutable audit trail of admin moderation actions.
          </p>

          <div className="mt-4 grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end">
            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Action</span>
              <select
                value={activityFilters.action}
                onChange={(event) =>
                  onActivityFiltersChange({
                    ...activityFilters,
                    action: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-orange-300 transition focus:ring"
              >
                <option value="">All actions</option>
                <option value="listing_revision_approved">Listing approved</option>
                <option value="listing_revision_changes_requested">Listing changes requested</option>
                <option value="insurance_verified">Insurance verified</option>
                <option value="insurance_rejected">Insurance rejected</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Target</span>
              <select
                value={activityFilters.targetType}
                onChange={(event) =>
                  onActivityFiltersChange({
                    ...activityFilters,
                    targetType: event.target.value,
                  })
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-orange-300 transition focus:ring"
              >
                <option value="">All targets</option>
                <option value="listing_revision">Listing revision</option>
                <option value="listing_insurance">Listing insurance</option>
              </select>
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Listing ID</span>
              <input
                type="number"
                min={1}
                value={activityFilters.listingId}
                onChange={(event) =>
                  onActivityFiltersChange({
                    ...activityFilters,
                    listingId: event.target.value,
                  })
                }
                placeholder="Any"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none ring-orange-300 transition focus:ring"
              />
            </label>

            <div className="flex gap-2 md:justify-end">
              <button
                onClick={() => onLoadActivity(1, activityFilters)}
                disabled={isActivityLoading}
                className="rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-60"
              >
                Apply
              </button>
              <button
                onClick={onClearActivityFilters}
                disabled={isActivityLoading || !hasActivityFilters}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {activities.length === 0 && !isActivityLoading && (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No activity logged yet.
              </p>
            )}
            {activities.map((item) => (
              <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-semibold">{humanizeAction(item.action)}</h4>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                    #{item.id}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-500">
                  {item.listing?.title ?? `Listing #${item.listing_id}`} • {formatDate(item.created_at)} • by{" "}
                  {item.admin?.name ?? "Unknown admin"}
                </p>
                <p className="mt-2 text-sm text-slate-700">
                  Status: <span className="font-medium">{item.status_before ?? "n/a"}</span> →{" "}
                  <span className="font-medium">{item.status_after ?? "n/a"}</span>
                </p>
                {item.notes && (
                  <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700">{item.notes}</p>
                )}
              </article>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Page {activityMeta.current_page} of {activityMeta.last_page} • {activityMeta.total} total
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onLoadActivity(Math.max(1, activityMeta.current_page - 1), activityFilters)}
                disabled={isActivityLoading || activityMeta.current_page <= 1}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() =>
                  onLoadActivity(Math.min(activityMeta.last_page, activityMeta.current_page + 1), activityFilters)
                }
                disabled={isActivityLoading || activityMeta.current_page >= activityMeta.last_page}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
