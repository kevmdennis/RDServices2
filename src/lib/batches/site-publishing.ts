import { createAdminClient } from "@/lib/supabase/admin";
import type { BatchItemSiteSummary } from "@/lib/supabase/types";

export async function getSiteSummariesBySiteIds(
  siteIds: string[],
): Promise<Map<string, BatchItemSiteSummary>> {
  const siteById = new Map<string, BatchItemSiteSummary>();

  if (siteIds.length === 0) {
    return siteById;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("sites")
    .select("id, slug, public_url, published, public_status")
    .in("id", siteIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const site of data ?? []) {
    siteById.set(site.id, site as BatchItemSiteSummary);
  }

  return siteById;
}
