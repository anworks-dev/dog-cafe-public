export type ShopTag = {
  label: string;
  v: "green" | "brown" | "orange";
};

export type Shop = {
  id: number;
  slug: string;
  name: string;
  prefecture: string;
  city: string;
  area: string;
  station: string;
  station_label: string;
  address: string;
  access: string;
  prefecture_slug: string;
  area_slug: string;
  latitude: number | null;
  longitude: number | null;
  business_hours: string | null;
  closed_days: string | null;
  phone: string | null;
  reference_url: string | null;
  google_map_url: string | null;
  google_place_id: string | null;
  instagram_url: string | null;
  photo_url: string | null;
  description: string;
  dog_conditions_notes: string | null;
  tags: ShopTag[];
  status: string;
  updated_at: string;
  created_at: string;
};

export type Review = {
  id: string;
  cafe_id: number;
  shop_name: string;
  reviewer_name: string | null;
  visited_at: string | null;
  dog_size: string;
  seat_location: string;
  rating: number;
  comment: string;
  status: string;
  source: string | null;
  created_at: string;
};

export type ReviewPhoto = {
  id: string;
  review_id: string;
  cafe_id: number;
  public_url: string;
  alt: string | null;
  is_visible: boolean;
  sort_order: number;
  created_at?: string;
};

/**
 * Card display data attached at list/top fetch time.
 * - card_image_url: shop.photo_url, else latest visible review photo
 * - card_excerpt: shops.description when present; else latest approved review comment
 */
export type ShopCardData = Shop & {
  card_image_url?: string | null;
  /** Fallback card text from latest approved review when description is empty. */
  card_excerpt?: string | null;
};

/** @deprecated Prefer ShopCardData — kept as alias for existing imports. */
export type ShopWithCardImage = ShopCardData;

export type PrefectureSummary = {
  slug: string;
  label: string;
  count: number;
};

export type AreaSummary = {
  slug: string;
  label: string;
  prefecture: string;
  prefectureSlug: string;
  count: number;
};

export type TagSummary = {
  label: string;
  count: number;
};
