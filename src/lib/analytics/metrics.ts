import type { SiteMetrics } from "@/lib/analytics/types";
import { EMPTY_SITE_METRICS } from "@/lib/analytics/types";
import { createAdminClient } from "@/lib/supabase/admin";

export type BatchMetricsSummary = {
  totalViews: number;
  totalPhoneClicks: number;
  totalMapsClicks: number;
  totalWebsiteClicks: number;
  totalEngagementScore: number;
};

export async function getSiteMetricsBySiteIds(
  siteIds: string[],
): Promise<Map<string, SiteMetrics>> {
  const metricsBySiteId = new Map<string, SiteMetrics>();

  if (siteIds.length === 0) {
    return metricsBySiteId;
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("site_metrics")
    .select("*")
    .in("site_id", siteIds);

  if (error) {
    throw new Error(error.message);
  }

  for (const row of data ?? []) {
    metricsBySiteId.set(row.site_id, row as SiteMetrics);
  }

  return metricsBySiteId;
}

export function getMetricsForSite(
  metricsBySiteId: Map<string, SiteMetrics>,
  siteId: string,
): SiteMetrics {
  return metricsBySiteId.get(siteId) ?? { ...EMPTY_SITE_METRICS, site_id: siteId };
}

export function summarizeBatchMetrics(
  metricsBySiteId: Map<string, SiteMetrics>,
): BatchMetricsSummary {
  let totalViews = 0;
  let totalPhoneClicks = 0;
  let totalMapsClicks = 0;
  let totalWebsiteClicks = 0;
  let totalEngagementScore = 0;

  for (const metrics of metricsBySiteId.values()) {
    totalViews += metrics.total_views;
    totalPhoneClicks += metrics.phone_clicks;
    totalMapsClicks += metrics.maps_clicks;
    totalWebsiteClicks += metrics.website_clicks;
    totalEngagementScore += metrics.engagement_score;
  }

  return {
    totalViews,
    totalPhoneClicks,
    totalMapsClicks,
    totalWebsiteClicks,
    totalEngagementScore,
  };
}
