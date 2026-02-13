import { ListingPreviewResponse } from "../types";
import { displayStatus, formatCents, formatDate } from "../utils";
import { DetailField } from "./Primitives";

type PreviewDrawerProps = {
  isOpen: boolean;
  isLoading: boolean;
  origin: "moderation" | "live_listings" | null;
  data: ListingPreviewResponse["data"] | null;
  onClose: () => void;
};

export function PreviewDrawer({ isOpen, isLoading, origin, data, onClose }: PreviewDrawerProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-40 flex bg-slate-900/45"
      onClick={onClose}
    >
      <section
        className="ml-auto h-full w-full max-w-2xl overflow-auto bg-white p-5 shadow-xl sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">
              {origin === "moderation" ? "From Moderation" : "From Live Listings"}
            </p>
            <h3 className="mt-1 text-xl font-semibold">Listing preview</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        {isLoading && (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
            Loading preview…
          </p>
        )}

        {!isLoading && !data && (
          <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
            Select “Preview listing” from moderation or live listings.
          </p>
        )}

        {!isLoading && data && (
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-lg font-semibold">
                  {data.listing.title ?? `Listing #${data.listing.id}`}
                </h4>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                  {data.source === "listing_revision" ? "Revision Preview" : "Current Listing"}
                </span>
              </div>
              {data.revision && (
                <p className="mt-1 text-sm text-slate-500">
                  Revision #{data.revision.id} • Submitted {formatDate(data.revision.submitted_at)}
                </p>
              )}
              <p className="mt-1 text-sm text-slate-500">
                {data.listing.location ??
                  ([data.listing.city, data.listing.state].filter(Boolean).join(", ") || "Unknown location")}
              </p>

              {data.listing.hero_image_url ? (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={data.listing.hero_image_url}
                    alt={data.listing.title ?? "Listing hero"}
                    className="h-64 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                  No hero image available.
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <DetailField label="Status" value={displayStatus(data.listing.status ?? "draft")} />
              <DetailField label="Price/day" value={formatCents(data.listing.price_per_day_cents ?? null)} />
              <DetailField label="Guests" value={String(data.listing.max_guests ?? "n/a")} />
              <DetailField
                label="Length"
                value={data.listing.boat_length_ft ? `${data.listing.boat_length_ft} ft` : "n/a"}
              />
            </div>

            {(data.listing.summary || data.listing.description) && (
              <div className="rounded-2xl border border-slate-200 p-4">
                <h5 className="font-semibold">Description</h5>
                {data.listing.summary && (
                  <p className="mt-2 text-sm text-slate-700">{data.listing.summary}</p>
                )}
                {data.listing.description && (
                  <p className="mt-2 text-sm text-slate-700">{data.listing.description}</p>
                )}
              </div>
            )}

            {data.listing.amenities && data.listing.amenities.length > 0 && (
              <div className="rounded-2xl border border-slate-200 p-4">
                <h5 className="font-semibold">Amenities</h5>
                <div className="mt-3 flex flex-wrap gap-2">
                  {data.listing.amenities.map((amenity) => (
                    <span
                      key={amenity.slug}
                      className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                    >
                      {amenity.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 p-4">
              <h5 className="font-semibold">Insurance</h5>
              <p className="mt-2 text-sm text-slate-700">
                Status: {displayStatus(data.listing.insurance_status ?? "unverified")}
              </p>
              {data.listing.insurance?.provider_name && (
                <p className="mt-1 text-sm text-slate-700">
                  Provider: {data.listing.insurance.provider_name}
                </p>
              )}
              {data.listing.insurance?.coverage_end_date && (
                <p className="mt-1 text-sm text-slate-700">
                  Coverage end: {data.listing.insurance.coverage_end_date}
                </p>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
