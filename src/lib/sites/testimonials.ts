import type { SiteTestimonial } from "@/lib/sites/types";

type GoogleReview = {
  text?: { text?: string };
  originalText?: { text?: string };
  rating?: number;
  authorAttribution?: {
    displayName?: string;
  };
};

export function extractGoogleTestimonials(
  reviewsJson: unknown,
  limit = 5,
): SiteTestimonial[] {
  if (!Array.isArray(reviewsJson)) {
    return [];
  }

  const testimonials: SiteTestimonial[] = [];

  for (const review of reviewsJson) {
    if (!review || typeof review !== "object") {
      continue;
    }

    const googleReview = review as GoogleReview;
    const text =
      googleReview.text?.text?.trim() ??
      googleReview.originalText?.text?.trim() ??
      "";

    if (!text) {
      continue;
    }

    testimonials.push({
      text,
      author: googleReview.authorAttribution?.displayName ?? null,
      rating:
        typeof googleReview.rating === "number" ? googleReview.rating : null,
    });

    if (testimonials.length >= limit) {
      break;
    }
  }

  return testimonials;
}

export function sanitizeGeneratedTestimonials(
  generated: SiteTestimonial[],
  allowed: SiteTestimonial[],
): SiteTestimonial[] {
  if (allowed.length === 0) {
    return [];
  }

  const allowedTexts = new Set(
    allowed.map((testimonial) => testimonial.text.trim().toLowerCase()),
  );

  return generated.filter((testimonial) =>
    allowedTexts.has(testimonial.text.trim().toLowerCase()),
  );
}
