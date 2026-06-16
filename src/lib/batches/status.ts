import type { BatchItem, BatchItemStatus } from "@/lib/supabase/types";

export type BatchStatusCounts = {
  total: number;
  pending: number;
  fetching_place_details: number;
  business_data_saved: number;
  generating_site: number;
  complete: number;
  failed: number;
};

const COUNTABLE_STATUSES: BatchItemStatus[] = [
  "pending",
  "fetching_place_details",
  "business_data_saved",
  "generating_site",
  "complete",
  "failed",
];

export function computeBatchStatusCounts(
  items: Array<{ status: string }>,
): BatchStatusCounts {
  const counts: BatchStatusCounts = {
    total: items.length,
    pending: 0,
    fetching_place_details: 0,
    business_data_saved: 0,
    generating_site: 0,
    complete: 0,
    failed: 0,
  };

  for (const item of items) {
    if (isCountableStatus(item.status)) {
      counts[item.status] += 1;
    }
  }

  return counts;
}

export function countTerminalItems(items: Array<{ status: string }>): number {
  return items.filter(
    (item) => item.status === "complete" || item.status === "failed",
  ).length;
}

export function hasEligibleBatchItems(items: Array<{ status: string }>): boolean {
  return items.some(
    (item) => item.status === "pending" || item.status === "business_data_saved",
  );
}

export function isBatchProcessing(items: Array<{ status: string }>): boolean {
  return items.some(
    (item) =>
      item.status === "fetching_place_details" ||
      item.status === "generating_site",
  );
}

function isCountableStatus(status: string): status is keyof Omit<BatchStatusCounts, "total"> {
  return COUNTABLE_STATUSES.includes(status as BatchItemStatus);
}
