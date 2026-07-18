"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

const SHOW_AFTER_PX = 450;

export default function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY >= SHOW_AFTER_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="ページ上部へ戻る"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed z-40 flex items-center justify-center rounded-full border border-[#6FAA88] bg-white text-[#6FAA88] shadow-[0_2px_10px_rgba(59,47,37,0.12)] transition-all duration-300 ease-out hover:bg-[#6FAA88] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6FAA88] active:scale-95
        right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] h-11 w-11
        md:right-6 md:bottom-6 md:h-12 md:w-12
        ${
          visible
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 translate-y-2"
        }`}
    >
      <ChevronUp size={22} strokeWidth={2.25} aria-hidden />
    </button>
  );
}
