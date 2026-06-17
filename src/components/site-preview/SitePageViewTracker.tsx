"use client";

import { useEffect, useRef } from "react";
import { useTracking } from "@/hooks/useTracking";

type SitePageViewTrackerProps = {
  siteId: string;
  businessId?: string;
  eventValue?: string;
  enabled?: boolean;
};

export default function SitePageViewTracker({
  siteId,
  businessId,
  eventValue,
  enabled = true,
}: SitePageViewTrackerProps) {
  const { trackEvent } = useTracking(siteId, businessId);
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!enabled || hasTracked.current) {
      return;
    }

    hasTracked.current = true;
    void trackEvent({
      eventType: "page_view",
      eventValue,
    });
  }, [enabled, trackEvent, eventValue]);

  return null;
}
