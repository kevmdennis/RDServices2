"use client";

import { useCallback } from "react";
import type { WebsiteEventType } from "@/lib/analytics/types";

type TrackEventParams = {
  eventType: WebsiteEventType;
  eventValue?: string;
};

export function useTracking(siteId: string, businessId?: string) {
  const trackEvent = useCallback(
    async ({ eventType, eventValue }: TrackEventParams) => {
      try {
        const pageUrl =
          typeof window !== "undefined" ? window.location.href : undefined;

        await fetch("/api/track-event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            siteId,
            businessId,
            eventType,
            eventValue,
            pageUrl,
          }),
          keepalive: true,
        });
      } catch {
        // Tracking should never block the website experience.
      }
    },
    [siteId, businessId],
  );

  return { trackEvent };
}
