import { NextResponse } from "next/server";
import {
  recordWebsiteEvent,
  TrackEventError,
} from "@/lib/analytics/track-event";
import type { WebsiteEventType } from "@/lib/analytics/types";

type TrackEventRequestBody = {
  siteId?: unknown;
  businessId?: unknown;
  eventType?: unknown;
  eventValue?: unknown;
  pageUrl?: unknown;
};

export async function POST(request: Request) {
  let body: TrackEventRequestBody;

  try {
    body = (await request.json()) as TrackEventRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  if (typeof body.siteId !== "string" || !body.siteId.trim()) {
    return NextResponse.json(
      { error: "A non-empty siteId string is required.", code: "INVALID_SITE_ID" },
      { status: 400 },
    );
  }

  if (typeof body.eventType !== "string" || !body.eventType.trim()) {
    return NextResponse.json(
      { error: "A non-empty eventType string is required.", code: "INVALID_EVENT_TYPE" },
      { status: 400 },
    );
  }

  try {
    await recordWebsiteEvent(
      {
        siteId: body.siteId.trim(),
        businessId:
          typeof body.businessId === "string" ? body.businessId.trim() : undefined,
        eventType: body.eventType.trim() as WebsiteEventType,
        eventValue:
          typeof body.eventValue === "string" ? body.eventValue.trim() : undefined,
        pageUrl: typeof body.pageUrl === "string" ? body.pageUrl.trim() : undefined,
      },
      {
        referrer: request.headers.get("referer"),
        userAgent: request.headers.get("user-agent"),
      },
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof TrackEventError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      { error: "Unexpected error while tracking event.", code: "INTERNAL_ERROR" },
      { status: 500 },
    );
  }
}
