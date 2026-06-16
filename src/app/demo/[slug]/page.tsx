import { notFound } from "next/navigation";
import SiteHomepage from "@/components/site-preview/SiteHomepage";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Site } from "@/lib/sites/types";
import type { Business } from "@/lib/supabase/types";

type DemoPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function DemoPage({ params }: DemoPageProps) {
  const { slug } = await params;
  const supabase = createAdminClient();

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("*")
    .eq("id", slug)
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
