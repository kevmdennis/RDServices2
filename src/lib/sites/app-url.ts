export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured) {
    return configured.replace(/\/$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();

  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, "")}`;
  }

  return "http://localhost:3000";
}

export function buildPublicWebsiteUrl(slug: string): string {
  return `${getAppBaseUrl()}/website/${slug}`;
}

export function buildInternalPreviewUrl(siteId: string): string {
  return `${getAppBaseUrl()}/site/${siteId}`;
}

export function buildAnalyticsUrl(siteId: string): string {
  return `${getAppBaseUrl()}/analytics/${siteId}`;
}

export function resolvePublicWebsiteUrl(site: {
  public_url?: string | null;
  slug?: string | null;
}): string {
  const stored = site.public_url?.trim();

  if (stored) {
    return stored;
  }

  const slug = site.slug?.trim();

  if (slug) {
    return buildPublicWebsiteUrl(slug);
  }

  return "";
}
