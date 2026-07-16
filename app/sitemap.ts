import type { MetadataRoute } from "next";
import { getAreas, getPrefectures, getPublishedShops } from "@/lib/queries";
import { areaUrl, prefectureUrl } from "@/lib/location-paths";
import { siteUrl, shopDetailUrl } from "@/lib/format";
import type { Shop } from "@/lib/types";

/** Always fetch published shops at request time (avoid stale empty sitemap from build without env). */
export const dynamic = "force-dynamic";

function shopHasDetailPath(shop: Shop): boolean {
  return Boolean(shop.prefecture_slug?.trim() && shop.area_slug?.trim() && shop.slug?.trim());
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const [shops, prefectures, areas] = await Promise.all([
    getPublishedShops(),
    getPrefectures(),
    getAreas(),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: "daily", priority: 1 },
    { url: `${base}/list`, changeFrequency: "daily", priority: 0.8 },
    { url: `${base}/about`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const prefectureEntries: MetadataRoute.Sitemap = prefectures.map((pref) => ({
    url: prefectureUrl(pref.slug, base),
    changeFrequency: "weekly",
    priority: 0.75,
  }));

  const areaEntries: MetadataRoute.Sitemap = areas.map((area) => ({
    url: areaUrl(area.prefectureSlug, area.slug, base),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const shopEntries: MetadataRoute.Sitemap = shops
    .filter(shopHasDetailPath)
    .map((shop) => ({
      url: shopDetailUrl(shop),
      lastModified: shop.updated_at ? new Date(shop.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...staticEntries, ...prefectureEntries, ...areaEntries, ...shopEntries];
}
