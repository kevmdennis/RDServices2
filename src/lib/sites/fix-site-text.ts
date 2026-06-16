import { sanitizeStoredSiteText } from "@/lib/sites/sanitize-site-text";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Site } from "@/lib/sites/types";

export type FixBatchSiteTextResult = {
  updatedCount: number;
  skippedCount: number;
  totalSites: number;
};

export async function fixBatchSiteText(
  batchId: string,
): Promise<FixBatchSiteTextResult> {
  const supabase = createAdminClient();

  const { data: batchItems, error: itemsError } = await supabase
    .from("batch_items")
    .select("site_id, status")
    .eq("batch_id", batchId)
    .eq("status", "complete")
    .not("site_id", "is", null);

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const siteIds = [
    ...new Set(
      (batchItems ?? [])
        .map((item) => item.site_id)
        .filter((siteId): siteId is string => typeof siteId === "string"),
    ),
  ];

  if (siteIds.length === 0) {
    return {
      updatedCount: 0,
      skippedCount: 0,
      totalSites: 0,
    };
  }

  const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select("id, hero_title, contact_json, theme_json")
    .in("id", siteIds);

  if (sitesError) {
    throw new Error(sitesError.message);
  }

  let updatedCount = 0;
  let skippedCount = 0;

  for (const site of (sites ?? []) as Pick<
    Site,
    "id" | "hero_title" | "contact_json" | "theme_json"
  >[]) {
    const sanitized = sanitizeStoredSiteText(site);

    if (!sanitized.changed) {
      skippedCount += 1;
      continue;
    }

    const { error: updateError } = await supabase
      .from("sites")
      .update({
        hero_title: sanitized.hero_title,
        contact_json: sanitized.contact_json,
        theme_json: sanitized.theme_json,
      })
      .eq("id", site.id);

    if (updateError) {
      throw new Error(updateError.message);
    }

    updatedCount += 1;
  }

  return {
    updatedCount,
    skippedCount,
    totalSites: siteIds.length,
  };
}
