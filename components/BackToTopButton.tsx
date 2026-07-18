"use client";

import ScrollToTopButton from "./ScrollToTopButton";
import { useFloatingDockClaimed } from "./FloatingDockContext";

/**
 * Layout-level scroll-to-top (right bottom).
 * Hidden while FloatingActions owns the dock on list/detail pages.
 */
export default function BackToTopButton() {
  const claimed = useFloatingDockClaimed();
  if (claimed) return null;
  return <ScrollToTopButton />;
}
