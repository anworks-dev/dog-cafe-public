import { getSupabase, isSupabaseConfigured } from "./supabase";
import type {
  AreaSummary,
  PrefectureSummary,
  Review,
  ReviewPhoto,
  Shop,
  ShopTag,
  TagSummary,
} from "./types";

const SHOP_COLUMNS =
  "id, slug, name, prefecture, city, area, station, station_label, address, access, prefecture_slug, area_slug, latitude, longitude, business_hours, closed_days, phone, reference_url, google_map_url, instagram_url, photo_url, description, dog_conditions_notes, tags, status, created_at, updated_at";

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
    .select("id, review_id, cafe_id, public_url, alt, is_visible, sort_order")
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
