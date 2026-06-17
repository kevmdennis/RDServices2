import { calculateEngagementScore } from "@/lib/analytics/engagement-score";
import {
  METRICS_EVENT_TYPES,
  WEBSITE_EVENT_TYPES,
  type MetricsEventType,
  type SiteMetrics,
  type TrackEventInput,
} from "@/lib/analytics/types";
import { createAdminClient } from "@/lib/supabase/admin";

export class TrackEventError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "TRACK_EVENT_ERROR",
  ) {
    super(message);
    this.name = "TrackEventError";
  }
}

type TrackEventRequestMeta = {
  referrer?: string | null;
  userAgent?: string | null;
};

export function isValidWebsiteEventType(
  value: string,
): value is TrackEventInput["eventType"] {
  return WEBSITE_EVENT_TYPES.includes(value as TrackEventInput["eventType"]);
}

function isMetricsEventType(value: string): value is MetricsEventType {
  return METRICS_EVENT_TYPES.includes(value as MetricsEventType);
}

export async function recordWebsiteEvent(
  input: TrackEventInput,
  meta: TrackEventRequestMeta = {},
): Promise<void> {
  if (!input.siteId.trim()) {
    throw new TrackEventError("siteId is required.", 400, "INVALID_SITE_ID");
  }

  if (!isValidWebsiteEventType(input.eventType)) {
    throw new TrackEventError("Invalid eventType.", 400, "INVALID_EVENT_TYPE");
  }

  const supabase = createAdminClient();

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, business_id")
    .eq("id", input.siteId.trim())
    .maybeSingle<{ id: string; business_id: string }>();

  if (siteError) {
    throw new TrackEventError(siteError.message, 500, "SITE_LOOKUP_FAILED");
  }

  if (!site) {
    throw new TrackEventError("Site not found.", 404, "SITE_NOT_FOUND");
  }

  const businessId = input.businessId?.trim() || site.business_id || null;

  const { error: insertError } = await supabase.from("website_events").insert({
    site_id: site.id,
    business_id: businessId,
    event_type: input.eventType,
    event_value: input.eventValue?.trim() || null,
    page_url: input.pageUrl?.trim() || null,
    referrer: meta.referrer ?? null,
    user_agent: meta.userAgent ?? null,
  });

  if (insertError) {
    throw new TrackEventError(insertError.message, 500, "EVENT_INSERT_FAILED");
  }

  if (isMetricsEventType(input.eventType)) {
    await upsertSiteMetrics(site.id, input.eventType);
  }
}

async function upsertSiteMetrics(
  siteId: string,
  eventType: MetricsEventType,
): Promise<void> {
  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("site_metrics")
    .select("*")
    .eq("site_id", siteId)
    .maybeSingle<SiteMetrics>();

  if (fetchError) {
    throw new TrackEventError(fetchError.message, 500, "METRICS_LOOKUP_FAILED");
  }

  const now = new Date().toISOString();
  const metrics: SiteMetrics = existing ?? {
    site_id: siteId,
    total_views: 0,
    phone_clicks: 0,
    maps_clicks: 0,
    website_clicks: 0,
    cta_clicks: 0,
    gallery_interactions: 0,
    faq_expands: 0,
    engagement_score: 0,
    last_viewed_at: null,
  };

  switch (eventType) {
    case "page_view":
      metrics.total_views += 1;
      metrics.last_viewed_at = now;
      break;
    case "phone_click":
      metrics.phone_clicks += 1;
      break;
    case "google_maps_click":
      metrics.maps_clicks += 1;
      break;
    case "website_click":
      metrics.website_clicks += 1;
      break;
    case "hero_cta_click":
    case "contact_cta_click":
      metrics.cta_clicks += 1;
      break;
    case "gallery_interaction":
      metrics.gallery_interactions += 1;
      break;
    case "faq_expand":
      metrics.faq_expands += 1;
      break;
    default:
      break;
  }

  metrics.engagement_score = calculateEngagementScore(metrics);

  if (existing) {
    const { error: updateError } = await supabase
      .from("site_metrics")
      .update({
        total_views: metrics.total_views,
        phone_clicks: metrics.phone_clicks,
        maps_clicks: metrics.maps_clicks,
        website_clicks: metrics.website_clicks,
        cta_clicks: metrics.cta_clicks,
        gallery_interactions: metrics.gallery_interactions,
        faq_expands: metrics.faq_expands,
        engagement_score: metrics.engagement_score,
        last_viewed_at: metrics.last_viewed_at,
      })
      .eq("site_id", siteId);

    if (updateError) {
      throw new TrackEventError(updateError.message, 500, "METRICS_UPDATE_FAILED");
    }

    return;
  }

  const { error: insertError } = await supabase.from("site_metrics").insert(metrics);

  if (insertError) {
    throw new TrackEventError(insertError.message, 500, "METRICS_INSERT_FAILED");
  }
}
