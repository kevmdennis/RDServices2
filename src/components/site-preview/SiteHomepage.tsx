import PhotoCarousel from "@/components/PhotoCarousel";
import SitePageViewTracker from "@/components/site-preview/SitePageViewTracker";
import TrackedLink from "@/components/site-preview/TrackedLink";
import { getDisplayablePhotoUrls } from "@/lib/businesses/photos";
import { formatSiteHours } from "@/lib/sites/format-hours";
import {
  DEFAULT_CTA_TEXT,
  sanitizeCtaText,
  sanitizeHeroTitle,
} from "@/lib/sites/sanitize-site-text";
import type { Site, SiteContact, SiteService, SiteTestimonial, SiteTheme } from "@/lib/sites/types";
import type { Business } from "@/lib/supabase/types";
import type { CSSProperties } from "react";

type SiteHomepageProps = {
  site: Site;
  business: Business;
};

export default function SiteHomepage({ site, business }: SiteHomepageProps) {
  const businessName = business.name ?? site.business_name ?? "Local Business";
  const contact = resolveContact(site, business);
  const theme = resolveTheme(site.theme_json);
  const photos = getDisplayablePhotoUrls(business.photos_json);
  const heroPhoto = photos[0] ?? null;
  const services = site.services_json ?? [];
  const testimonials = site.testimonials_json ?? [];
  const hours = formatSiteHours(site.hours_json ?? business.hours_json);
  const heroTitle = sanitizeHeroTitle(site.hero_title ?? businessName);
  const ctaText = sanitizeCtaText(contact.cta_text || DEFAULT_CTA_TEXT);
  const phoneHref = contact.phone
    ? `tel:${contact.phone.replace(/[^\d+]/g, "")}`
    : null;

  return (
    <div
      className="min-h-full bg-white text-zinc-900"
      style={
        {
          "--site-primary": theme.primary_color,
          "--site-accent": theme.accent_color,
        } as CSSProperties
      }
    >
      <SitePageViewTracker siteId={site.id} businessId={business.id} />
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold sm:text-xl">{businessName}</h1>
          </div>
          {phoneHref && (
            <TrackedLink
              href={phoneHref}
              siteId={site.id}
              businessId={business.id}
              eventType="phone_click"
              eventValue={contact.phone ?? undefined}
              className="shrink-0 rounded-full px-4 py-2 text-sm font-medium text-white"
              style={{ backgroundColor: theme.primary_color }}
            >
              Call now
            </TrackedLink>
          )}
        </div>
      </header>

      <section className="relative overflow-hidden">
        {heroPhoto ? (
          <div className="absolute inset-0">
            <img
              src={heroPhoto}
              alt={`${businessName} hero`}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/35" />
          </div>
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${theme.primary_color}, ${theme.accent_color})`,
            }}
          />
        )}

        <div className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl text-white">
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.2em] text-white/80">
              {businessName}
            </p>
            <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              {heroTitle}
            </h2>
            {site.hero_subtitle && (
              <p className="mt-4 text-lg leading-8 text-white/90 sm:text-xl">
                {site.hero_subtitle}
              </p>
            )}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {phoneHref && (
                <TrackedLink
                  href={phoneHref}
                  siteId={site.id}
                  businessId={business.id}
                  eventType="hero_cta_click"
                  eventValue={contact.phone ?? undefined}
                  className="inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-zinc-900"
                  style={{ backgroundColor: "white" }}
                >
                  {ctaText}
                </TrackedLink>
              )}
              {contact.google_maps_uri && (
                <TrackedLink
                  href={contact.google_maps_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  siteId={site.id}
                  businessId={business.id}
                  eventType="google_maps_click"
                  eventValue="hero_directions"
                  className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Get directions
                </TrackedLink>
              )}
            </div>
            {business.rating != null && (
              <p className="mt-6 text-sm text-white/85">
                {business.rating}★ rating
                {business.review_count != null
                  ? ` · ${business.review_count} Google reviews`
                  : ""}
              </p>
            )}
          </div>
        </div>
      </section>

      <PhotoCarousel
        photos={photos}
        businessName={businessName}
        siteId={site.id}
        businessId={business.id}
      />

      <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        {site.about && (
          <section className="mb-16 max-w-3xl">
            <SectionHeading title="About us" />
            <p className="mt-4 text-lg leading-8 text-zinc-600">{site.about}</p>
          </section>
        )}

        {services.length > 0 && (
          <section className="mb-16">
            <SectionHeading title="Our services" />
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, index) => (
                <ServiceCard key={`${service.name}-${index}`} service={service} />
              ))}
            </div>
          </section>
        )}

        {testimonials.length > 0 && (
          <section className="mb-16">
            <SectionHeading title="What customers are saying" />
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={`${testimonial.text}-${index}`}
                  testimonial={testimonial}
                />
              ))}
            </div>
          </section>
        )}

        <section className="grid gap-8 lg:grid-cols-2">
          {hours.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
              <SectionHeading title="Hours" />
              <dl className="mt-6 space-y-3">
                {hours.map((entry) => (
                  <div
                    key={`${entry.label}-${entry.value}`}
                    className="flex items-start justify-between gap-4 border-b border-zinc-200/80 pb-3 last:border-b-0 last:pb-0"
                  >
                    <dt className="font-medium text-zinc-800">{entry.label}</dt>
                    <dd className="text-right text-zinc-600">{entry.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="rounded-2xl border border-zinc-200 p-6">
            <SectionHeading title="Visit us" />
            <div className="mt-6 space-y-4 text-zinc-600">
              {contact.address && (
                <ContactRow label="Address" value={contact.address} />
              )}
              {contact.phone && (
                <ContactRow
                  label="Phone"
                  value={contact.phone}
                  href={phoneHref ?? undefined}
                  siteId={site.id}
                  businessId={business.id}
                  eventType="phone_click"
                />
              )}
              {contact.website && (
                <ContactRow
                  label="Website"
                  value={contact.website.replace(/^https?:\/\//, "")}
                  href={contact.website}
                  siteId={site.id}
                  businessId={business.id}
                  eventType="website_click"
                />
              )}
              {contact.google_maps_uri && (
                <TrackedLink
                  href={contact.google_maps_uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  siteId={site.id}
                  businessId={business.id}
                  eventType="google_maps_click"
                  eventValue="contact_maps"
                  className="inline-flex text-sm font-medium"
                  style={{ color: theme.accent_color }}
                >
                  View on Google Maps →
                </TrackedLink>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer
        className="mt-10 px-4 py-8 text-center text-sm text-white sm:px-6"
        style={{ backgroundColor: theme.primary_color }}
      >
        <p className="font-medium">{businessName}</p>
        {contact.address && <p className="mt-2 text-white/85">{contact.address}</p>}
        <p className="mt-4 text-white/70">Website preview generated from Google business data.</p>
      </footer>
    </div>
  );
}

function resolveContact(site: Site, business: Business): SiteContact {
  const contact = site.contact_json;

  return {
    phone: contact?.phone ?? business.phone,
    address: contact?.address ?? business.address,
    website: contact?.website ?? business.website,
    google_maps_uri: contact?.google_maps_uri ?? business.google_maps_uri,
    cta_text: sanitizeCtaText(contact?.cta_text ?? DEFAULT_CTA_TEXT),
  };
}

function resolveTheme(theme: SiteTheme | null): SiteTheme {
  return (
    theme ?? {
      style: "clean local business",
      primary_color: "#1f2937",
      accent_color: "#2563eb",
    }
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <h2 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
      {title}
    </h2>
  );
}

function ServiceCard({ service }: { service: SiteService }) {
  return (
    <article className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-zinc-900">{service.name}</h3>
      {service.description && (
        <p className="mt-3 text-sm leading-7 text-zinc-600">{service.description}</p>
      )}
    </article>
  );
}

function TestimonialCard({ testimonial }: { testimonial: SiteTestimonial }) {
  return (
    <blockquote className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      {testimonial.rating != null && (
        <p className="mb-3 text-sm font-medium text-amber-500">
          {"★".repeat(Math.round(testimonial.rating))}
          <span className="text-zinc-300">
            {"★".repeat(Math.max(0, 5 - Math.round(testimonial.rating)))}
          </span>
        </p>
      )}
      <p className="text-base leading-7 text-zinc-700">&ldquo;{testimonial.text}&rdquo;</p>
      {testimonial.author && (
        <footer className="mt-4 text-sm font-medium text-zinc-500">
          — {testimonial.author}
        </footer>
      )}
    </blockquote>
  );
}

function ContactRow({
  label,
  value,
  href,
  siteId,
  businessId,
  eventType,
}: {
  label: string;
  value: string;
  href?: string;
  siteId?: string;
  businessId?: string;
  eventType?: "phone_click" | "website_click" | "contact_cta_click";
}) {
  return (
    <div>
      <p className="text-sm font-medium text-zinc-800">{label}</p>
      {href && siteId && eventType ? (
        <TrackedLink
          href={href}
          siteId={siteId}
          businessId={businessId}
          eventType={eventType}
          eventValue={value}
          className="mt-1 block text-zinc-600 hover:text-zinc-900"
        >
          {value}
        </TrackedLink>
      ) : href ? (
        <a href={href} className="mt-1 block text-zinc-600 hover:text-zinc-900">
          {value}
        </a>
      ) : (
        <p className="mt-1 text-zinc-600">{value}</p>
      )}
    </div>
  );
}
