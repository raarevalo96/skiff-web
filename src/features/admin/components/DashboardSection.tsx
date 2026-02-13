import { ModerationAction, PaginationMeta, ReviewQueue } from "../types";
import { formatDate, humanizeAction } from "../utils";
import { MetricCard } from "./Primitives";

type DashboardSectionProps = {
  queue: ReviewQueue;
  activities: ModerationAction[];
  liveListingsMeta: PaginationMeta;
};

export function DashboardSection({ queue, activities, liveListingsMeta }: DashboardSectionProps) {
  const totalPending = queue.listing_revisions.length + queue.insurances.length;

  return (
    <>
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Pending reviews" value={totalPending} />
        <MetricCard label="Listing revisions" value={queue.listing_revisions.length} />
        <MetricCard label="Insurance reviews" value={queue.insurances.length} />
        <MetricCard label="Live listings" value={liveListingsMeta.total} />
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
