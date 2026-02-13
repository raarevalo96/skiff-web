import { LiveListing, PaginationMeta } from "../types";
import { displayStatus, formatCents } from "../utils";

type LiveListingsSectionProps = {
  listings: LiveListing[];
  meta: PaginationMeta;
  isLoading: boolean;
  onPreview: (listingId: number) => void;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function LiveListingsSection({
  listings,
  meta,
  isLoading,
  onPreview,
  onPrevPage,
  onNextPage,
}: LiveListingsSectionProps) {
  return (
    <section className="rounded-3xl bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold">Live listings</h3>
      <p className="mt-1 text-sm text-slate-500">Renter-visible active inventory.</p>

      <div className="mt-4 space-y-3">
        {listings.length === 0 && !isLoading && (
          <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
            No live listings found.
          </p>
        )}

        {listings.map((listing) => {
          const resolvedLocation =
            listing.location ??
            ([listing.city, listing.state].filter(Boolean).join(", ") || "Unknown location");

          return (
            <article key={listing.id} className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="font-semibold">{listing.title ?? `Listing #${listing.id}`}</h4>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                  {displayStatus(listing.status ?? "active")}
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-500">
                ID: {listing.id} • {resolvedLocation}
              </p>
              <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-4">
                <div>
                  <span className="text-slate-500">Price:</span>{" "}
                  <span className="font-medium">{formatCents(listing.price_per_day_cents)}</span>
                </div>
                <div>
                  <span className="text-slate-500">Guests:</span>{" "}
                  <span className="font-medium">{listing.max_guests ?? "n/a"}</span>
                </div>
                <div>
                  <span className="text-slate-500">Type:</span>{" "}
                  <span className="font-medium">{listing.boat_type ?? "n/a"}</span>
                </div>
                <div>
                  <span className="text-slate-500">Length:</span>{" "}
                  <span className="font-medium">
                    {listing.boat_length_ft ? `${listing.boat_length_ft} ft` : "n/a"}
                  </span>
                </div>
              </div>
              <button
                onClick={() => onPreview(listing.id)}
                className="mt-3 rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Preview listing
              </button>
            </article>
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Page {meta.current_page} of {meta.last_page} • {meta.total} total
        </p>
        <div className="flex gap-2">
          <button
            onClick={onPrevPage}
            disabled={isLoading || meta.current_page <= 1}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={onNextPage}
            disabled={isLoading || meta.current_page >= meta.last_page}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </section>
  );
}
