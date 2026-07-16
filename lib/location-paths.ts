import type { Shop } from "@/lib/types";

/** First-path segments that must not be treated as prefecture slugs. */
export const RESERVED_PATH_SEGMENTS = new Set([
  "about",
  "api",
  "area",
  "areas",
  "cafes",
  "complete",
  "contact",
  "list",
  "request",
  "review",
  "robots",
  "sitemap",
  "terms",
  "_next",
  "favicon.ico",
]);

export function isReservedPathSegment(segment: string): boolean {
  return RESERVED_PATH_SEGMENTS.has(segment.trim().toLowerCase());
}

export function prefecturePath(prefectureSlug: string): string {
  return `/${prefectureSlug}`;
}

export function areaPath(prefectureSlug: string, areaSlug: string): string {
  return `/${prefectureSlug}/${areaSlug}`;
}

export function prefectureUrl(prefectureSlug: string, site: string): string {
  return `${site}${prefecturePath(prefectureSlug)}`;
}

export function areaUrl(prefectureSlug: string, areaSlug: string, site: string): string {
  return `${site}${areaPath(prefectureSlug, areaSlug)}`;
}

/**
 * Formal area display name for list pages / search options.
 * Prefer shops.area when it is a real area name (not the prefecture label).
 * Fall back to station_label only for display when area is missing/unusable —
 * URL matching always uses area_slug, never station fields.
 */
export function formalAreaLabel(shop: {
  area?: string | null;
  prefecture?: string | null;
  station_label?: string | null;
  station?: string | null;
  area_slug: string;
}): string {
  const area = shop.area?.trim() || "";
  const pref = shop.prefecture?.trim() || "";
  if (area && area !== pref) return area;

  const stationLabel = shop.station_label?.trim() || "";
  if (stationLabel) return stationLabel;

  const station = (shop.station?.trim() || "").replace(/\s*周辺\s*$/u, "").replace(/駅$/u, "").trim();
  if (station) return station;

  return shop.area_slug;
}

/** Best display label for an area_slug group within a prefecture. */
export function formalAreaLabelForGroup(
  shops: {
    area?: string | null;
    prefecture?: string | null;
    station_label?: string | null;
    station?: string | null;
    area_slug: string;
  }[],
): string {
  if (shops.length === 0) return "";
  const preferred = shops.find((s) => {
    const area = s.area?.trim() || "";
    const pref = s.prefecture?.trim() || "";
    return Boolean(area && area !== pref);
  });
  return formalAreaLabel(preferred ?? shops[0]);
}

/**
 * Legacy TOP search used Japanese labels (station_label → station → area).
 * Resolve to a unique area_slug within the prefecture, or null if ambiguous/missing.
 */
export function resolveLegacyAreaParamToSlug(
  shops: Pick<
    Shop,
    "prefecture_slug" | "area_slug" | "area" | "station" | "station_label" | "prefecture"
  >[],
  prefectureSlug: string,
  areaParam: string,
): string | null {
  const raw = areaParam.trim();
  if (!raw || !prefectureSlug) return null;

  const scoped = shops.filter((s) => s.prefecture_slug === prefectureSlug);
  if (scoped.length === 0) return null;

  if (scoped.some((s) => s.area_slug === raw)) return raw;

  const matches = new Set<string>();
  for (const shop of scoped) {
    const candidates = new Set(
      [
        shop.area_slug,
        formalAreaLabel(shop),
        shop.area?.trim(),
        shop.station_label?.trim(),
        (shop.station?.trim() || "").replace(/\s*周辺\s*$/u, "").trim(),
      ].filter(Boolean) as string[],
    );
    if (candidates.has(raw)) matches.add(shop.area_slug);
  }

  if (matches.size === 1) return [...matches][0];
  return null;
}

/** Query keys that belong to location (stripped when redirecting to path URLs). */
const LOCATION_QUERY_KEYS = new Set(["pref", "area", "prefecture"]);

export function preserveNonLocationQuery(searchParams: URLSearchParams): string {
  const next = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    if (LOCATION_QUERY_KEYS.has(key)) continue;
    if (!value) continue;
    next.append(key, value);
  }
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

export function buildLocationSearchPath(
  prefectureSlug: string,
  areaSlug: string,
  extra?: { keyword?: string; conditions?: string[] },
): string {
  const base = areaSlug
    ? areaPath(prefectureSlug, areaSlug)
    : prefecturePath(prefectureSlug);
  const p = new URLSearchParams();
  const q = extra?.keyword?.trim() ?? "";
  if (q) p.set("q", q);
  if (extra?.conditions?.length) p.set("tags", extra.conditions.join(","));
  const qs = p.toString();
  return qs ? `${base}?${qs}` : base;
}
