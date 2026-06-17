const CSV_COLUMNS = [
  "business_name",
  "place_id",
  "public_url",
  "internal_preview_url",
  "analytics_url",
  "phone",
  "address",
  "rating",
  "review_count",
  "total_views",
  "phone_clicks",
  "maps_clicks",
  "website_clicks",
  "engagement_score",
  "last_viewed_at",
  "status",
] as const;

export type PublicLinkExportRow = Record<(typeof CSV_COLUMNS)[number], string>;

export function escapeCsvField(value: string): string {
  if (/[",\r\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  return value;
}

export function buildPublicLinksCsv(rows: PublicLinkExportRow[]): string {
  const header = CSV_COLUMNS.map((column) => escapeCsvField(column)).join(",");
  const body = rows.map((row) =>
    CSV_COLUMNS.map((column) => escapeCsvField(row[column] ?? "")).join(","),
  );

  // UTF-8 BOM helps Excel open accented characters correctly.
  return `\uFEFF${[header, ...body].join("\r\n")}`;
}
