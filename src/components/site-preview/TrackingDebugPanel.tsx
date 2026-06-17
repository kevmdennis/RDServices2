"use client";

import { useEffect, useState } from "react";
import { useTracking } from "@/hooks/useTracking";
import type { TrackingResultDetail } from "@/hooks/useTracking";

type TrackingDebugPanelProps = {
  siteId: string;
  businessId: string;
};

export default function TrackingDebugPanel({
  siteId,
  businessId,
}: TrackingDebugPanelProps) {
  const { trackEvent } = useTracking(siteId, businessId, { debug: true });
  const [lastEvent, setLastEvent] = useState<TrackingResultDetail | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    function handleTrackingResult(event: Event) {
      const customEvent = event as CustomEvent<TrackingResultDetail>;
      setLastEvent(customEvent.detail);
    }

    window.addEventListener("rd-tracking-result", handleTrackingResult);
    return () => window.removeEventListener("rd-tracking-result", handleTrackingResult);
  }, []);

  async function handleSendTestEvent() {
    setIsSendingTest(true);

    await trackEvent({
      eventType: "test_event",
      eventValue: "website_tracking_test",
    });

    setIsSendingTest(false);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-zinc-300 bg-white p-4 text-xs shadow-lg">
      <p className="font-semibold text-zinc-900">Tracking debug</p>
      <dl className="mt-3 space-y-1 text-zinc-700">
        <div className="flex justify-between gap-4">
          <dt className="font-medium">siteId</dt>
          <dd className="truncate font-mono">{siteId}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">businessId</dt>
          <dd className="truncate font-mono">{businessId}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Last event</dt>
          <dd>{lastEvent?.eventType ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-medium">Status</dt>
          <dd>
            {lastEvent == null
              ? "—"
              : lastEvent.success
                ? "success"
                : `failed${lastEvent.error ? `: ${lastEvent.error}` : ""}`}
          </dd>
        </div>
      </dl>
      <button
        type="button"
        onClick={handleSendTestEvent}
        disabled={isSendingTest}
        className="mt-4 w-full rounded-md bg-zinc-900 px-3 py-2 text-xs font-medium text-white enabled:hover:bg-zinc-700 disabled:opacity-50"
      >
        {isSendingTest ? "Sending..." : "Send Test Tracking Event"}
      </button>
    </div>
  );
}
