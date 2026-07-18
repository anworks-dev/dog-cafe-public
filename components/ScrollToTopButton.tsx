"use client";

import { useEffect, useState } from "react";
import { ChevronUp } from "lucide-react";

const SHOW_AFTER_PX = 450;

type Props = {
  /** When true, positioning is handled by FloatingActions parent. */
  embedded?: boolean;
  className?: string;
};

/**
 * Circular “scroll to top” control — restored white + green ring design.
 * Use standalone (fixed right) or embedded under CafePugAction.
 * Embedded mode stays visible so the pug stack doesn’t leave an empty gap.
 */
export default function ScrollToTopButton({
  embedded = false,
  className = "",
}: Props) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (embedded) return;
    const onScroll = () => {
      setScrolled(window.scrollY >= SHOW_AFTER_PX);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [embedded]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const visible = embedded || scrolled;

  const sizeCls = "h-11 w-11 md:h-12 md:w-12";

  const positionCls = embedded
    ? ""
    : "fixed z-40 right-4 bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] md:right-6 md:bottom-6";

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="ページ上部へ戻る"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`flex items-center justify-center rounded-full border border-[#759F88] bg-white text-[#759F88] shadow-[0_2px_10px_rgba(62,43,35,0.1)] transition-all duration-300 ease-out hover:bg-[#759F88] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#759F88] active:scale-95
        ${sizeCls} ${positionCls}
        ${
          visible
            ? "pointer-events-auto opacity-100 translate-y-0"
            : "pointer-events-none opacity-0 translate-y-2"
        }
        ${className}`.trim()}
    >
      <ChevronUp size={embedded ? 20 : 22} strokeWidth={2.25} aria-hidden />
    </button>
  );
}
