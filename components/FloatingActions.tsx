"use client";

import type { ReactNode } from "react";
import { useClaimFloatingDock } from "./FloatingDockContext";
import ScrollToTopButton from "./ScrollToTopButton";

type Props = {
  children: ReactNode;
};

/**
 * Right-bottom fixed stack: pug CTA (optional child) above scroll-to-top.
 * Claims the floating dock so the layout-only BackToTop stays hidden.
 */
export default function FloatingActions({ children }: Props) {
  useClaimFloatingDock();

  return (
    <div
      className="fixed z-40 flex flex-col items-center gap-2.5 md:gap-3
        right-3 md:right-6
        bottom-[calc(1rem+env(safe-area-inset-bottom,0px))]
        md:bottom-6"
    >
      {children}
      <ScrollToTopButton embedded />
    </div>
  );
}
