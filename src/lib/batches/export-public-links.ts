import { getMetricsForSite, getSiteMetricsBySiteIds } from "@/lib/analytics/metrics";
import {
  buildPublicLinksCsv,
  type PublicLinkExportRow,
} from "@/lib/csv-export";
import {
  buildAnalyticsUrl,
  buildInternalPreviewUrl,
  resolvePublicWebsiteUrl,
} from "@/lib/sites/app-url";
import type { Site } from "@/lib/sites/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BatchItem, Business } from "@/lib/supabase/types";

export class ExportPublicLinksError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "EXPORT_PUBLIC_LINKS_ERROR",
  ) {
    super(message);
    this.name = "ExportPublicLinksError";
  }
}

function formatOptionalString(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function formatOptionalNumber(value: number | null | undefined): string {
  return value == null ? "" : String(value);
}

function formatLastViewed(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return new Date(value).toISOString();
}

export async function getPublicLinkExportRows(
  batchId: string,
): Promise<PublicLinkExportRow[]> {
  const supabase = createAdminClient();

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("id")
    .eq("id", batchId)
    .maybeSingle<{ id: string }>();

  if (batchError) {
    throw new ExportPublicLinksError(batchError.message);
  }

  if (!batch) {
    throw new ExportPublicLinksError("Batch not found.", 404, "BATCH_NOT_FOUND");
  }

  const { data: batchItems, error: itemsError } = await supabase
    .from("batch_items")
    .select("id, place_id, business_id, site_id, status")
    .eq("batch_id", batchId)
    .eq("status", "complete")
    .not("site_id", "is", null)
    .order("created_at", { ascending: true })
    .returns<BatchItem[]>();

  if (itemsError) {
    throw new ExportPublicLinksError(itemsError.message);
  }

  const items = batchItems ?? [];

  if (items.length === 0) {
    return [];
  }

  const siteIds = items
    .map((item) => item.site_id)
    .filter((siteId): siteId is string => typeof siteId === "string");

  const businessIds = items
    .map((item) => item.business_id)
    .filter((businessId): businessId is string => typeof businessId === "string");

  const { data: sites, error: sitesError } = await supabase
    .from("sites")
    .select("id, business_name, slug, public_url")
    .in("id", siteIds);

  if (sitesError) {
    throw new ExportPublicLinksError(sitesError.message);
  }

  const siteById = new Map(
    (sites ?? []).map((site) => [site.id, site as Pick<Site, "id" | "business_name" | "slug" | "public_url">]),
  );

  const businessById = new Map<
    string,
    Pick<Business, "name" | "phone" | "address" | "rating" | "review_count">
  >();

  if (businessIds.length > 0) {
    const { data: businesses, error: businessesError } = await supabase
      .from("businesses")
      .select("id, name, phone, address, rating, review_count")
      .in("id", businessIds);

    if (businessesError) {
      throw new ExportPublicLinksError(businessesError.message);
    }

    for (const business of businesses ?? []) {
      businessById.set(business.id, business);
    }
  }

  const metricsBySiteId = await getSiteMetricsBySiteIds(siteIds);

  return items.map((item) => {
    const site = item.site_id ? siteById.get(item.site_id) : undefined;
    const business = item.business_id ? businessById.get(item.business_id) : undefined;
    const metrics = item.site_id
      ? getMetricsForSite(metricsBySiteId, item.site_id)
      : null;

    const businessName = site?.business_name ?? business?.name ?? "";
    const siteId = item.site_id ?? "";

    return {
      business_name: formatOptionalString(businessName),
      place_id: item.place_id,
      public_url: site ? resolvePublicWebsiteUrl(site) : "",
      internal_preview_url: siteId ? buildInternalPreviewUrl(siteId) : "",
      analytics_url: siteId ? buildAnalyticsUrl(siteId) : "",
      phone: formatOptionalString(business?.phone),
      address: formatOptionalString(business?.address),
      rating: formatOptionalNumber(business?.rating),
      review_count: formatOptionalNumber(business?.review_count),
      total_views: formatOptionalNumber(metrics?.total_views ?? 0),
      phone_clicks: formatOptionalNumber(metrics?.phone_clicks ?? 0),
      maps_clicks: formatOptionalNumber(metrics?.maps_clicks ?? 0),
      website_clicks: formatOptionalNumber(metrics?.website_clicks ?? 0),
      engagement_score: formatOptionalNumber(metrics?.engagement_score ?? 0),
      last_viewed_at: formatLastViewed(metrics?.last_viewed_at),
      status: item.status,
    };
  });
}

export async function buildBatchPublicLinksCsv(batchId: string): Promise<string> {
  const rows = await getPublicLinkExportRows(batchId);
  return buildPublicLinksCsv(rows);
}
