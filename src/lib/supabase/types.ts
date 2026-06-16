import type { BusinessPhotosJson } from "@/lib/google/place-photos";
import type { SiteMetrics } from "@/lib/analytics/types";

export type BatchStatus =
  | "pending"
  | "processing"
  | "complete"
  | "complete_with_errors"
  | "failed"
  | "completed";

export type BatchItemStatus =
  | "pending"
  | "fetching_place_details"
  | "business_data_saved"
  | "generating_site"
  | "complete"
  | "failed"
  | "processing"
  | "completed";

export type Batch = {
  id: string;
  filename: string;
  total_rows: number;
  processed_rows: number;
  status: BatchStatus;
  created_at: string;
};

export type BatchItem = {
  id: string;
  batch_id: string;
  place_id: string;
  business_id: string | null;
  site_id: string | null;
  status: BatchItemStatus;
  error: string | null;
  created_at: string;
};

export type Business = {
  id: string;
  place_id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  google_maps_uri: string | null;
  rating: number | null;
  review_count: number | null;
  hours_json: unknown | null;
  reviews_json: unknown[] | null;
  photos_json: BusinessPhotosJson | null;
  raw_place_json: unknown | null;
  created_at: string;
};

export type BatchItemWithBusiness = BatchItem & {
  business: Pick<
    Business,
    "id" | "name" | "address" | "phone" | "rating" | "photos_json"
  > | null;
  metrics?: SiteMetrics | null;
};
