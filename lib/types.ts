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
};

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
