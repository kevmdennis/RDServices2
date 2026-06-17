import { buildPublicWebsiteUrl } from "@/lib/sites/app-url";
import { slugifyBusinessName } from "@/lib/sites/slug";
import type { Site, SitePublicStatus } from "@/lib/sites/types";
import { createAdminClient } from "@/lib/supabase/admin";

export async function generateUniqueSiteSlug(
  businessName: string,
  excludeSiteId?: string,
): Promise<string> {
  const baseSlug = slugifyBusinessName(businessName) || "business";
  const supabase = createAdminClient();

  let candidate = baseSlug;
  let suffix = 2;

  while (true) {
    const { data, error } = await supabase
      .from("sites")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle<Pick<Site, "id">>();

    if (error) {
      throw new Error(error.message);
    }

    if (!data || (excludeSiteId && data.id === excludeSiteId)) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export type PublishSiteFields = {
  slug: string;
  public_url: string;
  published: boolean;
  public_status: SitePublicStatus;
};

export async function buildPublishSiteFields(
  businessName: string | null,
  excludeSiteId?: string,
): Promise<PublishSiteFields> {
  const slug = await generateUniqueSiteSlug(businessName ?? "business", excludeSiteId);

  return {
    slug,
    public_url: buildPublicWebsiteUrl(slug),
    published: true,
    public_status: "published",
  };
}

export async function applyPublicPublishingToSite(
  siteId: string,
  businessName: string | null,
): Promise<PublishSiteFields> {
  const supabase = createAdminClient();
  const fields = await buildPublishSiteFields(businessName, siteId);

  const { error } = await supabase
    .from("sites")
    .update(fields)
    .eq("id", siteId);

  if (error) {
    throw new Error(error.message);
  }

  return fields;
}
