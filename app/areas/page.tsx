import type { Metadata } from "next";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { getAreas, getPrefectures } from "@/lib/queries";
import { siteUrl } from "@/lib/format";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "エリア一覧",
  description:
    "犬と行けるカフェを都道府県・エリアから探せます。エリアごとに犬同伴可能なカフェ・レストランの一覧を掲載しています。",
  alternates: { canonical: `${siteUrl()}/areas` },
};

export default async function AreaIndexPage() {
  const [prefectures, areas] = await Promise.all([getPrefectures(), getAreas()]);

  return (
    <>
      <div className="px-4 md:px-10 lg:px-24 xl:px-40 pt-6 pb-5 md:py-10 bg-[#EDF5F1] border-b border-[rgba(59,47,37,0.07)]">
        <div className="max-w-[1040px] mx-auto">
          <p className="text-[13px] font-medium text-[#6FAA88] flex items-center gap-1.5 mb-1.5">
            <PawPrint size={12} strokeWidth={2.5} />
            エリアから探す
          </p>
          <h1
            className="text-[22px] md:text-[30px] font-extrabold text-[#3B2F25] leading-tight"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            エリア一覧
          </h1>
        </div>
      </div>

      <div className="px-4 md:px-10 lg:px-24 xl:px-40 py-6 md:py-10">
        <div className="max-w-[1040px] mx-auto space-y-10">
          {/* 都道府県 */}
          <section>
            <p
              className="text-[17px] md:text-[20px] font-bold text-[#3B2F25] mb-4"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              都道府県から探す
            </p>
            {prefectures.length === 0 ? (
              <div className="bg-white rounded-xl p-8 text-center text-[#9A8878] text-[14px]">
                現在表示できるエリアがありません。
              </div>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {prefectures.map((p) => (
                  <Link
                    key={p.slug}
                    href={`/areas/${p.slug}`}
                    className="px-4 py-2 rounded-full text-[13px] font-medium bg-[#EDE6DE] text-[#3B2F25] hover:bg-[#6FAA88] hover:text-white transition-all"
                  >
                    {p.label}
                    <span className="ml-1 opacity-70">{p.count}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* 主要エリア */}
          {areas.length > 0 && (
            <section>
              <p
                className="text-[17px] md:text-[20px] font-bold text-[#3B2F25] mb-4"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                主要エリアから探す
              </p>
              <div className="flex flex-wrap gap-2.5">
                {areas.map((a) => (
                  <Link
                    key={a.slug}
                    href={`/area/${a.slug}`}
                    className="px-4 py-2 rounded-full text-[13px] font-medium bg-[#ECF4EF] text-[#4A9070] border border-[#C5E0D5] hover:bg-[#6FAA88] hover:text-white hover:border-[#6FAA88] transition-all"
                  >
                    {a.label}
                    <span className="ml-1 opacity-70">{a.count}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
