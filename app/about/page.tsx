import type { Metadata } from "next";
import Link from "next/link";
import { Search, Filter, Star, PawPrint, ArrowRight } from "lucide-react";
import { siteUrl } from "@/lib/format";

export const metadata: Metadata = {
  title: "このサイトについて",
  description:
    "犬と行けるカフェは、犬と一緒に行けるカフェ・レストラン・お店を口コミや条件から探せるサイトです。掲載情報はユーザー投稿をもとにしているため、来店前に公式情報をご確認ください。",
  alternates: { canonical: `${siteUrl()}/about` },
};

const SECTIONS = [
  {
    title: "犬と行けるカフェとは",
    body: "犬と行けるカフェは、犬と一緒に入店できるカフェの情報と、実際に訪れたユーザーの口コミを掲載するサイトです。エリアや店内OK・テラスOKなどの条件から簡単に検索できます。",
  },
  {
    title: "店舗情報・口コミについて",
    body: "店舗情報は運営が内容を確認・管理したうえで掲載しています。口コミは、サイトをご利用のユーザーの皆様からの投稿によって公開されます。",
  },
  {
    title: "掲載内容についてのご注意",
    body: "掲載情報の正確性については万全を期しておりますが、内容を保証するものではありません。口コミの内容の責任は投稿者に帰属します。ご来店の際は、事前に店舗へ最新情報をご確認ください。また、掲載してほしいカフェのご連絡や、掲載内容の修正依頼も受け付けております。",
  },
  {
    title: "運営情報",
    body: "運営：犬と行けるカフェ運営事務局",
  },
];

const STEPS = [
  { num: "1", label: "お店を探す", icon: <Search size={20} />, desc: "エリア・駅名・キーワードから検索" },
  { num: "2", label: "条件で絞り込む", icon: <Filter size={20} />, desc: "店内OK・大型犬OKなど条件を選択" },
  { num: "3", label: "口コミを見る", icon: <Star size={20} />, desc: "実際に訪れた方のリアルな体験談" },
  { num: "4", label: "体験を投稿する", icon: <PawPrint size={20} />, desc: "あなたのおでかけ体験をシェア" },
];

export default function AboutPage() {
  return (
    <>
      {/* SP */}
      <div className="md:hidden px-4 py-5 space-y-5">
        <h1
          className="text-[20px] font-extrabold text-[#3B2F25]"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          このサイトについて
        </h1>

        {SECTIONS.map((s) => (
          <div
            key={s.title}
            className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(59,47,37,0.07)] space-y-2"
          >
            <p
              className="text-[15px] font-bold text-[#3B2F25]"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              {s.title}
            </p>
            <p className="text-[13px] text-[#9A8878] leading-relaxed">{s.body}</p>
          </div>
        ))}

        <div className="space-y-3">
          <p
            className="text-[15px] font-bold text-[#3B2F25]"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            使い方
          </p>
          <div className="grid grid-cols-2 gap-3">
            {STEPS.map((step) => (
              <div
                key={step.num}
                className="bg-white rounded-2xl p-4 shadow-[0_1px_4px_rgba(59,47,37,0.07)] flex flex-col items-center gap-2 text-center"
              >
                <div className="w-8 h-8 bg-[#6FAA88] rounded-full flex items-center justify-center text-white font-bold text-[14px]">
                  {step.num}
                </div>
                <p className="text-[13px] font-semibold text-[#3B2F25]">{step.label}</p>
                <p className="text-[11px] text-[#9A8878] leading-snug">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <Link
          href="/request"
          className="block w-full py-3.5 bg-[#E0784A] text-white rounded-xl text-[15px] font-bold text-center hover:bg-[#CC6A3D] active:scale-[0.98] transition-all shadow-sm"
        >
          掲載リクエストを送る
        </Link>
        <Link
          href="/contact"
          className="block w-full py-3.5 text-center bg-white text-[#6FAA88] border border-[#6FAA88] rounded-xl text-[15px] font-bold hover:bg-[#ECF4EF] transition-colors"
        >
          お問い合わせはこちら
        </Link>
      </div>

      {/* PC */}
      <div className="hidden md:block">
        <div className="max-w-[840px] mx-auto px-10 py-12 space-y-10">
          <h1
            className="text-[28px] font-extrabold text-[#3B2F25]"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            犬と行けるカフェについて
          </h1>

          <div className="space-y-8">
            {SECTIONS.map((s) => (
              <div
                key={s.title}
                className="space-y-2 pb-8 border-b border-[rgba(59,47,37,0.07)] last:border-0 last:pb-0"
              >
                <p
                  className="text-[18px] font-bold text-[#3B2F25]"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  {s.title}
                </p>
                <p className="text-[14px] text-[#9A8878] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>

          <div className="space-y-5">
            <p
              className="text-[18px] font-bold text-[#3B2F25]"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              使い方
            </p>
            <div className="flex gap-4 items-stretch">
              {STEPS.map((step, i) => (
                <div key={step.num} className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-[0_1px_6px_rgba(59,47,37,0.08)] px-4 py-6 flex flex-col items-center gap-3 text-center">
                    <div className="w-8 h-8 bg-[#6FAA88] rounded-full flex items-center justify-center text-white font-bold text-[14px]">
                      {step.num}
                    </div>
                    <div className="text-[#6FAA88]">{step.icon}</div>
                    <p className="text-[14px] font-bold text-[#3B2F25]">{step.label}</p>
                    <p className="text-[12px] text-[#9A8878] leading-snug">{step.desc}</p>
                  </div>
                  {i < STEPS.length - 1 && (
                    <ArrowRight size={18} className="text-[#C5E0D5] shrink-0" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4 border-t border-[rgba(59,47,37,0.07)]">
            <Link
              href="/request"
              className="px-8 py-4 bg-[#E0784A] text-white rounded-xl text-[16px] font-bold hover:bg-[#CC6A3D] active:scale-[0.98] transition-all shadow-md"
            >
              掲載リクエストを送る
            </Link>
            <Link
              href="/contact"
              className="text-[13px] font-medium text-[#6FAA88] hover:text-[#4A9070] transition-colors"
            >
              お問い合わせはこちら
            </Link>
            <Link
              href="/"
              className="text-[13px] font-medium text-[#B8906A] hover:text-[#9A7050] transition-colors"
            >
              ← TOPに戻る
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
