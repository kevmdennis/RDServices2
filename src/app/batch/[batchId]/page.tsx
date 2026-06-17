import Link from "next/link";
import { notFound } from "next/navigation";
import BatchDashboard from "@/components/BatchDashboard";
import PlaceDetailsTester from "@/components/PlaceDetailsTester";
import {
  getMetricsForSite,
  getSiteMetricsBySiteIds,
  summarizeBatchMetrics,
} from "@/lib/analytics/metrics";
import { getSiteSummariesBySiteIds } from "@/lib/batches/site-publishing";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  Batch,
  BatchItem,
  BatchItemWithBusiness,
  Business,
} from "@/lib/supabase/types";

type BatchPageProps = {
  params: Promise<{ batchId: string }>;
};

export default async function BatchPage({ params }: BatchPageProps) {
  const { batchId } = await params;
  const supabase = createAdminClient();

  const { data: batch, error: batchError } = await supabase
    .from("batches")
    .select("*")
    .eq("id", batchId)
    .single<Batch>();

  if (batchError || !batch) {
    notFound();
  }

  const { data: batchItems, error: itemsError } = await supabase
    .from("batch_items")
    .select("*")
    .eq("batch_id", batchId)
    .order("created_at", { ascending: true })
    .returns<BatchItem[]>();

  if (itemsError) {
    throw new Error(itemsError.message);
  }

  const businessIds = (batchItems ?? [])
    .map((item) => item.business_id)
    .filter((id): id is string => id !== null);

  const businessById = new Map<
    string,
    Pick<Business, "id" | "name" | "address" | "phone" | "rating" | "photos_json">
  >();

  if (businessIds.length > 0) {
    const { data: businesses, error: businessesError } = await supabase
      .from("businesses")
      .select("id, name, address, phone, rating, photos_json")
      .in("id", businessIds);

    if (businessesError) {
      throw new Error(businessesError.message);
    }

    for (const business of businesses ?? []) {
      businessById.set(business.id, business);
    }
  }

  const itemsWithBusiness: BatchItemWithBusiness[] = (batchItems ?? []).map(
    (item) => ({
      ...item,
      business: item.business_id
        ? businessById.get(item.business_id) ?? null
        : null,
    }),
  );

  const siteIds = itemsWithBusiness
    .map((item) => item.site_id)
    .filter((siteId): siteId is string => siteId !== null);

  const metricsBySiteId = await getSiteMetricsBySiteIds(siteIds);
  const metricsSummary = summarizeBatchMetrics(metricsBySiteId);
  const siteById = await getSiteSummariesBySiteIds(siteIds);

  const itemsWithMetrics = itemsWithBusiness.map((item) => ({
    ...item,
    metrics: item.site_id ? getMetricsForSite(metricsBySiteId, item.site_id) : null,
    site: item.site_id ? siteById.get(item.site_id) ?? null : null,
  }));

  return (
    <main className="min-h-full bg-zinc-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-12">
        <header className="flex flex-col gap-4">
          <Link
            href="/"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            ← Back to upload
          </Link>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              Batch Details
            </h1>
            <p className="text-zinc-600">
              Review saved Place IDs and processing status for this upload.
            </p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <InfoCard label="Filename" value={batch.filename} />
          <InfoCard
            label="Total rows"
            value={String(batch.total_rows)}
          />
          <InfoCard label="Batch status" value={batch.status} />
        </section>

        <BatchDashboard
          batch={batch}
          initialItems={itemsWithMetrics}
          initialMetricsSummary={metricsSummary}
        />

        <PlaceDetailsTester />
      </div>
    </main>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-zinc-600">{label}</p>
      <p className="mt-1 text-lg font-semibold text-zinc-900 break-all">
        {value}
      </p>
    </div>
  );
}
