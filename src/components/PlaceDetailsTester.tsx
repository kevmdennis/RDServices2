"use client";

import { useState } from "react";
import type { NormalizedPlaceDetails } from "@/lib/google/places";

type PlaceDetailsErrorResponse = {
  error: string;
  code?: string;
};

export default function PlaceDetailsTester() {
  const [placeId, setPlaceId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NormalizedPlaceDetails | null>(null);

  async function handleTestPlaceDetails() {
    const trimmedPlaceId = placeId.trim();

    if (!trimmedPlaceId) {
      setError("Enter a Place ID to test.");
      setResult(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/place-details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ placeId: trimmedPlaceId }),
      });

      const payload = (await response.json()) as
        | NormalizedPlaceDetails
        | PlaceDetailsErrorResponse;

      if (!response.ok) {
        const errorPayload = payload as PlaceDetailsErrorResponse;
        setError(errorPayload.error ?? "Failed to fetch place details.");
        return;
      }

      setResult(payload as NormalizedPlaceDetails);
    } catch {
      setError("Network error while calling the place details API.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-1">
        <h2 className="text-lg font-medium text-zinc-900">
          Test Place Details
        </h2>
        <p className="text-sm text-zinc-600">
          Fetch Google Places details for a single Place ID without saving to
          Supabase.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label
            htmlFor="test-place-id"
            className="mb-2 block text-sm font-medium text-zinc-700"
          >
            Place ID
          </label>
          <input
            id="test-place-id"
            type="text"
            value={placeId}
            onChange={(event) => setPlaceId(event.target.value)}
            placeholder="ChIJ..."
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          />
        </div>
        <button
          type="button"
          onClick={handleTestPlaceDetails}
          disabled={isLoading}
          className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors enabled:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
        >
          {isLoading ? "Loading..." : "Test Place Details"}
        </button>
      </div>

      {isLoading && (
        <p className="mt-4 text-sm text-zinc-600">Fetching place details...</p>
      )}

      {error && (
        <div
          className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-zinc-700">
            Normalized response
          </p>
          <pre className="overflow-x-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-xs leading-relaxed text-zinc-800">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
