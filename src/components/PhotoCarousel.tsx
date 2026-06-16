"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import TrackedButton from "@/components/site-preview/TrackedButton";

type PhotoCarouselProps = {
  photos: string[];
  businessName: string;
  siteId?: string;
  businessId?: string;
};

const AUTO_SCROLL_MS = 5000;

function getSlidesPerView(width: number): number {
  if (width >= 1024) {
    return 3;
  }

  if (width >= 768) {
    return 2;
  }

  return 1;
}

export default function PhotoCarousel({
  photos,
  businessName,
  siteId,
  businessId,
}: PhotoCarouselProps) {
  const uniquePhotos = useMemo(
    () => [...new Set(photos.filter((photo) => photo.trim().length > 0))],
    [photos],
  );

  if (uniquePhotos.length === 0) {
    return null;
  }

  if (uniquePhotos.length === 1) {
    return (
      <section className="border-b border-zinc-200 bg-zinc-50 py-8 sm:py-10">
        <div className="mx-auto flex max-w-6xl justify-center px-4 sm:px-6">
          <img
            src={uniquePhotos[0]}
            alt={`${businessName} photo`}
            loading="lazy"
            className="h-64 w-full max-w-2xl rounded-2xl object-cover sm:h-72 lg:h-80"
          />
        </div>
      </section>
    );
  }

  if (uniquePhotos.length === 2) {
    return (
      <section className="border-b border-zinc-200 bg-zinc-50 py-8 sm:py-10">
        <div className="mx-auto hidden max-w-6xl gap-4 px-4 sm:px-6 md:grid md:grid-cols-2">
          {uniquePhotos.map((photo, index) => (
            <img
              key={`${photo}-${index}`}
              src={photo}
              alt={`${businessName} photo ${index + 1}`}
              loading="lazy"
              className="h-64 w-full rounded-2xl object-cover sm:h-72 lg:h-80"
            />
          ))}
        </div>
        <div className="md:hidden">
          <CarouselTrack
            photos={uniquePhotos}
            businessName={businessName}
            siteId={siteId}
            businessId={businessId}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="border-b border-zinc-200 bg-zinc-50 py-8 sm:py-10">
      <CarouselTrack
        photos={uniquePhotos}
        businessName={businessName}
        siteId={siteId}
        businessId={businessId}
      />
    </section>
  );
}

function CarouselTrack({
  photos,
  businessName,
  siteId,
  businessId,
}: {
  photos: string[];
  businessName: string;
  siteId?: string;
  businessId?: string;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slidesPerView, setSlidesPerView] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const updateSlidesPerView = () => {
      setSlidesPerView(getSlidesPerView(window.innerWidth));
    };

    updateSlidesPerView();
    window.addEventListener("resize", updateSlidesPerView);

    return () => window.removeEventListener("resize", updateSlidesPerView);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [slidesPerView, photos.length]);

  const canScroll = photos.length > slidesPerView;
  const totalDots = canScroll ? photos.length : 1;

  const goTo = useCallback(
    (index: number) => {
      if (isAnimating) {
        return;
      }

      setIsAnimating(true);
      setCurrentIndex((index + photos.length) % photos.length);
      window.setTimeout(() => setIsAnimating(false), 500);
    },
    [isAnimating, photos.length],
  );

  const goNext = useCallback(() => {
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const goPrev = useCallback(() => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  useEffect(() => {
    if (!canScroll || isPaused) {
      return;
    }

    const intervalId = window.setInterval(goNext, AUTO_SCROLL_MS);
    return () => window.clearInterval(intervalId);
  }, [canScroll, isPaused, goNext]);

  const visiblePhotos = Array.from({ length: slidesPerView }, (_, offset) => {
    return photos[(currentIndex + offset) % photos.length];
  });

  return (
    <div
      className="mx-auto max-w-6xl px-4 sm:px-6"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative">
        {canScroll && (
          <>
            {siteId ? (
              <TrackedButton
                type="button"
                onClick={goPrev}
                siteId={siteId}
                businessId={businessId}
                eventType="gallery_interaction"
                eventValue="previous"
                aria-label="Previous photos"
                className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2 text-zinc-700 shadow-md transition hover:bg-zinc-50"
              >
                ←
              </TrackedButton>
            ) : (
              <button
                type="button"
                onClick={goPrev}
                aria-label="Previous photos"
                className="absolute left-0 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border border-zinc-200 bg-white p-2 text-zinc-700 shadow-md transition hover:bg-zinc-50"
              >
                ←
              </button>
            )}
            {siteId ? (
              <TrackedButton
                type="button"
                onClick={goNext}
                siteId={siteId}
                businessId={businessId}
                eventType="gallery_interaction"
                eventValue="next"
                aria-label="Next photos"
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 rounded-full border border-zinc-200 bg-white p-2 text-zinc-700 shadow-md transition hover:bg-zinc-50"
              >
                →
              </TrackedButton>
            ) : (
              <button
                type="button"
                onClick={goNext}
                aria-label="Next photos"
                className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 rounded-full border border-zinc-200 bg-white p-2 text-zinc-700 shadow-md transition hover:bg-zinc-50"
              >
                →
              </button>
            )}
          </>
        )}

        <div className="overflow-hidden">
          <div
            className={`grid gap-4 transition-transform duration-500 ease-in-out ${
              slidesPerView === 3
                ? "grid-cols-3"
                : slidesPerView === 2
                  ? "grid-cols-2"
                  : "grid-cols-1"
            }`}
          >
            {visiblePhotos.map((photo, index) => (
              <img
                key={`${photo}-${currentIndex}-${index}`}
                src={photo}
                alt={`${businessName} photo ${index + 1}`}
                loading="lazy"
                className="h-64 w-full rounded-2xl object-cover sm:h-72 lg:h-80"
              />
            ))}
          </div>
        </div>
      </div>

      {canScroll && (
        <div className="mt-5 flex items-center justify-center gap-2">
          {Array.from({ length: totalDots }, (_, index) =>
            siteId ? (
              <TrackedButton
                key={`dot-${index}`}
                type="button"
                aria-label={`Go to photo ${index + 1}`}
                onClick={() => goTo(index)}
                siteId={siteId}
                businessId={businessId}
                eventType="gallery_interaction"
                eventValue={`dot_${index + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-zinc-900"
                    : "w-2.5 bg-zinc-300 hover:bg-zinc-400"
                }`}
              />
            ) : (
              <button
                key={`dot-${index}`}
                type="button"
                aria-label={`Go to photo ${index + 1}`}
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all ${
                  index === currentIndex
                    ? "w-8 bg-zinc-900"
                    : "w-2.5 bg-zinc-300 hover:bg-zinc-400"
                }`}
              />
            ),
          )}
        </div>
      )}
    </div>
  );
}
