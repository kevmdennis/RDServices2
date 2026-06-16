import { NextResponse } from "next/server";
import { fetchPlacePhotoMediaUrl } from "@/lib/google/place-photos";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const photoName = searchParams.get("photoName");

  if (!photoName?.trim()) {
    return NextResponse.json(
      { error: "photoName query parameter is required." },
      { status: 400 },
    );
  }

  const normalizedPhotoName = photoName.trim();

  if (
    !normalizedPhotoName.startsWith("places/") ||
    !normalizedPhotoName.includes("/photos/")
  ) {
    return NextResponse.json(
      { error: "Invalid photo resource name." },
      { status: 400 },
    );
  }

  try {
    const photoUri = await fetchPlacePhotoMediaUrl(normalizedPhotoName);

    if (!photoUri) {
      return NextResponse.json(
        { error: "Photo media URL was not returned by Google." },
        { status: 502 },
      );
    }

    return NextResponse.redirect(photoUri);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch place photo.";

    return NextResponse.json({ error: message }, { status: 502 });
  }
}
