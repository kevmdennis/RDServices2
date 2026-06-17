import Link from "next/link";
import { notFound } from "next/navigation";
import { ENGAGEMENT_SCORE_EXPLANATION } from "@/lib/analytics/engagement-score";
import { getMetricsForSite, getSiteMetricsBySiteIds } from "@/lib/analytics/metrics";
import type { WebsiteEvent } from "@/lib/analytics/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Site } from "@/lib/sites/types";

type AnalyticsPageProps = {
  params: Promise<{ siteId: string }>;
};

function formatEventLabel(eventType: string): string {
  return eventType.replaceAll("_", " ");
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { siteId } = await params;
  const supabase = createAdminClient();

  const { data: site, error: siteError } = await supabase
    .from("sites")
    .select("id, business_id, business_name, slug, public_url")
    .eq("id", siteId)
    .single<Pick<Site, "id" | "business_id" | "business_name" | "slug" | "public_url">>();

  if (siteError || !site) {
    notFound();
  }

  const metricsBySiteId = await getSiteMetricsBySiteIds([siteId]);
  const metrics = getMetricsForSite(metricsBySiteId, siteId);

  const { data: events, error: eventsError } = await supabase
    .from("website_events")
    .select("*")
    .eq("site_id", siteId)
    .order("created_at", { ascending: false })
    .limit(100)
    .returns<WebsiteEvent[]>();

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  const businessName = site.business_name ?? "Local Business";

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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-500">Website analytics</p>
              <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
                {businessName}
              </h1>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <Link
                href={`/site/${siteId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-700 hover:text-blue-900"
              >
                Internal preview →
              </Link>
              {site.public_url && (
                <Link
                  href={site.public_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-sky-700 hover:text-sky-900"
                >
                  Public website →
                </Link>
              )}
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total views" value={metrics.total_views} />
          <MetricCard label="Phone clicks" value={metrics.phone_clicks} />
          <MetricCard label="Maps clicks" value={metrics.maps_clicks} />
          <MetricCard label="Website clicks" value={metrics.website_clicks} />
          <MetricCard label="CTA clicks" value={metrics.cta_clicks} />
          <MetricCard
            label="Engagement score"
            value={metrics.engagement_score}
            highlight
          />
          <MetricCard
            label="Gallery interactions"
            value={metrics.gallery_interactions}
          />
          <MetricCard
            label="Last viewed"
            value={
              metrics.last_viewed_at
                ? formatTimestamp(metrics.last_viewed_at)
                : "—"
            }
            isText
          />
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-zinc-900">Engagement Score</h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-600">
            {ENGAGEMENT_SCORE_EXPLANATION}
          </p>
          <p className="mt-4 text-sm text-zinc-500">
            Formula: (views × 1) + (website clicks × 3) + (maps clicks × 5) + (CTA
            clicks × 7) + (phone clicks × 10)
          </p>
          <p className="mt-4 text-sm text-zinc-500">
            Page views include traffic from internal previews (`/site/[siteId]`) and
            public URLs (`/website/[slug]`). Check the page URL column in recent
            activity to see where visits came from.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-zinc-900">Recent activity</h2>
          <p className="mt-1 text-sm text-zinc-600">
            Last {events?.length ?? 0} tracked events for this website.
          </p>

          {(events ?? []).length === 0 ? (
            <p className="mt-6 text-sm text-zinc-500">
              No events recorded yet. Visit the website to generate activity.
            </p>
          ) : (
            <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200">
              <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
                <thead className="bg-zinc-50">
                  <tr>
                    <th className="px-4 py-3 font-medium text-zinc-700">Time</th>
                    <th className="px-4 py-3 font-medium text-zinc-700">Event</th>
                    <th className="px-4 py-3 font-medium text-zinc-700">Value</th>
                    <th className="px-4 py-3 font-medium text-zinc-700">Page</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {(events ?? []).map((event) => (
                    <tr key={event.id}>
                      <td className="px-4 py-3 text-zinc-600">
                        {formatTimestamp(event.created_at)}
                      </td>
                      <td className="px-4 py-3 capitalize text-zinc-800">
                        {formatEventLabel(event.event_type)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {event.event_value ?? "—"}
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-zinc-500">
                        {event.page_url ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  highlight = false,
  isText = false,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
  isText?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-sm ${
        highlight
          ? "border-amber-200 bg-amber-50"
          : "border-zinc-200 bg-white"
      }`}
    >
      <p className="text-sm font-medium text-zinc-600">{label}</p>
      <p
        className={`mt-1 font-semibold text-zinc-900 ${
          isText ? "text-base" : "text-2xl tabular-nums"
        }`}
      >
        {isText && !value ? "—" : value}
      </p>
    </div>
  );
}
