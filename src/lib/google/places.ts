import type { GooglePlacePhoto } from "@/lib/google/place-photos";

const FIELD_MASK =
  "id,displayName,formattedAddress,nationalPhoneNumber,internationalPhoneNumber,websiteUri,googleMapsUri,rating,userRatingCount,regularOpeningHours,reviews,photos,businessStatus,types,primaryType,location";

export type GooglePlaceDetails = {
  id?: string;
  displayName?: {
    text?: string;
    languageCode?: string;
  };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: unknown;
  reviews?: unknown[];
  photos?: GooglePlacePhoto[];
  businessStatus?: string;
  types?: string[];
  primaryType?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
};

export type NormalizedPlaceDetails = {
  place_id: string;
  name: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  google_maps_uri: string | null;
  rating: number | null;
  review_count: number | null;
  hours_json: unknown | null;
  reviews_json: unknown[] | null;
  photos_json: unknown[] | null;
  types: string[] | null;
  primary_type: string | null;
  raw_place_json: GooglePlaceDetails;
};

export type GooglePlacesApiError = {
  error?: {
    code?: number;
    message?: string;
    status?: string;
    details?: Array<{
      "@type"?: string;
      reason?: string;
      domain?: string;
      metadata?: Record<string, string>;
    }>;
  };
};

export function validatePlaceId(placeId: unknown): string | null {
  if (typeof placeId !== "string") {
    return null;
  }

  const trimmed = placeId.trim();

  if (!trimmed) {
    return null;
  }

  return trimmed.replace(/^places\//, "");
}

export function normalizePlaceDetails(
  place: GooglePlaceDetails,
): NormalizedPlaceDetails {
  const placeId = place.id?.replace(/^places\//, "") ?? "";

  return {
    place_id: placeId,
    name: place.displayName?.text ?? null,
    address: place.formattedAddress ?? null,
    phone:
      place.nationalPhoneNumber ?? place.internationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    google_maps_uri: place.googleMapsUri ?? null,
    rating: place.rating ?? null,
    review_count: place.userRatingCount ?? null,
    hours_json: place.regularOpeningHours ?? null,
    reviews_json: place.reviews ?? null,
    photos_json: place.photos ?? null,
    types: place.types ?? null,
    primary_type: place.primaryType ?? null,
    raw_place_json: place,
  };
}

export async function fetchGooglePlaceDetails(
  placeId: string,
): Promise<GooglePlaceDetails> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new PlaceDetailsError(
      "Google Maps API key is not configured.",
      500,
      "MISSING_API_KEY",
    );
  }

  const encodedPlaceId = encodeURIComponent(placeId);
  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodedPlaceId}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
      cache: "no-store",
    },
  );

  const payload = (await response.json()) as
    | GooglePlaceDetails
    | GooglePlacesApiError;

  if (!response.ok) {
    const googleError = payload as GooglePlacesApiError;
    const status = googleError.error?.status ?? "GOOGLE_API_ERROR";
    const message = formatGoogleErrorMessage(googleError);
    const statusCode = mapGoogleErrorToStatusCode(response.status, status);

    throw new PlaceDetailsError(message, statusCode, status);
  }

  return payload as GooglePlaceDetails;
}

export class PlaceDetailsError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message);
    this.name = "PlaceDetailsError";
  }
}

function mapGoogleErrorToStatusCode(
  httpStatus: number,
  googleStatus: string,
): number {
  if (googleStatus === "NOT_FOUND" || httpStatus === 404) {
    return 404;
  }

  if (
    googleStatus === "INVALID_ARGUMENT" ||
    googleStatus === "FAILED_PRECONDITION"
  ) {
    return 400;
  }

  if (googleStatus === "PERMISSION_DENIED" || httpStatus === 403) {
    return 403;
  }

  if (httpStatus >= 400 && httpStatus < 500) {
    return httpStatus;
  }

  return 502;
}

function formatGoogleErrorMessage(error: GooglePlacesApiError): string {
  const baseMessage =
    error.error?.message ?? "Failed to fetch place details from Google.";
  const blockedReason = error.error?.details?.find(
    (detail) => detail.reason === "API_KEY_SERVICE_BLOCKED",
  );

  if (blockedReason) {
    return [
      "Google Places API (New) is blocked for this API key.",
      "In Google Cloud Console: (1) enable Places API (New), (2) confirm billing is active,",
      "(3) edit the API key and add Places API (New) under API restrictions,",
      "(4) for server-side use, set Application restrictions to None or IP addresses (not HTTP referrers).",
    ].join(" ");
  }

  return baseMessage;
}
