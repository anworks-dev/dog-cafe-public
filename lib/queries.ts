import { getSupabase, isSupabaseConfigured } from "./supabase";
import type {
  AreaSummary,
  PrefectureSummary,
  Review,
  ReviewPhoto,
  Shop,
  ShopCardData,
  ShopTag,
  ShopWithCardImage,
  TagSummary,
} from "./types";

const SHOP_COLUMNS =
  "id, slug, name, prefecture, city, area, station, station_label, address, access, prefecture_slug, area_slug, latitude, longitude, business_hours, closed_days, phone, reference_url, google_map_url, google_place_id, instagram_url, photo_url, description, dog_conditions_notes, tags, status, created_at, updated_at";

function normalizeTags(value: unknown): ShopTag[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((tag): tag is ShopTag => Boolean(tag) && typeof tag === "object" && "label" in tag)
    .map((tag) => ({
      label: String((tag as ShopTag).label),
      v: ((tag as ShopTag).v ?? "green") as ShopTag["v"],
    }));
}

function normalizeShop(row: Record<string, unknown>): Shop {
  return {
    ...(row as unknown as Shop),
    tags: normalizeTags(row.tags),
  };
}

export async function getPublishedShops(): Promise<Shop[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabase()
    .from("shops")
    .select(SHOP_COLUMNS)
    .eq("status", "published")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getPublishedShops]", error.message);
    return [];
  }
  return (data ?? []).map((row) => normalizeShop(row as Record<string, unknown>));
}

export async function getShopBySlug(slug: string): Promise<Shop | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabase()
    .from("shops")
    .select(SHOP_COLUMNS)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[getShopBySlug]", error.message);
    return null;
  }
  return data ? normalizeShop(data as Record<string, unknown>) : null;
}

export async function getShopById(id: number): Promise<Shop | null> {
  if (!isSupabaseConfigured()) return null;

  const { data, error } = await getSupabase()
    .from("shops")
    .select(SHOP_COLUMNS)
    .eq("id", id)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("[getShopById]", error.message);
    return null;
  }
  return data ? normalizeShop(data as Record<string, unknown>) : null;
}

export async function getShopsByPrefecture(prefectureSlug: string): Promise<Shop[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabase()
    .from("shops")
    .select(SHOP_COLUMNS)
    .eq("status", "published")
    .eq("prefecture_slug", prefectureSlug)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getShopsByPrefecture]", error.message);
    return [];
  }
  return (data ?? []).map((row) => normalizeShop(row as Record<string, unknown>));
}

export async function getApprovedReviews(cafeId: number): Promise<Review[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabase()
    .from("reviews")
    .select("id, cafe_id, shop_name, reviewer_name, visited_at, dog_size, seat_location, rating, comment, status, source, created_at")
    .eq("cafe_id", cafeId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getApprovedReviews]", error.message);
    return [];
  }
  return (data ?? []) as Review[];
}

export async function getApprovedReviewCounts(): Promise<Record<number, number>> {
  if (!isSupabaseConfigured()) return {};

  const { data, error } = await getSupabase()
    .from("reviews")
    .select("cafe_id")
    .eq("status", "approved");

  if (error) {
    console.error("[getApprovedReviewCounts]", error.message);
    return {};
  }

  const counts: Record<number, number> = {};
  for (const row of (data ?? []) as { cafe_id: number | null }[]) {
    if (row.cafe_id == null) continue;
    counts[row.cafe_id] = (counts[row.cafe_id] ?? 0) + 1;
  }
  return counts;
}

export async function getVisiblePhotosByReview(
  cafeId: number,
): Promise<Record<string, ReviewPhoto[]>> {
  if (!isSupabaseConfigured()) return {};

  const { data, error } = await getSupabase()
    .from("review_photos")
    .select("id, review_id, cafe_id, public_url, alt, is_visible, sort_order, created_at")
    .eq("cafe_id", cafeId)
    .eq("is_visible", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[getVisiblePhotosByReview]", error.message);
    return {};
  }

  const grouped: Record<string, ReviewPhoto[]> = {};
  for (const photo of (data ?? []) as ReviewPhoto[]) {
    (grouped[photo.review_id] ??= []).push(photo);
  }
  return grouped;
}

type ReviewPhotoCardRow = {
  id: string;
  cafe_id: number;
  public_url: string;
  created_at: string | null;
  is_visible: boolean;
  reviews: { id: string; status: string; created_at: string | null } | null;
};

function photoSortKey(row: ReviewPhotoCardRow): [number, number, string] {
  const photoMs = row.created_at ? Date.parse(row.created_at) : Number.NaN;
  const reviewMs = row.reviews?.created_at ? Date.parse(row.reviews.created_at) : Number.NaN;
  return [
    Number.isFinite(photoMs) ? photoMs : 0,
    Number.isFinite(reviewMs) ? reviewMs : 0,
    row.id,
  ];
}

function isNewerPhoto(a: ReviewPhotoCardRow, b: ReviewPhotoCardRow): boolean {
  const ka = photoSortKey(a);
  const kb = photoSortKey(b);
  if (ka[0] !== kb[0]) return ka[0] > kb[0];
  if (ka[1] !== kb[1]) return ka[1] > kb[1];
  return ka[2] > kb[2];
}

/**
 * Batch-load the latest visible review photo URL per cafe
 * (approved reviews only; for shops missing photo_url).
 */
export async function getLatestVisibleReviewPhotoUrlsByCafeIds(
  cafeIds: number[],
): Promise<Record<number, string>> {
  if (!isSupabaseConfigured()) return {};

  const uniqueIds = [...new Set(cafeIds.filter((id) => Number.isFinite(id)))];
  if (uniqueIds.length === 0) return {};

  const { data, error } = await getSupabase()
    .from("review_photos")
    .select("id, cafe_id, public_url, created_at, is_visible, reviews!inner(id, status, created_at)")
    .in("cafe_id", uniqueIds)
    .eq("is_visible", true)
    .eq("reviews.status", "approved");

  if (error) {
    console.error("[getLatestVisibleReviewPhotoUrlsByCafeIds]", error.message);
    return {};
  }

  const bestByCafe = new Map<number, ReviewPhotoCardRow>();

  for (const raw of data ?? []) {
    const row = raw as unknown as ReviewPhotoCardRow;
    if (!row.is_visible) continue;
    if (row.reviews?.status !== "approved") continue;
    const url = row.public_url?.trim();
    if (!url) continue;
    if (!/^https?:\/\//i.test(url)) continue;

    const prev = bestByCafe.get(row.cafe_id);
    if (!prev || isNewerPhoto(row, prev)) {
      bestByCafe.set(row.cafe_id, row);
    }
  }

  const result: Record<number, string> = {};
  for (const [cafeId, row] of bestByCafe) {
    result[cafeId] = row.public_url.trim();
  }
  return result;
}

/** Attach card_image_url: shop.photo_url, else latest visible review photo. */
export async function attachShopCardImages(shops: Shop[]): Promise<ShopWithCardImage[]> {
  return attachShopCardData(shops);
}

/**
 * Latest approved review comment per cafe (batch, no N+1).
 * Only cafes that need a fallback (empty description) should be passed when possible.
 */
export async function getLatestApprovedReviewCommentsByCafeIds(
  cafeIds: number[],
): Promise<Record<number, string>> {
  if (!isSupabaseConfigured() || cafeIds.length === 0) return {};

  const { data, error } = await getSupabase()
    .from("reviews")
    .select("cafe_id, comment, created_at, status")
    .in("cafe_id", cafeIds)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[getLatestApprovedReviewCommentsByCafeIds]", error.message);
    return {};
  }

  const bestByCafe = new Map<number, string>();
  for (const row of (data ?? []) as {
    cafe_id: number | null;
    comment: string | null;
    created_at: string | null;
  }[]) {
    if (row.cafe_id == null) continue;
    if (bestByCafe.has(row.cafe_id)) continue;
    const comment = row.comment?.trim() ?? "";
    if (!comment) continue;
    bestByCafe.set(row.cafe_id, comment);
  }

  return Object.fromEntries(bestByCafe);
}

/**
 * Attach card display fields in one place:
 * - card_image_url from shop photo or latest visible review photo
 * - card_excerpt from latest approved review when shops.description is empty
 */
export async function attachShopCardData(shops: Shop[]): Promise<ShopCardData[]> {
  if (shops.length === 0) return [];

  const needsImageFallback = shops
    .filter((shop) => !shop.photo_url?.trim())
    .map((shop) => shop.id);

  const needsExcerptFallback = shops
    .filter((shop) => !shop.description?.trim())
    .map((shop) => shop.id);

  const [fallbackUrls, reviewComments] = await Promise.all([
    needsImageFallback.length > 0
      ? getLatestVisibleReviewPhotoUrlsByCafeIds(needsImageFallback)
      : Promise.resolve({} as Record<number, string>),
    needsExcerptFallback.length > 0
      ? getLatestApprovedReviewCommentsByCafeIds(needsExcerptFallback)
      : Promise.resolve({} as Record<number, string>),
  ]);

  return shops.map((shop) => {
    const shopPhoto = shop.photo_url?.trim() || null;
    const hasDescription = Boolean(shop.description?.trim());
    return {
      ...shop,
      card_image_url: shopPhoto || fallbackUrls[shop.id] || null,
      card_excerpt: hasDescription ? null : reviewComments[shop.id] || null,
    };
  });
}

export async function getPrefectures(): Promise<PrefectureSummary[]> {
  const shops = await getPublishedShops();
  const map = new Map<string, PrefectureSummary>();
  for (const shop of shops) {
    if (!shop.prefecture_slug) continue;
    const existing = map.get(shop.prefecture_slug);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(shop.prefecture_slug, {
        slug: shop.prefecture_slug,
        label: shop.prefecture,
        count: 1,
      });
    }
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "ja"));
}

export async function getShopsByArea(areaSlug: string): Promise<Shop[]> {
  if (!isSupabaseConfigured()) return [];

  const { data, error } = await getSupabase()
    .from("shops")
    .select(SHOP_COLUMNS)
    .eq("status", "published")
    .eq("area_slug", areaSlug)
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("[getShopsByArea]", error.message);
    return [];
  }
  return (data ?? []).map((row) => normalizeShop(row as Record<string, unknown>));
}

export async function getAreas(): Promise<AreaSummary[]> {
  const shops = await getPublishedShops();
  const map = new Map<string, AreaSummary>();
  for (const shop of shops) {
    if (!shop.area_slug) continue;
    const existing = map.get(shop.area_slug);
    if (existing) {
      existing.count += 1;
    } else {
      map.set(shop.area_slug, {
        slug: shop.area_slug,
        label: shop.area || shop.area_slug,
        prefecture: shop.prefecture,
        prefectureSlug: shop.prefecture_slug,
        count: 1,
      });
    }
  }
  return [...map.values()].sort(
    (a, b) => b.count - a.count || a.label.localeCompare(b.label, "ja"),
  );
}

export async function getConditionTags(): Promise<TagSummary[]> {
  const shops = await getPublishedShops();
  const map = new Map<string, number>();
  for (const shop of shops) {
    for (const tag of shop.tags) {
      map.set(tag.label, (map.get(tag.label) ?? 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}
