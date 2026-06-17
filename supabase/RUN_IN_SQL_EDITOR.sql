-- Run this entire file once in Supabase Dashboard → SQL Editor → New query → Run
-- Safe to re-run: uses IF NOT EXISTS / IF NOT EXISTS columns where possible

-- Phase 10A: Analytics tables
create table if not exists website_events (
  id uuid primary key default gen_random_uuid(),
  site_id uuid not null references sites(id) on delete cascade,
  business_id uuid references businesses(id) on delete set null,
  event_type text not null,
  event_value text,
  page_url text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists website_events_site_id_created_at_idx
  on website_events (site_id, created_at desc);

create index if not exists website_events_event_type_idx
  on website_events (event_type);

create table if not exists site_metrics (
  site_id uuid primary key references sites(id) on delete cascade,
  total_views integer not null default 0,
  phone_clicks integer not null default 0,
  maps_clicks integer not null default 0,
  website_clicks integer not null default 0,
  cta_clicks integer not null default 0,
  gallery_interactions integer not null default 0,
  faq_expands integer not null default 0,
  engagement_score integer not null default 0,
  last_viewed_at timestamptz
);

-- Phase 10: Public website URL columns on sites
alter table sites add column if not exists slug text;
alter table sites add column if not exists public_url text;
alter table sites add column if not exists published boolean not null default true;
alter table sites add column if not exists public_status text not null default 'published';

create unique index if not exists sites_slug_unique_idx on sites (slug);
create index if not exists sites_slug_idx on sites (slug);
create index if not exists sites_public_status_idx on sites (public_status);
