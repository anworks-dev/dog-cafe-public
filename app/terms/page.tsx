import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/format";

export const metadata: Metadata = {
  title: "利用規約",
  description:
    "犬と行けるカフェの利用規約ページです。掲載情報、口コミ投稿、免責事項などをご確認ください。",
  alternates: { canonical: `${siteUrl()}/terms` },
};

const TERMS = [
  {
    title: "1. 利用規約",
    body: "本規約は、「犬と行けるカフェ」（以下「本サイト」といいます）の利用条件を定めるものです。本サイトをご利用いただく際は、本規約に同意いただいたものとみなします。",
    list: null as string[] | null,
  },
  {
    title: "2. 掲載情報について",
    body: "本サイトに掲載されている店舗情報は、運営が可能な範囲で確認・管理を行っていますが、内容の正確性・最新性を保証するものではありません。ご来店の際は、事前に店舗へ直接ご確認ください。",
    list: null,
  },
  {
    title: "3. 投稿内容について",
    body: "口コミ・レビューは、本サイトをご利用のユーザーの皆様からの投稿によって公開されます。投稿内容は投稿者個人の感想であり、本サイトの見解を示すものではありません。",
    list: null,
  },
  {
    title: "4. 禁止事項",
    body: "本サイトのご利用にあたり、以下の行為を禁止します。",
    list: [
      "虚偽の情報を投稿する行為",
      "第三者の権利を侵害する行為",
      "法令または公序良俗に反する行為",
      "本サイトの運営を妨げる行為",
    ],
  },
  {
    title: "5. 免責事項",
    body: "本サイトの利用により生じたいかなる損害についても、運営は責任を負いかねます。掲載情報および投稿内容の利用は、利用者ご自身の判断と責任において行ってください。",
    list: null,
  },
  {
    title: "6. 著作権",
    body: "本サイトに掲載されるテキスト・画像等の著作権は、運営または各権利者に帰属します。無断での転載・複製はお断りします。",
    list: null,
  },
  {
    title: "7. 規約の変更",
    body: "本規約は、必要に応じて予告なく変更されることがあります。変更後の内容は、本サイトに掲載された時点から効力を生じるものとします。",
    list: null,
  },
  {
    title: "8. お問い合わせ",
    body: "本規約に関するお問い合わせは、下記のお問い合わせフォームよりご連絡ください。",
    list: null,
  },
];

export default function TermsPage() {
  return (
    <>
      {/* SP */}
      <div className="md:hidden px-4 py-5 space-y-5">
        <h1
          className="text-[20px] font-extrabold text-[#3B2F25]"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          利用規約
        </h1>

        {TERMS.map((t) => (
          <div
            key={t.title}
            className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(59,47,37,0.07)] space-y-2"
          >
            <p
              className="text-[15px] font-bold text-[#3B2F25]"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {t.title}
            </p>
            <p className="text-[13px] text-[#9A8878] leading-relaxed">{t.body}</p>
            {t.list && (
              <ul className="space-y-1 mt-1">
                {t.list.map((item) => (
                  <li key={item} className="text-[13px] text-[#9A8878] flex gap-1.5">
                    <span className="shrink-0">・</span>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

        <Link
          href="/contact"
          className="block w-full py-3.5 text-center text-[15px] font-bold text-[#6FAA88] bg-white border-2 border-[#6FAA88] rounded-xl hover:bg-[#ECF4EF] transition-colors"
        >
          お問い合わせフォームへ
        </Link>
      </div>

      {/* PC */}
      <div className="hidden md:block">
        <div className="max-w-[960px] mx-auto px-10 py-12 space-y-10">
          <h1
            className="text-[28px] font-extrabold text-[#3B2F25]"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            利用規約
          </h1>

          <div className="space-y-8">
            {TERMS.map((t) => (
              <div
                key={t.title}
                className="space-y-2 pb-8 border-b border-[rgba(59,47,37,0.07)] last:border-0 last:pb-0"
              >
                <p
                  className="text-[18px] font-bold text-[#3B2F25]"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  {t.title}
                </p>
                <p className="text-[14px] text-[#9A8878] leading-relaxed">{t.body}</p>
                {t.list && (
                  <ul className="space-y-1 mt-2">
                    {t.list.map((item) => (
                      <li key={item} className="text-[14px] text-[#9A8878] flex gap-2">
                        <span className="shrink-0">・</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-8 py-4 text-[16px] font-bold text-[#6FAA88] bg-white border-2 border-[#6FAA88] rounded-xl hover:bg-[#ECF4EF] transition-colors"
          >
            お問い合わせフォームへ
          </Link>
        </div>
      </div>
    </>
  );
}
