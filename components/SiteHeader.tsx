"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Plus } from "lucide-react";
import SiteLogoMark from "./SiteLogoMark";
import { CTA_BUTTON_CLS } from "@/lib/cta";

const PC_HEADER_NAV = [
  { label: "お店を探す", to: "/" },
  { label: "このサイトについて", to: "/about" },
  { label: "お問い合わせ", to: "/contact" },
] as const;

const SP_MENU_NAV = [
  { label: "店舗を探す", to: "/" },
  { label: "このサイトについて", to: "/about" },
  { label: "利用規約", to: "/terms" },
  { label: "お問い合わせ", to: "/contact" },
] as const;

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <>
      <header
        className={`sticky top-0 z-50 bg-white ${
          isHome
            ? ""
            : "border-b border-[rgba(62,43,35,0.07)] shadow-[0_1px_4px_rgba(62,43,35,0.05)]"
        }`}
      >
        {/* SP */}
        <div className="md:hidden flex items-center justify-between px-4 h-14">
          <Link href="/" className="flex items-center gap-2">
            <SiteLogoMark size="md" />
            <span
              className="font-extrabold text-[17px] text-[#3E2B23] tracking-tight"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              犬と行けるカフェ
            </span>
          </Link>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-[#FAF7F2] transition-colors"
            aria-label={menuOpen ? "メニューを閉じる" : "メニューを開く"}
          >
            {menuOpen ? (
              <X size={18} className="text-[#3E2B23]" />
            ) : (
              <Menu size={20} className="text-[#3E2B23]" />
            )}
          </button>
        </div>

        {/* PC */}
        <div className="hidden md:flex items-center justify-between px-10 lg:px-24 xl:px-40 h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <SiteLogoMark size="lg" />
            <span
              className="font-extrabold text-[18px] text-[#3E2B23] tracking-tight"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              犬と行けるカフェ
            </span>
          </Link>
          <div className="flex items-center gap-6 lg:gap-8">
            <nav className="flex items-center gap-5 lg:gap-6">
              {PC_HEADER_NAV.map((item, i) => (
                <Link
                  key={`${item.label}-${i}`}
                  href={item.to}
                  className="text-[14px] text-[#3E2B23] font-medium hover:text-[#759F88] transition-colors whitespace-nowrap"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <Link
              href="/request"
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-[14px] whitespace-nowrap ${CTA_BUTTON_CLS}`}
            >
              <Plus size={14} strokeWidth={3} />
              掲載リクエスト
            </Link>
          </div>
        </div>
      </header>

      {/* SP drawer */}
      {menuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 z-40 bg-white border-b border-[rgba(62,43,35,0.07)] shadow-lg px-4 py-4 space-y-1">
          {SP_MENU_NAV.map((item, i) => (
            <Link
              key={`${item.label}-${i}`}
              href={item.to}
              onClick={() => setMenuOpen(false)}
              className="block px-3 py-2.5 rounded-2xl text-sm text-[#3E2B23] hover:bg-[#E8F0EB] hover:text-[#4F856C] font-medium transition-colors"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-[rgba(62,43,35,0.07)]">
            <Link
              href="/request"
              onClick={() => setMenuOpen(false)}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-full text-sm ${CTA_BUTTON_CLS}`}
            >
              <Plus size={13} strokeWidth={3} />
              掲載リクエスト
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
