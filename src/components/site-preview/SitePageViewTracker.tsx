"use client";

import { useEffect, useRef } from "react";
import { useTracking } from "@/hooks/useTracking";

type SitePageViewTrackerProps = {
  siteId: string;
  businessId?: string;
};

export default function SitePageViewTracker({
  siteId,
  businessId,
}: SitePageViewTrackerProps) {
  const { trackEvent } = useTracking(siteId, businessId);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (hasTracked.current) {
      return;
    }

    hasTracked.current = true;
    void trackEvent({ eventType: "page_view" });
  }, [trackEvent]);

  return null;
}
