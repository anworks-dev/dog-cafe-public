import type { Metadata } from "next";
import { PawPrint } from "lucide-react";
import AreaExplorer from "@/components/AreaExplorer";
import FvGinghamBand from "@/components/FvGinghamBand";
import { getApprovedReviewCounts, getPublishedShops, attachShopCardImages } from "@/lib/queries";
import { siteUrl } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "犬と行けるカフェ・お店一覧",
  description:
    "犬と一緒に行けるカフェ・レストラン・お店の一覧ページです。店内OK・テラスOK・大型犬OK・ドッグメニューありなどの条件から、愛犬とのおでかけ先を探せます。",
  alternates: { canonical: `${siteUrl()}/list` },
};

export default async function ListPage() {
  const [shopsRaw, reviewCounts] = await Promise.all([
    getPublishedShops(),
    getApprovedReviewCounts(),
  ]);
  const shops = await attachShopCardImages(shopsRaw);

  return (
    <>
      <FvGinghamBand className="px-4 md:px-10 lg:px-24 xl:px-40 pt-6 pb-5 md:py-10 border-b border-[rgba(59,47,37,0.07)]">
        <div className="max-w-[1040px] mx-auto">
          <p className="text-[13px] font-medium text-[#759F88] flex items-center gap-1.5 mb-1.5">
            <PawPrint size={12} strokeWidth={2.5} />
            お店を探す
          </p>
          <h1
            className="text-[22px] md:text-[30px] font-extrabold text-[#3E2B23] leading-tight"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            犬と行けるカフェ・お店一覧
          </h1>
        </div>
      </FvGinghamBand>

      <div className="pt-6 md:pt-8">
        <AreaExplorer shops={shops} resultLabel="検索結果" reviewCounts={reviewCounts} />
      </div>
    </>
  );
}
