import type { BusinessPhotosJson, ResolvedPlacePhoto } from "@/lib/google/place-photos";
import { buildPlacePhotoProxyUrl } from "@/lib/google/place-photos";

export function parseBusinessPhotosJson(
  photosJson: unknown,
): BusinessPhotosJson | null {
  if (!photosJson) {
    return null;
  }

  if (Array.isArray(photosJson)) {
    const photos = photosJson
      .filter(
        (photo): photo is { name?: string; widthPx?: number; heightPx?: number; authorAttributions?: unknown[] } =>
          typeof photo === "object" && photo !== null,
      )
      .filter((photo) => typeof photo.name === "string" && photo.name.length > 0)
      .map((photo) => ({
        name: photo.name as string,
        media_url: null,
        width_px: photo.widthPx ?? null,
        height_px: photo.heightPx ?? null,
        author_attributions: photo.authorAttributions ?? null,
      }));

    return { photos, errors: [] };
  }

  if (typeof photosJson !== "object") {
    return null;
  }

  const value = photosJson as Partial<BusinessPhotosJson>;

  if (!Array.isArray(value.photos)) {
    return null;
  }

  return {
    photos: value.photos,
    errors: Array.isArray(value.errors) ? value.errors : [],
  };
}

export function getDisplayablePhotoUrls(photosJson: unknown): string[] {
  const parsed = parseBusinessPhotosJson(photosJson);

  if (!parsed) {
    return [];
  }

  const seenUrls = new Set<string>();

  return parsed.photos
    .map((photo) => getPhotoDisplayUrl(photo))
    .filter((url): url is string => {
      if (!url || seenUrls.has(url)) {
        return false;
      }

      seenUrls.add(url);
      return true;
    });
}

export function getPhotoDisplayUrl(photo: ResolvedPlacePhoto): string | null {
  if (photo.media_url) {
    return photo.media_url;
  }

  if (photo.name) {
    return buildPlacePhotoProxyUrl(photo.name);
  }

  return null;
}
