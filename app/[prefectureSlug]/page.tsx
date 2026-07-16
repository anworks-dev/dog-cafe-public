import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PawPrint } from "lucide-react";
import AreaExplorer from "@/components/AreaExplorer";
import {
  attachShopCardImages,
  getApprovedReviewCounts,
  getAreas,
  getPrefectures,
  getShopsByPrefecture,
} from "@/lib/queries";
import {
  areaPath,
  isReservedPathSegment,
  prefectureUrl,
} from "@/lib/location-paths";
import { siteUrl } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  const prefectures = await getPrefectures();
  return prefectures
    .filter((p) => p.slug && !isReservedPathSegment(p.slug))
    .map((p) => ({ prefectureSlug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ prefectureSlug: string }>;
}): Promise<Metadata> {
  const { prefectureSlug } = await params;
  if (isReservedPathSegment(prefectureSlug)) {
    return { title: "ページが見つかりません", robots: { index: false, follow: false } };
  }
  const shops = await getShopsByPrefecture(prefectureSlug);
  if (shops.length === 0) {
    return { title: "都道府県が見つかりません", robots: { index: false, follow: false } };
  }
  const label = shops[0].prefecture;
  const title = `${label}の犬と行けるカフェ・お店一覧`;
  const description = `${label}で犬と一緒に行けるカフェ・レストラン・お店を${shops.length}件掲載しています。店内OK・テラスOK・大型犬OKなどの条件から、愛犬とのおでかけ先を探せます。`;
  const url = prefectureUrl(prefectureSlug, siteUrl());
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", title, description, url },
  };
}

export default async function PrefectureListPage({
  params,
}: {
  params: Promise<{ prefectureSlug: string }>;
}) {
  const { prefectureSlug } = await params;
  if (isReservedPathSegment(prefectureSlug)) notFound();

  const [shopsRaw, areas, reviewCounts] = await Promise.all([
    getShopsByPrefecture(prefectureSlug),
    getAreas(),
    getApprovedReviewCounts(),
  ]);
  if (shopsRaw.length === 0) notFound();

  const shops = await attachShopCardImages(shopsRaw);
  const label = shops[0].prefecture;
  const description = `${label}で犬と一緒に行けるカフェ・レストラン・お店を${shops.length}件掲載しています。店内OK・テラスOK・大型犬OKなどの条件から、愛犬とのおでかけ先を探せます。`;

  const areaLinks = areas
    .filter((a) => a.prefectureSlug === prefectureSlug)
    .sort((a, b) => a.label.localeCompare(b.label, "ja"));

  const pageUrl = prefectureUrl(prefectureSlug, siteUrl());
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl() },
      { "@type": "ListItem", position: 2, name: label, item: pageUrl },
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
            <span>{label}</span>
          </nav>
          <p className="text-[13px] font-medium text-[#6FAA88] flex items-center gap-1.5 mb-1.5">
            <PawPrint size={12} strokeWidth={2.5} />
            都道府県から探す
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
        <AreaExplorer shops={shops} resultLabel="検索結果" reviewCounts={reviewCounts} />
      </div>

      {areaLinks.length > 0 && (
        <div className="px-4 md:px-10 lg:px-24 xl:px-40 pb-8">
          <div className="max-w-[1040px] mx-auto">
            <p
              className="text-[17px] md:text-[18px] font-bold text-[#3B2F25] mb-4"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {label}のエリアから探す
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-3">
              {areaLinks.map((a) => (
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
          href="/list"
          className="text-[14px] font-medium text-[#6FAA88] hover:text-[#4A9070] transition-colors"
        >
          全国の店舗一覧を見る
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
