import { ReviewDetailItem } from "../types";
import { formatDate } from "../utils";
import { DetailField } from "./Primitives";

type ReviewDetailModalProps = {
  selectedReview: ReviewDetailItem | null;
  onClose: () => void;
};

export function ReviewDetailModal({ selectedReview, onClose }: ReviewDetailModalProps) {
  if (!selectedReview) {
    return null;
  }

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

        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-slate-700">Raw payload</p>
          <pre className="overflow-auto rounded-xl bg-slate-900 p-3 text-xs text-slate-100">
            {JSON.stringify(selectedReview.item, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
