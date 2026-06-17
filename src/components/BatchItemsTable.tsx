"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { fetchBusinessData, generateWebsite, refreshPhotos } from "@/app/actions/batch-item";
import BusinessPhotoThumbnails from "@/components/BusinessPhotoThumbnails";
import CopyPublicLinkButton from "@/components/CopyPublicLinkButton";
import type { BatchItemWithBusiness } from "@/lib/supabase/types";

function formatLastViewed(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

type BatchItemsTableProps = {
  items: BatchItemWithBusiness[];
  disableActions?: boolean;
};

type ActiveAction = "fetch" | "generate" | "refreshPhotos" | null;

export default function BatchItemsTable({
  items,
  disableActions = false,
}: BatchItemsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeItemId, setActiveItemId] = useState<string | null>(null);
  const [activeAction, setActiveAction] = useState<ActiveAction>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  function handleFetchBusinessData(batchItemId: string) {
    setActionError(null);
    setActiveItemId(batchItemId);
    setActiveAction("fetch");

    startTransition(async () => {
      const result = await fetchBusinessData(batchItemId);

      if (!result.success) {
        setActionError(result.error);
      }

      setActiveItemId(null);
      setActiveAction(null);
      router.refresh();
    });
  }

  function handleGenerateWebsite(batchItemId: string) {
    setActionError(null);
    setActiveItemId(batchItemId);
    setActiveAction("generate");

    startTransition(async () => {
      const result = await generateWebsite(batchItemId);

      if (!result.success) {
        setActionError(result.error);
      }

      setActiveItemId(null);
      setActiveAction(null);
      router.refresh();
    });
  }

  function handleRefreshPhotos(batchItemId: string) {
    setActionError(null);
    setActiveItemId(batchItemId);
    setActiveAction("refreshPhotos");

    startTransition(async () => {
      const result = await refreshPhotos(batchItemId);

      if (!result.success) {
        setActionError(result.error);
      }

      setActiveItemId(null);
      setActiveAction(null);
      router.refresh();
    });
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-medium text-zinc-900">
          Batch items ({items.length})
        </h2>
      </div>

      {actionError && (
        <div
          className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {actionError}
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-3 font-medium text-zinc-700">#</th>
              <th className="px-4 py-3 font-medium text-zinc-700">Place ID</th>
              <th className="px-4 py-3 font-medium text-zinc-700">
                Business name
              </th>
              <th className="px-4 py-3 font-medium text-zinc-700">Rating</th>
              <th className="px-4 py-3 font-medium text-zinc-700">Address</th>
              <th className="px-4 py-3 font-medium text-zinc-700">Phone</th>
              <th className="hidden px-4 py-3 font-medium text-zinc-700 lg:table-cell">
                Photos
              </th>
              <th className="px-4 py-3 font-medium text-zinc-700">Status</th>
              <th className="hidden px-4 py-3 font-medium text-zinc-700 xl:table-cell">
                Views
              </th>
              <th className="hidden px-4 py-3 font-medium text-zinc-700 xl:table-cell">
                Phone
              </th>
              <th className="hidden px-4 py-3 font-medium text-zinc-700 xl:table-cell">
                Maps
              </th>
              <th className="hidden px-4 py-3 font-medium text-zinc-700 xl:table-cell">
                Website
              </th>
              <th className="hidden px-4 py-3 font-medium text-zinc-700 xl:table-cell">
                Score
              </th>
              <th className="hidden px-4 py-3 font-medium text-zinc-700 2xl:table-cell">
                Last viewed
              </th>
              <th className="px-4 py-3 font-medium text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 bg-white">
            {items.map((item, index) => {
              const business = item.business;
              const isActive = isPending && activeItemId === item.id;
              const isFetching = isActive && activeAction === "fetch";
              const isGenerating = isActive && activeAction === "generate";
              const isRefreshingPhotos =
                isActive && activeAction === "refreshPhotos";
              const metrics = item.metrics;
              const site = item.site;
              const publicWebsiteHref = site?.slug ? `/website/${site.slug}` : null;

              return (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-zinc-500">{index + 1}</td>
                  <td className="px-4 py-3 font-mono text-zinc-800">
                    {item.place_id}
                  </td>
                  <td className="px-4 py-3 text-zinc-800">
                    {business?.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-800">
                    {business?.rating != null ? business.rating : "—"}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-zinc-800">
                    {business?.address ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-zinc-800">
                    {business?.phone ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {business ? (
                      <BusinessPhotoThumbnails
                        photosJson={business.photos_json}
                        businessName={business.name}
                      />
                    ) : (
                      <span className="text-zinc-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                    {item.error && (
                      <p className="mt-1 max-w-xs text-xs text-red-600">
                        {item.error}
                      </p>
                    )}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-800 xl:table-cell">
                    {metrics?.total_views ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-800 xl:table-cell">
                    {metrics?.phone_clicks ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-800 xl:table-cell">
                    {metrics?.maps_clicks ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-800 xl:table-cell">
                    {metrics?.website_clicks ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 font-medium text-zinc-900 xl:table-cell">
                    {metrics?.engagement_score ?? "—"}
                  </td>
                  <td className="hidden px-4 py-3 text-zinc-600 2xl:table-cell">
                    {formatLastViewed(metrics?.last_viewed_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-2">
                      {item.status === "pending" && (
                        <button
                          type="button"
                          onClick={() => handleFetchBusinessData(item.id)}
                          disabled={isPending || disableActions}
                          className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors enabled:hover:bg-zinc-700 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:text-zinc-500"
                        >
                          {isFetching ? "Fetching..." : "Fetch Business Data"}
                        </button>
                      )}
                      {item.status === "business_data_saved" && (
                        <button
                          type="button"
                          onClick={() => handleGenerateWebsite(item.id)}
                          disabled={isPending || disableActions}
                          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 transition-colors enabled:hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isGenerating ? "Generating..." : "Generate Website"}
                        </button>
                      )}
                      {item.business_id && (
                        <button
                          type="button"
                          onClick={() => handleRefreshPhotos(item.id)}
                          disabled={isPending || disableActions}
                          className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors enabled:hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isRefreshingPhotos
                            ? "Refreshing..."
                            : "Refresh Photos"}
                        </button>
                      )}
                      {item.status === "complete" && item.site_id && (
                        <>
                          <Link
                            href={`/site/${item.site_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-medium text-blue-700 hover:text-blue-900"
                          >
                            View Internal Preview
                          </Link>
                          {publicWebsiteHref ? (
                            <Link
                              href={publicWebsiteHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-medium text-sky-700 hover:text-sky-900"
                            >
                              View Public Website
                            </Link>
                          ) : (
                            <span className="text-xs text-zinc-400">
                              Public link pending
                            </span>
                          )}
                          <CopyPublicLinkButton publicUrl={site?.public_url} />
                          <Link
                            href={`/analytics/${item.site_id}`}
                            className="text-xs font-medium text-violet-700 hover:text-violet-900"
                          >
                            View Analytics
                          </Link>
                        </>
                      )}
                      {item.status !== "pending" &&
                        item.status !== "business_data_saved" &&
                        item.status !== "complete" && (
                          <span className="text-xs text-zinc-400">—</span>
                        )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function StatusBadge({ status }: { status: string }) {
  const toneClasses: Record<string, string> = {
    pending: "bg-amber-100 text-amber-800",
    fetching_place_details: "bg-blue-100 text-blue-800",
    business_data_saved: "bg-emerald-100 text-emerald-800",
    generating_site: "bg-blue-100 text-blue-800",
    complete: "bg-emerald-100 text-emerald-800",
    failed: "bg-red-100 text-red-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-emerald-100 text-emerald-800",
  };

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
        toneClasses[status] ?? "bg-zinc-100 text-zinc-800"
      }`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
