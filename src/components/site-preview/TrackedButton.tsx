"use client";

import type { ComponentProps } from "react";
import { useTracking } from "@/hooks/useTracking";
import type { WebsiteEventType } from "@/lib/analytics/types";

type TrackedButtonProps = ComponentProps<"button"> & {
  siteId: string;
  businessId?: string;
  eventType: WebsiteEventType;
  eventValue?: string;
};

export default function TrackedButton({
  siteId,
  businessId,
  eventType,
  eventValue,
  onClick,
  children,
  ...props
}: TrackedButtonProps) {
  const { trackEvent } = useTracking(siteId, businessId);

  return (
    <button
      {...props}
      onClick={(event) => {
        void trackEvent({ eventType, eventValue });
        onClick?.(event);
      }}
    >
      {children}
    </button>
  );
}
