/**
 * Soft downward elevation for primary CTAs.
 * Visual rules: `app/globals.css` → `.cta-elevated`
 */
export const CTA_ELEVATION_CLS = "cta-elevated";

/**
 * Main CTA fill — gentle orange (accent). Add size / radius / width on the element.
 * Example: `className={\`w-full py-3 rounded-2xl ${CTA_BUTTON_CLS}\`}`
 */
export const CTA_BUTTON_CLS = [
  "bg-[#E0784A]",
  "text-white",
  "font-bold",
  "hover:bg-[#CC6A3D]",
  "disabled:opacity-60",
  "disabled:cursor-not-allowed",
  "disabled:hover:bg-[#E0784A]",
  CTA_ELEVATION_CLS,
].join(" ");

/** Compact request / secondary-size CTA (same orange + elevation). */
export const CTA_BUTTON_COMPACT_CLS = [
  "inline-flex",
  "items-center",
  "justify-center",
  "min-h-[44px]",
  "px-6",
  "py-2.5",
  "md:px-7",
  "md:py-3",
  "rounded-xl",
  "text-[14px]",
  "md:text-[15px]",
  "text-center",
  CTA_BUTTON_CLS,
].join(" ");
