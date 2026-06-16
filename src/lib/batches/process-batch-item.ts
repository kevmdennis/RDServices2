import {
  getPlaceDetailsErrorMessage,
  upsertBusinessFromPlaceId,
} from "@/lib/businesses/upsert-from-place";
import { generateSiteForBusiness } from "@/lib/sites/generate-site";
import type { BatchItem } from "@/lib/supabase/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ProcessBatchItemResult =
  | { success: true; siteId: string; businessId: string }
  | { success: false; error: string };

type BatchItemRow = Pick<
  BatchItem,
  "id" | "batch_id" | "place_id" | "business_id" | "status"
>;

export async function processBatchItemEndToEnd(
  supabase: SupabaseClient,
  item: BatchItemRow,
): Promise<ProcessBatchItemResult> {
  if (item.status !== "pending" && item.status !== "business_data_saved") {
    return {
      success: false,
      error: `Item status "${item.status}" is not eligible for batch processing.`,
    };
  }

  let businessId = item.business_id;

  try {
    if (item.status === "pending") {
      const { error: fetchingError } = await supabase
        .from("batch_items")
        .update({
          status: "fetching_place_details",
          error: null,
        })
        .eq("id", item.id);

      if (fetchingError) {
        throw new Error(fetchingError.message);
      }

      const business = await upsertBusinessFromPlaceId(item.place_id);
      businessId = business.id;

      const { error: businessSavedError } = await supabase
        .from("batch_items")
        .update({
          business_id: business.id,
          status: "business_data_saved",
          error: null,
        })
        .eq("id", item.id);

      if (businessSavedError) {
        throw new Error(businessSavedError.message);
      }
    }

    if (!businessId) {
      throw new Error("Batch item is missing a linked business.");
    }

    const { error: generatingError } = await supabase
      .from("batch_items")
      .update({
        status: "generating_site",
        error: null,
      })
      .eq("id", item.id);

    if (generatingError) {
      throw new Error(generatingError.message);
    }

    const { siteId } = await generateSiteForBusiness(businessId);

    const { error: completeError } = await supabase
      .from("batch_items")
      .update({
        site_id: siteId,
        status: "complete",
        error: null,
      })
      .eq("id", item.id);

    if (completeError) {
      throw new Error(completeError.message);
    }

    return { success: true, siteId, businessId };
  } catch (error) {
    const message = getProcessErrorMessage(error);

    await supabase
      .from("batch_items")
      .update({
        status: "failed",
        error: message,
      })
      .eq("id", item.id);

    return { success: false, error: message };
  }
}

function getProcessErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return getPlaceDetailsErrorMessage(error);
  }

  return "Failed to process batch item.";
}
