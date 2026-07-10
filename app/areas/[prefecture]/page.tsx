import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PawPrint } from "lucide-react";
import CafeCard from "@/components/CafeCard";
import { getPrefectures, getShopsByPrefecture } from "@/lib/queries";
import { siteUrl } from "@/lib/format";

export const revalidate = 300;

export async function generateStaticParams() {
  const prefectures = await getPrefectures();
  return prefectures.map((pref) => ({ prefecture: pref.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ prefecture: string }>;
}): Promise<Metadata> {
  const { prefecture } = await params;
  const shops = await getShopsByPrefecture(prefecture);
  if (shops.length === 0) {
    return { title: "エリアが見つかりません", robots: { index: false, follow: false } };
  }
  const label = shops[0].prefecture;
  const title = `${label}で犬と行けるカフェ一覧`;
  const description = `${label}にある犬同伴可能なカフェ・レストランを${shops.length}件掲載。店内OK・テラスOK・大型犬OKなど条件から愛犬とのおでかけ先を探せます。`;
  const url = `${siteUrl()}/areas/${prefecture}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", title, description, url },
  };
}

export default async function PrefecturePage({
  params,
}: {
  params: Promise<{ prefecture: string }>;
}) {
  const { prefecture } = await params;
  const shops = await getShopsByPrefecture(prefecture);
  if (shops.length === 0) notFound();

  const label = shops[0].prefecture;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "ホーム", item: siteUrl() },
      {
        "@type": "ListItem",
        position: 2,
        name: `${label}のカフェ`,
        item: `${siteUrl()}/areas/${prefecture}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* Hero */}
      <div
        className="px-4 md:px-10 lg:px-24 xl:px-40 pt-6 pb-5 md:py-10"
        style={{ backgroundColor: "#EDF5F1", backgroundImage: "none" }}
      >
        <div className="max-w-[1040px] mx-auto">
          <nav className="text-[12px] text-[#9A8878] flex items-center gap-1.5 mb-3">
            <Link href="/" className="hover:text-[#4A9070] transition-colors">
              ホーム
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
            {label}で犬と行けるカフェ
          </h1>
          <p className="text-[13px] md:text-[14px] text-[#6A5E54] leading-relaxed">
            {label}にある愛犬と一緒に楽しめるお店を
            <span className="text-[#6FAA88] font-bold">{shops.length}</span>件掲載しています。
          </p>
        </div>
      </div>

      {/* List */}
      <div className="px-4 md:px-10 lg:px-24 xl:px-40 py-6 md:py-10">
        <div className="max-w-[1040px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {shops.map((shop) => (
            <CafeCard key={shop.id} shop={shop} />
          ))}
        </div>
      </div>
    </>
  );
}
