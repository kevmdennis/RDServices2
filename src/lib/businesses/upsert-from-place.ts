import {
  fetchGooglePlaceDetails,
  normalizePlaceDetails,
  PlaceDetailsError,
  validatePlaceId,
  type GooglePlaceDetails,
} from "@/lib/google/places";
import {
  resolvePlacePhotos,
  type GooglePlacePhoto,
} from "@/lib/google/place-photos";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Business } from "@/lib/supabase/types";

export async function upsertBusinessFromPlaceId(
  placeId: string,
): Promise<Business> {
  const validatedPlaceId = validatePlaceId(placeId);

  if (!validatedPlaceId) {
    throw new Error("A valid place ID is required.");
  }

  const googlePlace = await fetchGooglePlaceDetails(validatedPlaceId);
  const normalized = normalizePlaceDetails(googlePlace);
  const photosJson = await resolvePlacePhotosSafely(googlePlace);

  const supabase = createAdminClient();

  const { data: business, error } = await supabase
    .from("businesses")
    .upsert(
      {
        place_id: normalized.place_id,
        name: normalized.name,
        address: normalized.address,
        phone: normalized.phone,
        website: normalized.website,
        google_maps_uri: normalized.google_maps_uri,
        rating: normalized.rating,
        review_count: normalized.review_count,
        hours_json: normalized.hours_json,
        reviews_json: normalized.reviews_json,
        photos_json: photosJson,
        raw_place_json: normalized.raw_place_json,
      },
      { onConflict: "place_id" },
    )
    .select("*")
    .single<Business>();

  if (error || !business) {
    throw new Error(error?.message ?? "Failed to save business.");
  }

  return business;
}

async function resolvePlacePhotosSafely(
  googlePlace: GooglePlaceDetails,
) {
  try {
    return await resolvePlacePhotos(
      (googlePlace.photos ?? []) as GooglePlacePhoto[],
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve place photos.";

    console.error("[upsert-from-place] Photo resolution failed:", message);

    return {
      photos: [],
      errors: [message],
    };
  }
}

export function getPlaceDetailsErrorMessage(error: unknown): string {
  if (error instanceof PlaceDetailsError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to fetch and save business data.";
}
