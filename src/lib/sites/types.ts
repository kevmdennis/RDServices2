export type SiteService = {
  name: string;
  description: string;
};

export type SiteTestimonial = {
  text: string;
  author: string | null;
  rating: number | null;
};

export type SiteContact = {
  phone: string | null;
  address: string | null;
  website: string | null;
  google_maps_uri: string | null;
  cta_text: string;
};

export type SiteTheme = {
  style: string;
  primary_color: string;
  accent_color: string;
};

export type GeneratedSiteContent = {
  hero_title: string;
  hero_subtitle: string;
  about: string;
  services: SiteService[];
  testimonials: SiteTestimonial[];
  hours: unknown;
  contact: SiteContact;
  cta_text: string;
  theme: SiteTheme;
};

export type Site = {
  id: string;
  business_id: string;
  place_id: string | null;
  business_name: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  about: string | null;
  services_json: SiteService[] | null;
  testimonials_json: SiteTestimonial[] | null;
  hours_json: unknown | null;
  contact_json: SiteContact | null;
  theme_json: SiteTheme | null;
  generated_html: string | null;
  created_at: string;
};
