import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { getPublishedShops, getShopBySlug } from "@/lib/queries";
import { shopDetailPath, shopDetailUrl } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  const shops = await getPublishedShops();
  return shops.map((shop) => ({ slug: shop.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) {
    return { title: "店舗が見つかりません", robots: { index: false, follow: false } };
  }

  return {
    alternates: { canonical: shopDetailUrl(shop) },
    robots: { index: false, follow: true },
  };
}

export default async function LegacyCafeDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await getShopBySlug(slug);
  if (!shop) notFound();

  permanentRedirect(shopDetailPath(shop));
}
