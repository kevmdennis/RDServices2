import { NextResponse } from "next/server";
import {
  fetchGooglePlaceDetails,
  normalizePlaceDetails,
  PlaceDetailsError,
  validatePlaceId,
} from "@/lib/google/places";

type PlaceDetailsRequestBody = {
  placeId?: unknown;
};

export async function POST(request: Request) {
  let body: PlaceDetailsRequestBody;

  try {
    body = (await request.json()) as PlaceDetailsRequestBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body.", code: "INVALID_JSON" },
      { status: 400 },
    );
  }

  const placeId = validatePlaceId(body.placeId);

  if (!placeId) {
    return NextResponse.json(
      {
        error: "A non-empty placeId string is required.",
        code: "INVALID_PLACE_ID",
      },
      { status: 400 },
    );
  }

  try {
    const place = await fetchGooglePlaceDetails(placeId);
    const normalized = normalizePlaceDetails(place);

    return NextResponse.json(normalized);
  } catch (error) {
    if (error instanceof PlaceDetailsError) {
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.statusCode },
      );
    }

    return NextResponse.json(
      {
        error: "Unexpected error while fetching place details.",
        code: "INTERNAL_ERROR",
      },
      { status: 500 },
    );
  }
}
