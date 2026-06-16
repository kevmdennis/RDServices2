"use client";

import type { ComponentProps } from "react";
import { useTracking } from "@/hooks/useTracking";
import type { WebsiteEventType } from "@/lib/analytics/types";

type TrackedLinkProps = ComponentProps<"a"> & {
  siteId: string;
  businessId?: string;
  eventType: WebsiteEventType;
  eventValue?: string;
};

export default function TrackedLink({
  siteId,
  businessId,
  eventType,
  eventValue,
  onClick,
  children,
  ...props
}: TrackedLinkProps) {
  const { trackEvent } = useTracking(siteId, businessId);

  return (
    <a
      {...props}
      onClick={(event) => {
        void trackEvent({ eventType, eventValue });
        onClick?.(event);
      }}
    >
      {children}
    </a>
  );
}
