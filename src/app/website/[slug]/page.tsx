import type { Metadata } from "next";
import { notFound } from "next/navigation";
import GeneratedWebsite from "@/components/site-preview/GeneratedWebsite";
import { sanitizeHeroTitle } from "@/lib/sites/sanitize-site-text";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Site } from "@/lib/sites/types";
import type { Business } from "@/lib/supabase/types";

type PublicWebsitePageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ debugTracking?: string }>;
};

export async function generateMetadata({
  params,
}: Pick<PublicWebsitePageProps, "params">): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: site } = await supabase
    .from("sites")
    .select("business_name, hero_title")
    .eq("slug", slug)
    .eq("published", true)
    .eq("public_status", "published")
    .maybeSingle<Pick<Site, "business_name" | "hero_title">>();

  if (!site) {
    return { title: "Website not found" };
  }

  const heroTitle = site.hero_title
    ? sanitizeHeroTitle(site.hero_title)
    : null;

  return {
    title: site.business_name ?? heroTitle ?? "Business website",
    description: heroTitle ?? "Local business website",
  };
}

export default async function PublicWebsitePage({
  params,
  searchParams,
}: PublicWebsitePageProps) {
  const { slug } = await params;
  const { debugTracking } = await searchParams;
  const supabase = createAdminClient();

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .eq("public_status", "published")
    .single<Site>();

  if (siteError || !site) {
    notFound();
  }

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("id", site.business_id)
    .single<Business>();

  if (businessError || !business) {
    notFound();
  }

  return (
    <GeneratedWebsite
      site={site}
      business={business}
      trackingEnabled={true}
      debugTracking={debugTracking === "true"}
      pageViewEventValue="website_page_view"
      isPublicView={true}
    />
  );
}
