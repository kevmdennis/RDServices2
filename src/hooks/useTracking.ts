"use client";

import { useCallback } from "react";
import type { WebsiteEventType } from "@/lib/analytics/types";

export type TrackingResultDetail = {
  success: boolean;
  eventType: WebsiteEventType | "test_event";
  eventValue?: string;
  error?: string;
};

type TrackEventParams = {
  eventType: WebsiteEventType | "test_event";
  eventValue?: string;
};

type UseTrackingOptions = {
  debug?: boolean;
};

function shouldEmitDebugEvent(debug?: boolean): boolean {
  if (debug) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("debugTracking") === "true";
}

function emitTrackingResult(detail: TrackingResultDetail) {
  window.dispatchEvent(new CustomEvent("rd-tracking-result", { detail }));
}

export function useTracking(
  siteId: string,
  businessId?: string,
  options: UseTrackingOptions = {},
) {
  const trackEvent = useCallback(
    async ({ eventType, eventValue }: TrackEventParams) => {
      const emitDebug = shouldEmitDebugEvent(options.debug);
      const pageUrl =
        typeof window !== "undefined" ? window.location.href : undefined;

      try {
        const response = await fetch("/api/track-event", {
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

        if (emitDebug) {
          let error: string | undefined;

          if (!response.ok) {
            try {
              const payload = (await response.json()) as { error?: string };
              error = payload.error ?? `HTTP ${response.status}`;
            } catch {
              error = `HTTP ${response.status}`;
            }
          }

          emitTrackingResult({
            success: response.ok,
            eventType,
            eventValue,
            error,
          });
        }

        if (process.env.NODE_ENV === "development" && !response.ok) {
          console.warn("[tracking] Event failed:", eventType, response.status);
        }
      } catch (error) {
        if (emitDebug) {
          emitTrackingResult({
            success: false,
            eventType,
            eventValue,
            error: error instanceof Error ? error.message : "Network error",
          });
        }

        if (process.env.NODE_ENV === "development") {
          console.warn("[tracking] Event error:", eventType, error);
        }
      }
    },
    [siteId, businessId, options.debug],
  );

  return { trackEvent };
}
