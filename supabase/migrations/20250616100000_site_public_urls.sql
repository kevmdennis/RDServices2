-- Phase 10: Public website URLs (path-based)

alter table sites
  add column if not exists slug text,
  add column if not exists public_url text,
  add column if not exists published boolean not null default true,
  add column if not exists public_status text not null default 'published';

create unique index if not exists sites_slug_unique_idx on sites (slug);
create index if not exists sites_slug_idx on sites (slug);
create index if not exists sites_public_status_idx on sites (public_status);
