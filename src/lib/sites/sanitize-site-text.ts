const HERO_TITLE_PREFIXES = [
  /^Welcome to\s+/i,
  /^Welcome\s+/i,
  /^Introducing\s+/i,
] as const;

const CTA_FIELD_NAMES = [
  "cta_text",
  "primary_cta",
  "secondary_cta",
] as const;

export const DEFAULT_CTA_TEXT = "Give Us a Call Today";

export function sanitizeHeroTitle(title: string): string {
  let result = title.trim();

  for (const prefix of HERO_TITLE_PREFIXES) {
    result = result.replace(prefix, "");
  }

  return result.trim();
}

export function sanitizeCtaText(text: string): string {
  const trimmed = text.trim();

  if (trimmed.toLowerCase() === "call today") {
    return "Give Us a Call Today";
  }

  return trimmed;
}

export type SanitizedSiteText = {
  hero_title: string | null;
  contact_json: Record<string, unknown> | null;
  theme_json: Record<string, unknown> | null;
  changed: boolean;
};

export function sanitizeStoredSiteText(site: {
  hero_title: string | null;
  contact_json: unknown;
  theme_json: unknown;
}): SanitizedSiteText {
  const originalHeroTitle = site.hero_title?.trim() ?? "";
  const sanitizedHeroTitle = originalHeroTitle
    ? sanitizeHeroTitle(originalHeroTitle)
    : null;

  const contactJson =
    site.contact_json && typeof site.contact_json === "object"
      ? ({ ...(site.contact_json as Record<string, unknown>) } as Record<
          string,
          unknown
        >)
      : null;

  const themeJson =
    site.theme_json && typeof site.theme_json === "object"
      ? ({ ...(site.theme_json as Record<string, unknown>) } as Record<
          string,
          unknown
        >)
      : null;

  let changed = sanitizedHeroTitle !== originalHeroTitle;

  if (contactJson) {
    for (const fieldName of CTA_FIELD_NAMES) {
      const fieldValue = contactJson[fieldName];

      if (typeof fieldValue !== "string") {
        continue;
      }

      const sanitized = sanitizeCtaText(fieldValue);

      if (sanitized !== fieldValue) {
        contactJson[fieldName] = sanitized;
        changed = true;
      }
    }
  }

  if (themeJson) {
    for (const fieldName of CTA_FIELD_NAMES) {
      const fieldValue = themeJson[fieldName];

      if (typeof fieldValue !== "string") {
        continue;
      }

      const sanitized = sanitizeCtaText(fieldValue);

      if (sanitized !== fieldValue) {
        themeJson[fieldName] = sanitized;
        changed = true;
      }
    }
  }

  return {
    hero_title: sanitizedHeroTitle,
    contact_json: contactJson,
    theme_json: themeJson,
    changed,
  };
}
