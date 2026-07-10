export type ReferenceUrlKind = "instagram" | "google-map" | "official";

export function classifyReferenceUrl(url: string): ReferenceUrlKind {
  const lower = url.toLowerCase();
  if (lower.includes("instagram.com")) return "instagram";
  if (
    lower.includes("google.com/maps") ||
    lower.includes("maps.app.goo.gl") ||
    lower.includes("goo.gl/maps")
  ) {
    return "google-map";
  }
  return "official";
}

export const REFERENCE_URL_LABELS: Record<ReferenceUrlKind, string> = {
  instagram: "Instagram",
  "google-map": "Google MAP",
  official: "公式サイト",
};

export function formatReviewPostedAt(
  isoDate: string | null | undefined,
  options?: { includeTime?: boolean },
): string | null {
  const trimmed = isoDate?.trim();
  if (!trimmed) return null;

  const date = new Date(trimmed);
  if (Number.isNaN(date.getTime())) return null;

  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const y = parts.find((p) => p.type === "year")?.value;
  const m = parts.find((p) => p.type === "month")?.value;
  const d = parts.find((p) => p.type === "day")?.value;
  const h = parts.find((p) => p.type === "hour")?.value;
  const min = parts.find((p) => p.type === "minute")?.value;

  if (!y || !m || !d) return null;

  const includeTime = options?.includeTime ?? true;
  if (includeTime && h != null && min != null) {
    return `投稿日：${y}年${m}月${d}日 ${h}:${min}`;
  }

  return `投稿日：${y}年${m}月${d}日`;
}

export function formatReviewDate(iso: string | null | undefined): string {
  const label = formatReviewPostedAt(iso, { includeTime: false });
  return label?.replace(/^投稿日：/, "") ?? "";
}

export function reviewShowsMetaTags(review: {
  dog_size?: string | null;
  seat_location?: string | null;
}): boolean {
  return (
    (!!review.dog_size && review.dog_size !== "—") ||
    (!!review.seat_location && review.seat_location !== "—")
  );
}

export function displayReviewerName(name: string | null): string {
  return name?.trim() || "匿名";
}

export function displayPublicReviewAuthor(review: {
  source: string | null;
  reviewer_name: string | null;
}): string {
  if (review.source === "initial" && !review.reviewer_name?.trim()) {
    return "口コミ投稿";
  }
  return displayReviewerName(review.reviewer_name);
}

export function siteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "");
  return raw || "http://localhost:3000";
}

export function shopDetailPath(shop: {
  prefecture_slug: string;
  area_slug: string;
  slug: string;
}): string {
  return `/${shop.prefecture_slug}/${shop.area_slug}/${shop.slug}`;
}

export function shopDetailUrl(shop: {
  prefecture_slug: string;
  area_slug: string;
  slug: string;
}): string {
  return `${siteUrl()}${shopDetailPath(shop)}`;
}

export function areaLabelFromShop(shop: {
  station_label?: string;
  area?: string;
  city?: string;
  prefecture?: string;
}): string {
  return (
    shop.station_label?.trim() ||
    shop.area?.trim() ||
    shop.city?.trim() ||
    shop.prefecture?.trim() ||
    ""
  );
}
