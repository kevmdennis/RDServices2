import { getDisplayablePhotoUrls } from "@/lib/businesses/photos";

type BusinessPhotoThumbnailsProps = {
  photosJson: unknown;
  businessName: string | null;
};

export default function BusinessPhotoThumbnails({
  photosJson,
  businessName,
}: BusinessPhotoThumbnailsProps) {
  const photoUrls = getDisplayablePhotoUrls(photosJson);

  if (photoUrls.length === 0) {
    return <span className="text-zinc-400">—</span>;
  }

  const label = businessName ?? "Business";

  return (
    <div className="flex flex-wrap gap-1.5">
      {photoUrls.map((url, index) => (
        <img
          key={`${url}-${index}`}
          src={url}
          alt={`${label} photo ${index + 1}`}
          width={48}
          height={48}
          loading="lazy"
          className="h-12 w-12 rounded-md border border-zinc-200 object-cover"
        />
      ))}
    </div>
  );
}
