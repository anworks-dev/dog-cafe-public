import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import CafeDetailView from "@/components/CafeDetailView";
import {
  getApprovedReviews,
  getPublishedShops,
  getShopBySlug,
  getShopsByPrefecture,
  getVisiblePhotosByReview,
} from "@/lib/queries";
import { areaLabelFromShop, shopDetailPath, shopDetailUrl } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  const shops = await getPublishedShops();
  return shops.map((shop) => ({
    prefectureSlug: shop.prefecture_slug,
    areaSlug: shop.area_slug,
    shopSlug: shop.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ prefectureSlug: string; areaSlug: string; shopSlug: string }>;
}): Promise<Metadata> {
  const { shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) {
    return { title: "店舗が見つかりません", robots: { index: false, follow: false } };
  }

  const area = areaLabelFromShop(shop);
  const title = `${shop.name}｜${area}で犬と行けるカフェ`;
  const description = `${shop.name}は${shop.prefecture}${area ? `・${area}` : ""}にある犬同伴可能なカフェです。${
    shop.tags.map((t) => t.label).join("・") || "犬同伴条件"
  }・口コミ情報を掲載しています。`;
  const url = shopDetailUrl(shop);
  const ogImage = shop.photo_url ?? undefined;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ prefectureSlug: string; areaSlug: string; shopSlug: string }>;
}) {
  const { prefectureSlug, areaSlug, shopSlug } = await params;
  const shop = await getShopBySlug(shopSlug);
  if (!shop) notFound();

  if (shop.prefecture_slug !== prefectureSlug || shop.area_slug !== areaSlug) {
    permanentRedirect(shopDetailPath(shop));
  }

  const [reviews, photosByReview, prefectureShops] = await Promise.all([
    getApprovedReviews(shop.id),
    getVisiblePhotosByReview(shop.id),
    getShopsByPrefecture(shop.prefecture_slug),
  ]);

  const nearby = prefectureShops.filter((s) => s.id !== shop.id).slice(0, 4);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY?.trim();
  const googleMapEmbedUrl =
    apiKey && shop.google_place_id
      ? `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(apiKey)}&q=place_id:${encodeURIComponent(shop.google_place_id)}`
      : null;

  return (
    <CafeDetailView
      shop={shop}
      reviews={reviews}
      photosByReview={photosByReview}
      nearby={nearby}
      googleMapEmbedUrl={googleMapEmbedUrl}
    />
  );
}
