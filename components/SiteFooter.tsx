import Link from "next/link";
import SiteLogoMark from "./SiteLogoMark";

const year = new Date().getFullYear();

export default function SiteFooter() {
  return (
    <footer className="bg-[#3B2F25]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-10 lg:px-24 xl:px-40 py-8 md:py-10">
        {/* PC: centered */}
        <div className="hidden md:flex flex-col items-center gap-2 text-center">
          <div className="flex items-center gap-2 mb-1">
            <SiteLogoMark size="sm" className="shadow-none" />
            <span
              className="font-bold text-white text-[14px]"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              犬と行けるカフェ
            </span>
          </div>
          <div className="flex gap-3 text-[13px] text-[#9A8878] flex-wrap justify-center">
            <Link href="/about" className="hover:text-white transition-colors">
              このサイトについて
            </Link>
            <span>|</span>
            <Link href="/contact" className="hover:text-white transition-colors">
              お問い合わせ
            </Link>
            <span>|</span>
            <Link href="/terms" className="hover:text-white transition-colors">
              利用規約
            </Link>
          </div>
          <p className="text-[12px] text-[#6A5E54]">© {year} 犬と行けるカフェ</p>
        </div>
        {/* SP: left */}
        <div className="md:hidden">
          <div className="flex items-center gap-2 mb-3">
            <SiteLogoMark size="sm" className="shadow-none" />
            <span
              className="font-bold text-white text-[15px]"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              犬と行けるカフェ
            </span>
          </div>
          <p className="text-[12px] text-[#9A8878] mb-4">
            犬と一緒に行けるカフェ・お店をみんなで共有できるサービスです。
          </p>
          <div className="flex gap-5 mb-4 flex-wrap">
            <Link
              href="/about"
              className="text-[11px] text-[#9A8878] hover:text-white transition-colors"
            >
              このサイトについて
            </Link>
            <Link
              href="/contact"
              className="text-[11px] text-[#9A8878] hover:text-white transition-colors"
            >
              お問い合わせ
            </Link>
            <Link
              href="/terms"
              className="text-[11px] text-[#9A8878] hover:text-white transition-colors"
            >
              利用規約
            </Link>
          </div>
          <p className="text-[11px] text-[#6A5E54]">© {year} 犬と行けるカフェ</p>
        </div>
      </div>
    </footer>
  );
}
