import { notFound } from "next/navigation";
import GeneratedWebsite from "@/components/site-preview/GeneratedWebsite";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Site } from "@/lib/sites/types";
import type { Business } from "@/lib/supabase/types";

type DemoPageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ debugTracking?: string }>;
};

export default async function DemoPage({ params, searchParams }: DemoPageProps) {
  const { slug } = await params;
  const { debugTracking } = await searchParams;
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

  return (
    <GeneratedWebsite
      site={site}
      business={business}
      trackingEnabled={true}
      debugTracking={debugTracking === "true"}
    />
  );
}
