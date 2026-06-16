export const WEBSITE_EVENT_TYPES = [
  "page_view",
  "phone_click",
  "google_maps_click",
  "website_click",
  "hero_cta_click",
  "contact_cta_click",
  "gallery_interaction",
  "faq_expand",
] as const;

export type WebsiteEventType = (typeof WEBSITE_EVENT_TYPES)[number];

export type WebsiteEvent = {
  id: string;
  site_id: string;
  business_id: string | null;
  event_type: WebsiteEventType;
  event_value: string | null;
  page_url: string | null;
  referrer: string | null;
  user_agent: string | null;
  created_at: string;
};

export type SiteMetrics = {
  site_id: string;
  total_views: number;
  phone_clicks: number;
  maps_clicks: number;
  website_clicks: number;
  cta_clicks: number;
  gallery_interactions: number;
  faq_expands: number;
  engagement_score: number;
  last_viewed_at: string | null;
};

export type TrackEventInput = {
  siteId: string;
  businessId?: string;
  eventType: WebsiteEventType;
  eventValue?: string;
  pageUrl?: string;
};

export const EMPTY_SITE_METRICS: SiteMetrics = {
  site_id: "",
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
