# Outscraper Uploader

Batch upload Google Place IDs, generate local business websites with OpenAI, and share public website links with first-party analytics.

## Environment variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GOOGLE_MAPS_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- **Local:** `NEXT_PUBLIC_APP_URL=http://localhost:3000`
- **Vercel production:** `NEXT_PUBLIC_APP_URL=https://YOUR-VERCEL-APP.vercel.app`

`SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_MAPS_API_KEY`, and `OPENAI_API_KEY` must stay server-side only.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Public website URLs

Each generated site gets a public path-based URL:

```text
https://YOUR-VERCEL-APP.vercel.app/website/mauricio-auto-repair
```

Internal admin preview (same component, same tracking):

```text
http://localhost:3000/site/[siteId]
```

## Supabase migrations

Run SQL migrations in the Supabase SQL Editor (in order):

1. `supabase/migrations/20250616000000_website_analytics.sql`
2. `supabase/migrations/20250616100000_site_public_urls.sql`

## Deploy on Vercel

1. Push the project to GitHub
2. Import the repository in [Vercel](https://vercel.com/new)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GOOGLE_MAPS_API_KEY`
   - `OPENAI_API_KEY`
   - `NEXT_PUBLIC_APP_URL` → `https://YOUR-VERCEL-APP.vercel.app`
4. Deploy
5. Redeploy after adding or changing environment variables
6. Run **Generate Missing Public Links** on existing batches so `public_url` uses the production domain

## Tracking Verification Checklist

### Local testing

1. Run Supabase migrations
2. `npm run dev`
3. Open `/website/[slug]?debugTracking=true`
4. Confirm `siteId` and `businessId` display in the debug panel
5. Click **Send Test Tracking Event**
6. Confirm the event appears in Supabase `website_events`
7. Refresh the page
8. Confirm a `page_view` event appears
9. Click phone, maps, website, and CTA links
10. Confirm matching events appear
11. Open `/analytics/[siteId]`
12. Confirm metrics and engagement score update

### Vercel testing

1. Add all environment variables in the Vercel project settings
2. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL
3. Redeploy
4. Run **Generate Missing Public Links** on completed batches
5. Open `/website/[slug]?debugTracking=true` on the live domain
6. Send a test event
7. Confirm the event appears in Supabase
8. Confirm `/analytics/[siteId]` metrics update
9. Confirm engagement score updates

## Routes

| Route | Purpose |
|-------|---------|
| `/` | CSV upload |
| `/batch/[batchId]` | Batch dashboard |
| `/site/[siteId]` | Internal website preview |
| `/website/[slug]` | Public business website |
| `/analytics/[siteId]` | Per-site analytics |
| `/api/track-event` | First-party analytics API |

## Engagement score

```text
engagement_score =
  (total_views × 1)
+ (website_clicks × 3)
+ (maps_clicks × 5)
+ (cta_clicks × 7)
+ (phone_clicks × 10)
```

`test_event` is logged but does not affect the score.
