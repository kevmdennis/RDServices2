import {
  fetchGooglePlaceDetails,
} from "@/lib/google/places";
import {
  resolvePlacePhotos,
  type BusinessPhotosJson,
  type GooglePlacePhoto,
} from "@/lib/google/place-photos";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Business } from "@/lib/supabase/types";

export async function refreshBusinessPhotos(
  businessId: string,
): Promise<BusinessPhotosJson> {
  const supabase = createAdminClient();

  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id, place_id")
    .eq("id", businessId)
    .single<Pick<Business, "id" | "place_id">>();

  if (businessError || !business) {
    throw new Error("Business not found.");
  }

  const photosJson = await fetchAndResolvePlacePhotos(business.place_id);

  const { error: updateError } = await supabase
    .from("businesses")
    .update({ photos_json: photosJson })
    .eq("id", businessId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  return photosJson;
}

async function fetchAndResolvePlacePhotos(
  placeId: string,
): Promise<BusinessPhotosJson> {
  const googlePlace = await fetchGooglePlaceDetails(placeId);

  try {
    return await resolvePlacePhotos(
      (googlePlace.photos ?? []) as GooglePlacePhoto[],
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to resolve place photos.";

    console.error("[refresh-photos] Photo resolution failed:", message);

    return {
      photos: [],
      errors: [message],
    };
  }
}
