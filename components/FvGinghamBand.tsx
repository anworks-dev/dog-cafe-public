import type { ReactNode } from "react";
import { FV_GINGHAM_CLS } from "@/lib/fv";

type Props = {
  children: ReactNode;
  /** Extra classes (padding, full-bleed helpers, overflow, etc.). */
  className?: string;
};

/**
 * FV band with the shared sage gingham background.
 * Content (headings, forms, cards) stays opaque above the pattern.
 */
export default function FvGinghamBand({ children, className = "" }: Props) {
  return (
    <div className={`${FV_GINGHAM_CLS} ${className}`.trim()}>{children}</div>
  );
}
