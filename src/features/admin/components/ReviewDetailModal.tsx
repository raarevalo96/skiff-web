import { ListingPreview, ReviewDetailItem } from "../types";
import { displayStatus, formatCents, formatDate } from "../utils";
import { DetailField } from "./Primitives";

type ReviewDetailModalProps = {
  selectedReview: ReviewDetailItem | null;
  onClose: () => void;
  revisionComparison: {
    current: ListingPreview;
    proposed: ListingPreview;
  } | null;
  isRevisionComparisonLoading: boolean;
  revisionComparisonError: string | null;
};

type ChangeRow = {
  label: string;
  before: string;
  after: string;
};

const fieldDefinitions: Array<{
  key: keyof ListingPreview;
  label: string;
  formatter?: (value: unknown) => string;
}> = [
  { key: "title", label: "Title" },
  { key: "summary", label: "Summary" },
  { key: "description", label: "Description" },
  { key: "boat_type", label: "Boat Type" },
  {
    key: "boat_length_ft",
    label: "Boat Length",
    formatter: (value) => (typeof value === "number" ? `${value} ft` : "Not set"),
  },
  { key: "status", label: "Status", formatter: (value) => displayStatus(String(value ?? "draft")) },
  { key: "location", label: "Location" },
  { key: "city", label: "City" },
  { key: "state", label: "State" },
  { key: "country", label: "Country" },
  {
    key: "price_per_day_cents",
    label: "Price / Day",
    formatter: (value) => formatCents(typeof value === "number" ? value : null),
  },
  {
    key: "max_guests",
    label: "Max Guests",
    formatter: (value) => (typeof value === "number" ? String(value) : "Not set"),
  },
  { key: "hero_image_url", label: "Hero Image URL" },
  {
    key: "gallery_image_urls",
    label: "Gallery Images",
    formatter: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return "Not set";
      }
      return value.join(", ");
    },
  },
  { key: "video_url", label: "Video URL" },
  {
    key: "amenities",
    label: "Amenities",
    formatter: (value) => {
      if (!Array.isArray(value) || value.length === 0) {
        return "Not set";
      }
      return value
        .map((item) => {
          if (typeof item === "object" && item !== null && "name" in item) {
            return String((item as { name?: string }).name ?? "Unknown");
          }
          return "Unknown";
        })
        .join(", ");
    },
  },
  {
    key: "insurance_status",
    label: "Insurance Status",
    formatter: (value) => displayStatus(String(value ?? "unverified")),
  },
];

function normalizeValue(
  value: unknown,
  formatter?: (value: unknown) => string
): string {
  if (formatter) {
    return formatter(value);
  }
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.length === 0 ? "Not set" : JSON.stringify(value);
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return String(value);
}

function buildRevisionChanges(current: ListingPreview, proposed: ListingPreview): ChangeRow[] {
  return fieldDefinitions
    .map((field) => {
      const before = normalizeValue(current[field.key], field.formatter);
      const after = normalizeValue(proposed[field.key], field.formatter);

      return {
        label: field.label,
        before,
        after,
      };
    })
    .filter((row) => row.before !== row.after);
}

export function ReviewDetailModal({
  selectedReview,
  onClose,
  revisionComparison,
  isRevisionComparisonLoading,
  revisionComparisonError,
}: ReviewDetailModalProps) {
  if (!selectedReview) {
    return null;
  }

  const revisionChanges =
    selectedReview.kind === "listing_revision" && revisionComparison
      ? buildRevisionChanges(revisionComparison.current, revisionComparison.proposed)
      : [];

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
    >
      <section
        className="max-h-[85vh] w-full max-w-3xl overflow-auto rounded-2xl bg-white p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Review detail</p>
            <h3 className="mt-1 text-xl font-semibold">
              {selectedReview.kind === "listing_revision" ? "Listing revision" : "Insurance review"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-600 transition hover:bg-slate-50"
          >
            Close
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <DetailField label="Listing ID" value={String(selectedReview.item.listing_id)} />
          <DetailField
            label={selectedReview.kind === "listing_revision" ? "Revision ID" : "Insurance ID"}
            value={String(selectedReview.item.id)}
          />
          <DetailField label="Listing title" value={selectedReview.item.listing_title ?? "Untitled"} />
          <DetailField label="Submitted at" value={formatDate(selectedReview.item.submitted_at)} />
        </div>

        {selectedReview.kind === "listing_revision" && (
          <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <p>
              <span className="font-medium">Submitted by:</span>{" "}
              {selectedReview.item.submitted_by?.name ?? "Unknown"}
              {selectedReview.item.submitted_by?.email
                ? ` (${selectedReview.item.submitted_by.email})`
                : ""}
            </p>
          </div>
        )}

        {selectedReview.kind === "listing_revision" && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Submitted changes</p>

            {isRevisionComparisonLoading && (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                Loading revision diff…
              </p>
            )}

            {!isRevisionComparisonLoading && revisionComparisonError && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{revisionComparisonError}</p>
            )}

            {!isRevisionComparisonLoading && !revisionComparisonError && revisionChanges.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-sm text-slate-500">
                No field-level changes detected in the submitted revision.
              </p>
            )}

            {!isRevisionComparisonLoading && !revisionComparisonError && revisionChanges.length > 0 && (
              <div className="space-y-3">
                {revisionChanges.map((change) => (
                  <article key={change.label} className="rounded-xl border border-slate-200 p-3">
                    <p className="text-sm font-semibold text-slate-800">{change.label}</p>
                    <div className="mt-2 grid gap-2 md:grid-cols-2">
                      <div className="rounded-lg bg-rose-50 p-2">
                        <p className="text-xs uppercase tracking-wide text-rose-700">Current</p>
                        <p className="mt-1 text-sm text-slate-700 break-words">{change.before}</p>
                      </div>
                      <div className="rounded-lg bg-emerald-50 p-2">
                        <p className="text-xs uppercase tracking-wide text-emerald-700">Submitted</p>
                        <p className="mt-1 text-sm text-slate-700 break-words">{change.after}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        )}

        {selectedReview.kind === "insurance" && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Review payload</p>
            <pre className="overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(selectedReview.item, null, 2)}
            </pre>
          </div>
        )}
      </section>
    </div>
  );
}
