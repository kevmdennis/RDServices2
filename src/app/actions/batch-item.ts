"use server";

import { revalidatePath } from "next/cache";
import {
  getPlaceDetailsErrorMessage,
  upsertBusinessFromPlaceId,
} from "@/lib/businesses/upsert-from-place";
import { generateSiteForBusiness } from "@/lib/sites/generate-site";
import { createAdminClient } from "@/lib/supabase/admin";

export type FetchBusinessDataResult =
  | { success: true; businessId: string }
  | { success: false; error: string };

export type GenerateWebsiteResult =
  | { success: true; siteId: string }
  | { success: false; error: string };

export async function fetchBusinessData(
  batchItemId: string,
): Promise<FetchBusinessDataResult> {
  const supabase = createAdminClient();

  const { data: batchItem, error: fetchError } = await supabase
    .from("batch_items")
    .select("id, batch_id, place_id, status")
    .eq("id", batchItemId)
    .single();

  if (fetchError || !batchItem) {
    return { success: false, error: "Batch item not found." };
  }

  if (batchItem.status !== "pending") {
    return {
      success: false,
      error: "Only pending batch items can fetch business data.",
    };
  }

  const { error: fetchingError } = await supabase
    .from("batch_items")
    .update({
      status: "fetching_place_details",
      error: null,
    })
    .eq("id", batchItemId);

  if (fetchingError) {
    return {
      success: false,
      error: fetchingError.message,
    };
  }

  try {
    const business = await upsertBusinessFromPlaceId(batchItem.place_id);

    const { error: saveError } = await supabase
      .from("batch_items")
      .update({
        business_id: business.id,
        status: "business_data_saved",
        error: null,
      })
      .eq("id", batchItemId);

    if (saveError) {
      throw new Error(saveError.message);
    }

    revalidatePath(`/batch/${batchItem.batch_id}`);

    return { success: true, businessId: business.id };
  } catch (error) {
    const message = getPlaceDetailsErrorMessage(error);

    await supabase
      .from("batch_items")
      .update({
        status: "failed",
        error: message,
      })
      .eq("id", batchItemId);

    revalidatePath(`/batch/${batchItem.batch_id}`);

    return { success: false, error: message };
  }
}

export async function generateWebsite(
  batchItemId: string,
): Promise<GenerateWebsiteResult> {
  const supabase = createAdminClient();

  const { data: batchItem, error: fetchError } = await supabase
    .from("batch_items")
    .select("id, batch_id, business_id, status")
    .eq("id", batchItemId)
    .single();

  if (fetchError || !batchItem) {
    return { success: false, error: "Batch item not found." };
  }

  if (batchItem.status !== "business_data_saved") {
    return {
      success: false,
      error: "Only items with saved business data can generate a website.",
    };
  }

  if (!batchItem.business_id) {
    return {
      success: false,
      error: "Batch item is missing a linked business.",
    };
  }

  const { error: generatingError } = await supabase
    .from("batch_items")
    .update({
      status: "generating_site",
      error: null,
    })
    .eq("id", batchItemId);

  if (generatingError) {
    return { success: false, error: generatingError.message };
  }

  try {
    const { siteId } = await generateSiteForBusiness(batchItem.business_id);

    const { error: saveError } = await supabase
      .from("batch_items")
      .update({
        site_id: siteId,
        status: "complete",
        error: null,
      })
      .eq("id", batchItemId);

    if (saveError) {
      throw new Error(saveError.message);
    }

    revalidatePath(`/batch/${batchItem.batch_id}`);

    return { success: true, siteId };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to generate website.";

    await supabase
      .from("batch_items")
      .update({
        status: "failed",
        error: message,
      })
      .eq("id", batchItemId);

    revalidatePath(`/batch/${batchItem.batch_id}`);

    return { success: false, error: message };
  }
}
