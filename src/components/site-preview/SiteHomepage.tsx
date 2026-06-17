import GeneratedWebsite from "@/components/site-preview/GeneratedWebsite";
import type { Site } from "@/lib/sites/types";
import type { Business } from "@/lib/supabase/types";

type SiteHomepageProps = {
  site: Site;
  business: Business;
  trackingEnabled?: boolean;
  debugTracking?: boolean;
  pageViewEventValue?: string;
  isPublicView?: boolean;
};

export default function SiteHomepage(props: SiteHomepageProps) {
  return <GeneratedWebsite {...props} />;
}
