import { applyPublicPublishingToSite } from "@/lib/sites/publish-site";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Site } from "@/lib/sites/types";

export type FixPublicLinksResult = {
  updatedCount: number;
  skippedCount: number;
  totalSites: number;
};

export async function fixBatchPublicLinks(
  batchId: string,
): Promise<FixPublicLinksResult> {
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
    return { updatedCount: 0, skippedCount: 0, totalSites: 0 };
  }

  const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select("id, business_name, slug, public_url")
    .in("id", siteIds);

  if (sitesError) {
    throw new Error(sitesError.message);
  }

  let updatedCount = 0;
  let skippedCount = 0;

  for (const site of (sites ?? []) as Pick<
    Site,
    "id" | "business_name" | "slug" | "public_url"
  >[]) {
    if (site.slug && site.public_url) {
      skippedCount += 1;
      continue;
    }

    await applyPublicPublishingToSite(site.id, site.business_name);
    updatedCount += 1;
  }

  return {
    updatedCount,
    skippedCount,
    totalSites: siteIds.length,
  };
}
