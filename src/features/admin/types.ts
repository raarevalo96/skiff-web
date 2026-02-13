export type User = {
  id: number;
  name: string;
  email: string;
  roles: string[];
};

export type ListingRevisionReview = {
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

export type InsuranceReview = {
  id: number;
  type: "insurance";
  listing_id: number;
  listing_title: string | null;
  submitted_at: string | null;
  verification_status: string;
};

export type ReviewQueue = {
  listing_revisions: ListingRevisionReview[];
  insurances: InsuranceReview[];
};

export type ModerationAction = {
  id: number;
  action: string;
  target_type: string;
  target_id: number;
  listing_id: number;
  status_before: string | null;
  status_after: string | null;
  notes: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string | null;
  admin: {
    id: number;
    name: string;
    email: string;
  } | null;
  listing: {
    id: number;
    title: string | null;
    status: string | null;
  } | null;
};

export type PaginationMeta = {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

export type ModerationActionResponse = {
  data: ModerationAction[];
  meta: PaginationMeta;
};

export type LiveListing = {
  id: number;
  title: string | null;
  status: string | null;
  location: string | null;
  city: string | null;
  state: string | null;
  price_per_day_cents: number | null;
  max_guests: number | null;
  boat_type: string | null;
  boat_length_ft: number | null;
  updated_at: string | null;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ReviewDetailItem =
  | { kind: "listing_revision"; item: ListingRevisionReview }
  | { kind: "insurance"; item: InsuranceReview };

export type ApiError = {
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
};

export type ActivityFilters = {
  action: string;
  targetType: string;
  listingId: string;
};

export type ListingPreview = {
  id: number;
  title: string | null;
  summary?: string | null;
  description?: string | null;
  status?: string | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  hero_image_url?: string | null;
  gallery_image_urls?: string[] | null;
  price_per_day_cents?: number | null;
  rating?: number | null;
  review_count?: number | null;
  max_guests?: number | null;
  boat_type?: string | null;
  boat_length_ft?: number | null;
  amenities?: Array<{ name: string; slug: string }> | null;
  insurance_status?: string | null;
  insurance?: {
    provider_name?: string | null;
    policy_number?: string | null;
    coverage_end_date?: string | null;
    verification_status?: string | null;
  } | null;
};

export type ListingPreviewResponse = {
  data: {
    source: "listing" | "listing_revision";
    listing: ListingPreview;
    revision?: {
      id: number;
      status: string;
      submitted_at: string | null;
    };
  };
};

export type AdminSection = "dashboard" | "moderation" | "live_listings";
export type ModerationTab = "queue" | "activity";
