export type GooglePlacePhoto = {
  name?: string;
  widthPx?: number;
  heightPx?: number;
  authorAttributions?: unknown[];
};

export type ResolvedPlacePhoto = {
  name: string;
  media_url: string | null;
  width_px: number | null;
  height_px: number | null;
  author_attributions: unknown[] | null;
  error?: string;
};

export type BusinessPhotosJson = {
  photos: ResolvedPlacePhoto[];
  errors: string[];
};

export const MAX_PLACE_PHOTOS = 10;
export const PHOTO_MAX_WIDTH_PX = 1200;

type PlacePhotoMediaResponse = {
  name?: string;
  photoUri?: string;
};

type GooglePhotoMediaError = {
  error?: {
    message?: string;
    status?: string;
  };
};

export function buildPlacePhotoMediaUrl(photoName: string): string {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    throw new Error("Google Maps API key is not configured.");
  }

  const params = new URLSearchParams({
    maxWidthPx: String(PHOTO_MAX_WIDTH_PX),
    skipHttpRedirect: "true",
    key: apiKey,
  });

  return `https://places.googleapis.com/v1/${photoName}/media?${params.toString()}`;
}

export function buildPlacePhotoProxyUrl(photoName: string): string {
  return `/api/place-photo?photoName=${encodeURIComponent(photoName)}`;
}

export async function fetchPlacePhotoMediaUrl(
  photoName: string,
): Promise<string | null> {
  const mediaUrl = buildPlacePhotoMediaUrl(photoName);

  const response = await fetch(mediaUrl, {
    method: "GET",
    cache: "no-store",
  });

  const payload = (await response.json()) as
    | PlacePhotoMediaResponse
    | GooglePhotoMediaError;

  if (!response.ok) {
    const errorPayload = payload as GooglePhotoMediaError;
    throw new Error(
      errorPayload.error?.message ?? "Failed to fetch place photo media.",
    );
  }

  const successPayload = payload as PlacePhotoMediaResponse;
  return successPayload.photoUri ?? null;
}

export async function resolvePlacePhotos(
  photos: GooglePlacePhoto[],
): Promise<BusinessPhotosJson> {
  const seenNames = new Set<string>();
  const selectedPhotos = photos
    .filter((photo) => {
      if (typeof photo.name !== "string" || photo.name.length === 0) {
        return false;
      }

      if (seenNames.has(photo.name)) {
        return false;
      }

      seenNames.add(photo.name);
      return true;
    })
    .slice(0, MAX_PLACE_PHOTOS);

  if (selectedPhotos.length === 0) {
    return { photos: [], errors: [] };
  }

  const resolvedPhotos: ResolvedPlacePhoto[] = [];
  const errors: string[] = [];

  for (const photo of selectedPhotos) {
    const photoName = photo.name as string;

    try {
      const mediaUrl = await fetchPlacePhotoMediaUrl(photoName);

      resolvedPhotos.push({
        name: photoName,
        media_url: mediaUrl,
        width_px: photo.widthPx ?? null,
        height_px: photo.heightPx ?? null,
        author_attributions: photo.authorAttributions ?? null,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to resolve photo.";

      console.error(`[place-photos] Failed to resolve photo ${photoName}:`, message);

      errors.push(`${photoName}: ${message}`);

      resolvedPhotos.push({
        name: photoName,
        media_url: null,
        width_px: photo.widthPx ?? null,
        height_px: photo.heightPx ?? null,
        author_attributions: photo.authorAttributions ?? null,
        error: message,
      });
    }
  }

  return { photos: resolvedPhotos, errors };
}
