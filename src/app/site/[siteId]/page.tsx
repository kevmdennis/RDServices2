import type { Metadata } from "next";
import { notFound } from "next/navigation";
import SiteHomepage from "@/components/site-preview/SiteHomepage";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Site } from "@/lib/sites/types";
import type { Business } from "@/lib/supabase/types";

type SitePageProps = {
  params: Promise<{ siteId: string }>;
};

export async function generateMetadata({
  params,
}: SitePageProps): Promise<Metadata> {
  const { siteId } = await params;
  const supabase = createAdminClient();

  const { data: site } = await supabase
    .from("sites")
    .select("business_name, hero_title")
    .eq("id", siteId)
    .maybeSingle<Pick<Site, "business_name" | "hero_title">>();

  if (!site) {
    return { title: "Website preview" };
  }

  return {
    title: site.business_name ?? site.hero_title ?? "Website preview",
    description: site.hero_title ?? "Generated local business website preview",
  };
}

export default async function SitePage({ params }: SitePageProps) {
  const { siteId } = await params;
  const supabase = createAdminClient();

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("*")
    .eq("id", siteId)
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

  return <SiteHomepage site={site} business={business} />;
}
