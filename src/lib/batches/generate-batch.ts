import { processBatchItemEndToEnd } from "@/lib/batches/process-batch-item";
import { getSiteSummariesBySiteIds } from "@/lib/batches/site-publishing";
import {
  computeBatchStatusCounts,
  countTerminalItems,
} from "@/lib/batches/status";
import {
  getMetricsForSite,
  getSiteMetricsBySiteIds,
  summarizeBatchMetrics,
} from "@/lib/analytics/metrics";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Batch, BatchItem } from "@/lib/supabase/types";

export class BatchGenerateError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "BATCH_GENERATE_ERROR",
  ) {
    super(message);
    this.name = "BatchGenerateError";
  }
}

export type BatchGenerateResult = {
  batchId: string;
  status: string;
  processed: number;
  succeeded: number;
  failed: number;
  skipped: number;
};

export async function generateBatch(
  batchId: string,
): Promise<BatchGenerateResult> {
  const supabase = createAdminClient();

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("*")
    .eq("id", batchId)
    .single<Batch>();

  if (batchError || !batch) {
    throw new BatchGenerateError("Batch not found.", 404, "BATCH_NOT_FOUND");
  }

  if (batch.status === "processing") {
    throw new BatchGenerateError(
      "Batch is already processing.",
      409,
      "BATCH_ALREADY_PROCESSING",
    );
  }

  const { data: allItems, error: allItemsError } = await supabase
    .from("batch_items")
    .select("id, batch_id, place_id, business_id, status")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true })
    .returns<BatchItem[]>();

  if (allItemsError) {
    throw new BatchGenerateError(allItemsError.message);
  }

  const items = allItems ?? [];
  const eligibleItems = items.filter(
    (item) => item.status === "pending" || item.status === "business_data_saved",
  );

  if (eligibleItems.length === 0) {
    throw new BatchGenerateError(
      "No pending or business-data-saved items to process.",
      400,
      "NO_ELIGIBLE_ITEMS",
    );
  }

  const { error: processingError } = await supabase
    .from("batches")
    .update({
      status: "processing",
      processed_rows: countTerminalItems(items),
    })
    .eq("id", batchId);

  if (processingError) {
    throw new BatchGenerateError(processingError.message);
  }

  let succeeded = 0;
  let failed = 0;

  for (const item of eligibleItems) {
    const result = await processBatchItemEndToEnd(supabase, item);

    if (result.success) {
      succeeded += 1;
    } else {
      failed += 1;
    }

    const { data: refreshedItems } = await supabase
      .from("batch_items")
      .select("status")
      .eq("batch_id", batchId)
      .returns<Array<Pick<BatchItem, "status">>>();

    await supabase
      .from("batches")
      .update({
        processed_rows: countTerminalItems(refreshedItems ?? []),
      })
      .eq("id", batchId);
  }

  const { data: finalItems, error: finalItemsError } = await supabase
    .from("batch_items")
    .select("status")
    .eq("batch_id", batchId)
    .returns<Array<Pick<BatchItem, "status">>>();

  if (finalItemsError) {
    throw new BatchGenerateError(finalItemsError.message);
  }

  const finalItemStatuses = finalItems ?? [];
  const hasFailures = finalItemStatuses.some((item) => item.status === "failed");
  const finalBatchStatus = hasFailures ? "complete_with_errors" : "complete";

  await supabase
    .from("batches")
    .update({
      status: finalBatchStatus,
      processed_rows: countTerminalItems(finalItemStatuses),
    })
    .eq("id", batchId);

  return {
    batchId,
    status: finalBatchStatus,
    processed: eligibleItems.length,
    succeeded,
    failed,
    skipped: items.length - eligibleItems.length,
  };
}

export async function getBatchStatusSnapshot(batchId: string) {
  const supabase = createAdminClient();

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("*")
    .eq("id", batchId)
    .single<Batch>();

  if (batchError || !batch) {
    throw new BatchGenerateError("Batch not found.", 404, "BATCH_NOT_FOUND");
  }

  const { data: batchItems, error: itemsError } = await supabase
    .from("batch_items")
    .select("id, batch_id, place_id, business_id, site_id, status, error, created_at")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true })
    .returns<BatchItem[]>();

  if (itemsError) {
    throw new BatchGenerateError(itemsError.message);
  }

  const items = batchItems ?? [];
  const businessIds = items
    .map((item) => item.business_id)
    .filter((id): id is string => id !== null);

  const businessById = new Map<
    string,
    { id: string; name: string | null; address: string | null; phone: string | null; rating: number | null; photos_json: unknown }
  >();

  if (businessIds.length > 0) {
    const { data: businesses, error: businessesError } = await supabase
      .from("businesses")
      .select("id, name, address, phone, rating, photos_json")
      .in("id", businessIds);

    if (businessesError) {
      throw new BatchGenerateError(businessesError.message);
    }

    for (const business of businesses ?? []) {
      businessById.set(business.id, business);
    }
  }

  const itemsWithBusiness = items.map((item) => ({
    ...item,
    business: item.business_id
      ? businessById.get(item.business_id) ?? null
      : null,
  }));

  const siteIds = items
    .map((item) => item.site_id)
    .filter((siteId): siteId is string => siteId !== null);

  const metricsBySiteId = await getSiteMetricsBySiteIds(siteIds);
  const siteById = await getSiteSummariesBySiteIds(siteIds);

  const itemsWithMetrics = itemsWithBusiness.map((item) => ({
    ...item,
    metrics: item.site_id ? getMetricsForSite(metricsBySiteId, item.site_id) : null,
    site: item.site_id ? siteById.get(item.site_id) ?? null : null,
  }));

  return {
    batch,
    counts: computeBatchStatusCounts(items),
    items: itemsWithMetrics,
    metricsSummary: summarizeBatchMetrics(metricsBySiteId),
  };
}
