import { ModerationAction, NotificationHealthResponse, PaginationMeta, ReviewQueue } from "../types";
import { formatDate, humanizeAction } from "../utils";
import { MetricCard } from "./Primitives";

type DashboardSectionProps = {
  queue: ReviewQueue;
  activities: ModerationAction[];
  liveListingsMeta: PaginationMeta;
  notificationHealth: NotificationHealthResponse["data"] | null;
};

export function DashboardSection({
  queue,
  activities,
  liveListingsMeta,
  notificationHealth,
}: DashboardSectionProps) {
  const totalPending = queue.listing_revisions.length + queue.insurances.length;
  const attempts = notificationHealth?.metrics.attempted ?? 0;
  const delivered = notificationHealth?.metrics.success ?? 0;
  const deliveryRate = attempts > 0 ? Math.round((delivered / attempts) * 100) : 0;
  const missingConfig = notificationHealth?.apns.missing ?? [];
  const failedJobsCount = notificationHealth?.observability.failed_jobs.count ?? 0;
  const recentFailedJobs = notificationHealth?.observability.failed_jobs.recent ?? [];
  const recentDeliveryFailures = notificationHealth?.observability.recent_delivery_failures ?? [];

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Pending reviews" value={totalPending} />
        <MetricCard label="Listing revisions" value={queue.listing_revisions.length} />
        <MetricCard label="Insurance reviews" value={queue.insurances.length} />
        <MetricCard label="Live listings" value={liveListingsMeta.total} />
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold">Push notifications</h3>
        <p className="mt-1 text-sm text-slate-500">APNs health snapshot from API + queue metrics.</p>

        {!notificationHealth && (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-500">
            Notification health is unavailable.
          </p>
        )}

        {notificationHealth && (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <MetricCard label="Attempted" value={attempts} />
              <MetricCard label="Delivered" value={delivered} />
              <MetricCard label="Delivery rate (%)" value={deliveryRate} />
              <MetricCard label="Tokens pruned" value={notificationHealth.metrics.token_pruned} />
            </div>

            <article className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-800">APNs</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    notificationHealth.apns.configured
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  {notificationHealth.apns.configured ? "Configured" : "Needs setup"}
                </span>
                {!notificationHealth.apns.enabled && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                    Disabled
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-slate-600">
                Topic: {notificationHealth.apns.topic ?? "Not set"} • Env: {notificationHealth.apns.environment}
              </p>
              {missingConfig.length > 0 && (
                <p className="mt-2 text-sm text-amber-700">Missing: {missingConfig.join(", ")}</p>
              )}
            </article>

            <article className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">Queue policy</p>
              <p className="mt-2 text-sm text-slate-600">
                Connection: {notificationHealth.queue.connection} • Queue: {notificationHealth.queue.name}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Retries: {notificationHealth.queue.tries} • Backoff: {notificationHealth.queue.backoff.join(", ")}s
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Failures: {notificationHealth.metrics.retryable_failure} retryable,{" "}
                {notificationHealth.metrics.permanent_failure} permanent
              </p>
            </article>

            <article className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">Failed queue jobs</p>
              <p className="mt-2 text-sm text-slate-600">
                {failedJobsCount} failed on notifications queue
                {notificationHealth.observability.failed_jobs.last_failed_at
                  ? ` • Last: ${formatDate(notificationHealth.observability.failed_jobs.last_failed_at)}`
                  : ""}
              </p>
              <div className="mt-2 space-y-2">
                {recentFailedJobs.length === 0 && (
                  <p className="text-sm text-slate-500">No failed queue jobs recorded.</p>
                )}
                {recentFailedJobs.map((job) => (
                  <p key={job.id} className="text-sm text-slate-600">
                    #{job.id} • {formatDate(job.failed_at)} • {job.summary}
                  </p>
                ))}
              </div>
            </article>

            <article className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm font-semibold text-slate-800">Recent push delivery failures</p>
              <div className="mt-2 space-y-2">
                {recentDeliveryFailures.length === 0 && (
                  <p className="text-sm text-slate-500">No recent push delivery failures.</p>
                )}
                {recentDeliveryFailures.map((failure) => (
                  <p key={failure.id} className="text-sm text-slate-600">
                    {formatDate(failure.attempted_at)} • thread #{failure.thread_id ?? "?"} •{" "}
                    {failure.reason ?? "unknown"} ({failure.status_code ?? "n/a"})
                  </p>
                ))}
              </div>
            </article>
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold">Recent moderation activity</h3>
        <p className="mt-1 text-sm text-slate-500">Latest decisions by internal admins.</p>
        <div className="mt-4 space-y-3">
          {activities.slice(0, 5).length === 0 && (
            <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
              No activity logged yet.
            </p>
          )}
          {activities.slice(0, 5).map((item) => (
            <article key={item.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-semibold">{humanizeAction(item.action)}</h4>
                <span className="text-xs text-slate-500">#{item.id}</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {item.listing?.title ?? `Listing #${item.listing_id}`} • {formatDate(item.created_at)}
              </p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
