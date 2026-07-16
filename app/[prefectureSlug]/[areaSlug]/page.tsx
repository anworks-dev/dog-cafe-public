import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PawPrint } from "lucide-react";
import AreaExplorer from "@/components/AreaExplorer";
import {
  attachShopCardImages,
  getApprovedReviewCounts,
  getAreas,
  getShopsByPrefectureAndArea,
} from "@/lib/queries";
import {
  areaPath,
  areaUrl,
  formalAreaLabelForGroup,
  isReservedPathSegment,
  prefecturePath,
  prefectureUrl,
} from "@/lib/location-paths";
import { siteUrl } from "@/lib/format";

export const revalidate = 300;

const AREA_INFO: Record<string, string> = {
  shibuya:
    "渋谷エリアには、愛犬と一緒に入店できるドッグフレンドリーなカフェが多数あります。おしゃれな店内から開放感のあるテラス席まで、様々なタイプのお店をご紹介します。",
  setagaya:
    "世田谷エリアには、落ち着いた雰囲気のドッグカフェが点在しています。公園近くのテラス席のあるお店も豊富です。",
  yokohama:
    "横浜エリアには海が見えるテラス席のあるカフェや、大型犬でも入れる広々とした店舗が揃っています。",
  kamakura:
    "鎌倉エリアには自然に囲まれたドッグカフェが多く、愛犬と一緒にのんびり過ごせます。",
};

function areaDescription(label: string, slug: string, count: number, prefecture: string): string {
  return (
    AREA_INFO[slug] ??
    `${prefecture}${label}周辺で犬と一緒に行けるカフェ・レストラン・お店を${count}件掲載しています。店内OK・テラスOK・大型犬OK・ドッグメニューありなど、愛犬とのおでかけに役立つ情報を探せます。`
  );
}

export async function generateStaticParams() {
  const areas = await getAreas();
  return areas
    .filter((a) => a.prefectureSlug && a.slug && !isReservedPathSegment(a.prefectureSlug))
    .map((a) => ({
      prefectureSlug: a.prefectureSlug,
      areaSlug: a.slug,
    }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ prefectureSlug: string; areaSlug: string }>;
}): Promise<Metadata> {
  const { prefectureSlug, areaSlug } = await params;
  if (isReservedPathSegment(prefectureSlug)) {
    return { title: "ページが見つかりません", robots: { index: false, follow: false } };
  }
  const shops = await getShopsByPrefectureAndArea(prefectureSlug, areaSlug);
  if (shops.length === 0) {
    return { title: "エリアが見つかりません", robots: { index: false, follow: false } };
  }
  const label = formalAreaLabelForGroup(shops);
  const prefecture = shops[0].prefecture;
  const title = `${label}の犬と行けるカフェ・お店一覧｜${prefecture}`;
  const description = areaDescription(label, areaSlug, shops.length, prefecture);
  const url = areaUrl(prefectureSlug, areaSlug, siteUrl());
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", title, description, url },
  };
}

export default async function PrefectureAreaListPage({
  params,
}: {
  params: Promise<{ prefectureSlug: string; areaSlug: string }>;
}) {
  const { prefectureSlug, areaSlug } = await params;
  if (isReservedPathSegment(prefectureSlug)) notFound();

  const [shopsRaw, areas, reviewCounts] = await Promise.all([
    getShopsByPrefectureAndArea(prefectureSlug, areaSlug),
    getAreas(),
    getApprovedReviewCounts(),
  ]);
  if (shopsRaw.length === 0) notFound();

  const shops = await attachShopCardImages(shopsRaw);
  const label = formalAreaLabelForGroup(shops);
  const prefecture = shops[0].prefecture;
  const description = areaDescription(label, areaSlug, shops.length, prefecture);

  const nearbyAreas = areas
    .filter((a) => a.prefectureSlug === prefectureSlug && a.slug !== areaSlug)
    .slice(0, 8);

  const pageUrl = areaUrl(prefectureSlug, areaSlug, siteUrl());
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl() },
      {
        "@type": "ListItem",
        position: 2,
        name: prefecture,
        item: prefectureUrl(prefectureSlug, siteUrl()),
      },
      { "@type": "ListItem", position: 3, name: label, item: pageUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <div className="px-4 md:px-10 lg:px-24 xl:px-40 pt-6 pb-5 md:py-10 bg-[#EDF5F1] border-b border-[rgba(59,47,37,0.07)]">
        <div className="max-w-[1040px] mx-auto">
          <nav className="text-[12px] md:text-[13px] text-[#9A8878] flex items-center gap-1.5 mb-3 flex-wrap">
            <Link href="/" className="hover:text-[#4A9070] transition-colors">
              ホーム
            </Link>
            <span>›</span>
            <Link
              href={prefecturePath(prefectureSlug)}
              className="hover:text-[#4A9070] transition-colors"
            >
              {prefecture}
            </Link>
            <span>›</span>
            <span>{label}</span>
          </nav>
          <p className="text-[13px] font-medium text-[#6FAA88] flex items-center gap-1.5 mb-1.5">
            <PawPrint size={12} strokeWidth={2.5} />
            エリアから探す
          </p>
          <h1
            className="text-[22px] md:text-[30px] font-extrabold text-[#3B2F25] leading-tight mb-2"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {label}の犬と行けるカフェ・お店
          </h1>
          <p className="text-[13px] md:text-[14px] text-[#6A5E54] leading-relaxed max-w-3xl">
            {description}
          </p>
        </div>
      </div>

      <div className="pt-6 md:pt-8">
        <AreaExplorer shops={shops} areaLabel={label} reviewCounts={reviewCounts} />
      </div>

      {nearbyAreas.length > 0 && (
        <div className="px-4 md:px-10 lg:px-24 xl:px-40 pb-8">
          <div className="max-w-[1040px] mx-auto">
            <p
              className="text-[17px] md:text-[18px] font-bold text-[#3B2F25] mb-4"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {prefecture}のほかのエリアから探す
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {nearbyAreas.map((a) => (
                <Link
                  key={a.slug}
                  href={areaPath(prefectureSlug, a.slug)}
                  className="text-[14px] font-medium text-[#6FAA88] hover:text-[#4A9070] transition-colors"
                >
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="px-4 md:px-10 lg:px-24 xl:px-40 pb-12 flex justify-center gap-6">
        <Link
          href={prefecturePath(prefectureSlug)}
          className="text-[14px] font-medium text-[#6FAA88] hover:text-[#4A9070] transition-colors"
        >
          {prefecture}の店舗一覧を見る
        </Link>
        <Link
          href="/request"
          className="text-[14px] font-medium text-[#B8906A] underline underline-offset-2 hover:text-[#9A7050] transition-colors"
        >
          掲載してほしいカフェを知らせる
        </Link>
      </div>
    </>
  );
}
