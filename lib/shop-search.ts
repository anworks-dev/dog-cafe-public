import { shopMatchesAllConditions } from "@/lib/dog-conditions";
import { formalAreaLabel } from "@/lib/location-paths";
import { sortByPrefectureOrder } from "@/lib/prefecture-order";
import type { Shop } from "@/lib/types";

export type ShopSearchFilters = {
  keyword: string;
  prefecture: string;
  /** area_slug (not Japanese label). */
  area: string;
  conditions: string[];
};

export function shopMatchesKeyword(shop: Shop, keyword: string): boolean {
  const q = keyword.trim().toLowerCase();
  if (!q) return true;
  const hay =
    `${shop.name} ${shop.area} ${shop.prefecture} ${shop.station} ${shop.station_label}`.toLowerCase();
  return hay.includes(q);
}

export function filterShops(shops: Shop[], filters: ShopSearchFilters): Shop[] {
  return shops.filter((shop) => {
    if (filters.prefecture && shop.prefecture_slug !== filters.prefecture) return false;
    if (filters.area && shop.area_slug !== filters.area) return false;
    if (!shopMatchesAllConditions(shop, filters.conditions)) return false;
    if (!shopMatchesKeyword(shop, filters.keyword)) return false;
    return true;
  });
}

type PrefectureMeta = { slug: string; label: string };

export type PrefectureOption = PrefectureMeta & { count: number };
export type AreaOption = {
  /** area_slug used in URLs */
  slug: string;
  /** Formal display name */
  label: string;
  count: number;
};

/** Prefecture options filtered by tags + keyword only (not prefecture/area). */
export function buildPrefectureOptions(
  shops: Shop[],
  prefectureMeta: PrefectureMeta[],
  filters: Pick<ShopSearchFilters, "keyword" | "conditions">,
): PrefectureOption[] {
  const matched = filterShops(shops, {
    keyword: filters.keyword,
    conditions: filters.conditions,
    prefecture: "",
    area: "",
  });
  const counts = new Map<string, number>();
  for (const shop of matched) {
    if (!shop.prefecture_slug) continue;
    counts.set(shop.prefecture_slug, (counts.get(shop.prefecture_slug) ?? 0) + 1);
  }
  const labelBySlug = new Map(prefectureMeta.map((p) => [p.slug, p.label]));
  return sortByPrefectureOrder(
    [...counts.entries()]
      .filter(([, count]) => count > 0)
      .map(([slug, count]) => ({
        slug,
        label: labelBySlug.get(slug) ?? slug,
        count,
      })),
  );
}

/** Area options by area_slug within a prefecture (label from area field, not station). */
export function buildAreaOptions(
  shops: Shop[],
  filters: Pick<ShopSearchFilters, "keyword" | "conditions" | "prefecture">,
): AreaOption[] {
  if (!filters.prefecture) return [];
  const matched = filterShops(shops, {
    keyword: filters.keyword,
    conditions: filters.conditions,
    prefecture: filters.prefecture,
    area: "",
  });

  const bySlug = new Map<string, Shop[]>();
  for (const shop of matched) {
    if (!shop.area_slug) continue;
    const list = bySlug.get(shop.area_slug);
    if (list) list.push(shop);
    else bySlug.set(shop.area_slug, [shop]);
  }

  return [...bySlug.entries()]
    .map(([slug, group]) => {
      const preferred = group.find((s) => {
        const area = s.area?.trim() || "";
        const pref = s.prefecture?.trim() || "";
        return Boolean(area && area !== pref);
      });
      return {
        slug,
        label: formalAreaLabel(preferred ?? group[0]),
        count: group.length,
      };
    })
    .filter((opt) => opt.count > 0)
    .sort((a, b) => a.label.localeCompare(b.label, "ja"));
}
