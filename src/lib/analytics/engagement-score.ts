import type { SiteMetrics } from "@/lib/analytics/types";

export function calculateEngagementScore(
  metrics: Pick<
    SiteMetrics,
    | "total_views"
    | "website_clicks"
    | "maps_clicks"
    | "cta_clicks"
    | "phone_clicks"
  >,
): number {
  return (
    metrics.total_views * 1 +
    metrics.website_clicks * 3 +
    metrics.maps_clicks * 5 +
    metrics.cta_clicks * 7 +
    metrics.phone_clicks * 10
  );
}

export const ENGAGEMENT_SCORE_EXPLANATION =
  "Engagement Score estimates how strongly visitors interacted with the website. Phone calls and directions clicks are weighted higher because they show stronger buying intent.";
