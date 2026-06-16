import { createOpenAIClient } from "@/lib/openai/client";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Business } from "@/lib/supabase/types";
import {
  extractGoogleTestimonials,
  sanitizeGeneratedTestimonials,
} from "@/lib/sites/testimonials";
import type {
  GeneratedSiteContent,
  Site,
  SiteContact,
  SiteService,
  SiteTheme,
} from "@/lib/sites/types";

type OpenAIGeneratedFields = {
  hero_title: string;
  hero_subtitle: string;
  about: string;
  services: SiteService[];
  hours: unknown;
  cta_text: string;
  theme: SiteTheme;
  testimonials?: GeneratedSiteContent["testimonials"];
};

export class GenerateSiteError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number = 500,
    public readonly code: string = "GENERATE_SITE_ERROR",
  ) {
    super(message);
    this.name = "GenerateSiteError";
  }
}

export async function generateSiteForBusiness(
  businessId: string,
): Promise<{ siteId: string; site: Site }> {
  const supabase = createAdminClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", businessId)
    .single<Business>();

  if (businessError || !business) {
    throw new GenerateSiteError("Business not found.", 404, "BUSINESS_NOT_FOUND");
  }

  const allowedTestimonials = extractGoogleTestimonials(business.reviews_json);
  const generatedFields = await generateSiteContentWithOpenAI(
    business,
    allowedTestimonials,
  );

  const testimonials =
    allowedTestimonials.length > 0
      ? sanitizeGeneratedTestimonials(
          generatedFields.testimonials ?? [],
          allowedTestimonials,
        )
      : [];

  const finalTestimonials =
    testimonials.length > 0 ? testimonials : allowedTestimonials;

  const contact: SiteContact = {
    phone: business.phone,
    address: business.address,
    website: business.website,
    google_maps_uri: business.google_maps_uri,
    cta_text: generatedFields.cta_text,
  };

  const siteContent: GeneratedSiteContent = {
    hero_title: generatedFields.hero_title,
    hero_subtitle: generatedFields.hero_subtitle,
    about: generatedFields.about,
    services: generatedFields.services,
    testimonials: finalTestimonials,
    hours: generatedFields.hours ?? business.hours_json ?? null,
    contact,
    cta_text: generatedFields.cta_text,
    theme: generatedFields.theme,
  };

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .insert({
      business_id: business.id,
      place_id: business.place_id,
      business_name: business.name,
      hero_title: siteContent.hero_title,
      hero_subtitle: siteContent.hero_subtitle,
      about: siteContent.about,
      services_json: siteContent.services,
      testimonials_json: siteContent.testimonials,
      hours_json: siteContent.hours,
      contact_json: siteContent.contact,
      theme_json: siteContent.theme,
    })
    .select("*")
    .single<Site>();

  if (siteError || !site) {
    throw new GenerateSiteError(
      siteError?.message ?? "Failed to save generated site.",
      500,
      "SITE_SAVE_FAILED",
    );
  }

  return { siteId: site.id, site };
}

async function generateSiteContentWithOpenAI(
  business: Business,
  allowedTestimonials: GeneratedSiteContent["testimonials"],
): Promise<OpenAIGeneratedFields> {
  const openai = createOpenAIClient();
  const rawPlace =
    business.raw_place_json && typeof business.raw_place_json === "object"
      ? (business.raw_place_json as Record<string, unknown>)
      : {};

  const businessContext = {
    name: business.name,
    address: business.address,
    phone: business.phone,
    website: business.website,
    rating: business.rating,
    review_count: business.review_count,
    types: Array.isArray(rawPlace.types) ? rawPlace.types : [],
    primary_type:
      typeof rawPlace.primaryType === "string" ? rawPlace.primaryType : null,
    hours: business.hours_json,
    allowed_testimonials: allowedTestimonials,
  };

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: [
          "You generate structured website copy for local businesses.",
          "Return valid JSON only with these keys:",
          "hero_title, hero_subtitle, about, services, hours, cta_text, theme, testimonials.",
          "Keep copy simple, friendly, and trustworthy for a local business website.",
          "Do not invent facts, awards, years in business, or guarantees.",
          "services must be an array of objects: { name, description } with 3 to 6 items inferred from the business name, type, and review themes.",
          "hours should format the provided opening hours data for website display.",
          "cta_text should be a short call-to-action such as 'Call today' or 'Book an appointment'.",
          "theme must be an object: { style, primary_color, accent_color } using hex colors suited to the business.",
          "testimonials rules:",
          "- NEVER invent reviews.",
          "- Only include testimonials copied from allowed_testimonials.",
          "- If allowed_testimonials is empty, return testimonials as an empty array.",
          "- Each testimonial must use the exact review text from allowed_testimonials.",
        ].join(" "),
      },
      {
        role: "user",
        content: JSON.stringify(businessContext),
      },
    ],
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new GenerateSiteError(
      "OpenAI returned an empty response.",
      502,
      "OPENAI_EMPTY_RESPONSE",
    );
  }

  let parsed: OpenAIGeneratedFields;

  try {
    parsed = JSON.parse(content) as OpenAIGeneratedFields;
  } catch {
    throw new GenerateSiteError(
      "OpenAI returned invalid JSON.",
      502,
      "OPENAI_INVALID_JSON",
    );
  }

  if (!parsed.hero_title || !parsed.hero_subtitle || !parsed.about) {
    throw new GenerateSiteError(
      "OpenAI response was missing required site fields.",
      502,
      "OPENAI_INCOMPLETE_RESPONSE",
    );
  }

  return {
    hero_title: String(parsed.hero_title).trim(),
    hero_subtitle: String(parsed.hero_subtitle).trim(),
    about: String(parsed.about).trim(),
    services: normalizeServices(parsed.services),
    hours: parsed.hours ?? business.hours_json ?? null,
    cta_text: String(parsed.cta_text ?? "Contact us today").trim(),
    theme: normalizeTheme(parsed.theme),
    testimonials: Array.isArray(parsed.testimonials)
      ? parsed.testimonials.map((testimonial) => ({
          text: String(testimonial.text ?? "").trim(),
          author:
            testimonial.author != null ? String(testimonial.author) : null,
          rating:
            typeof testimonial.rating === "number" ? testimonial.rating : null,
        }))
      : [],
  };
}

function normalizeServices(services: unknown): SiteService[] {
  if (!Array.isArray(services)) {
    return [];
  }

  return services
    .map((service) => {
      if (!service || typeof service !== "object") {
        return null;
      }

      const value = service as { name?: unknown; description?: unknown };
      const name = String(value.name ?? "").trim();
      const description = String(value.description ?? "").trim();

      if (!name) {
        return null;
      }

      return { name, description };
    })
    .filter((service): service is SiteService => service !== null)
    .slice(0, 6);
}

function normalizeTheme(theme: unknown): SiteTheme {
  if (!theme || typeof theme !== "object") {
    return {
      style: "clean local business",
      primary_color: "#1f2937",
      accent_color: "#2563eb",
    };
  }

  const value = theme as {
    style?: unknown;
    primary_color?: unknown;
    accent_color?: unknown;
  };

  return {
    style: String(value.style ?? "clean local business").trim(),
    primary_color: String(value.primary_color ?? "#1f2937").trim(),
    accent_color: String(value.accent_color ?? "#2563eb").trim(),
  };
}
