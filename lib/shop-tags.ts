import type { ShopTag } from "./types";
import { displayVariantForTagLabel } from "./dog-conditions";

/**
 * Shared condition-badge tones (pill shape applied via CONDITION_BADGE_BASE).
 * Soft sage / warm beige / coral — aligned with pug illustration.
 */
export const TAG_CLS = {
  green: "bg-[#E8F0EB] text-[#4F856C] border-[#BFD4C8]",
  brown: "bg-[#F3E6D8] text-[#9A6840] border-[#E0D0BC]",
  orange: "bg-[#FDF0ED] text-[#C56B5C] border-[#E8C4BC]",
} as const;

/** Pill shell — size variants share shape/colors; only padding/type scale differ. */
export const CONDITION_BADGE_SHELL =
  "inline-flex items-center whitespace-nowrap w-max max-w-full rounded-full font-semibold border";

/** Default size: FV / list filters / detail / PC cards — slightly puffier padding. */
export const CONDITION_BADGE_SIZE_DEFAULT = "px-3.5 py-1.5 text-[11px]";

/** Compact size: SP cafe cards only (info display, not tap targets). */
export const CONDITION_BADGE_SIZE_COMPACT = "px-2.5 py-1 text-[9px]";

/** @deprecated Prefer CONDITION_BADGE_SHELL + size token. */
export const CONDITION_BADGE_BASE = `${CONDITION_BADGE_SHELL} ${CONDITION_BADGE_SIZE_DEFAULT}`;

export const CONDITION_BADGE_GAP = "gap-2";
export const CONDITION_BADGE_GAP_COMPACT = "gap-1.5";

const SELECTED_CLS = "bg-[#759F88] text-white border-[#759F88]";

export function tagClassForLabel(label: string, fallbackV?: ShopTag["v"]): string {
  const v = displayVariantForTagLabel(label);
  if (v === "green" || v === "orange") return TAG_CLS[v];
  return TAG_CLS[fallbackV ?? "brown"] ?? TAG_CLS.brown;
}

export type ConditionBadgeSize = "default" | "compact";

/** Display badge (card / detail) — pill + tone from label. */
export function conditionBadgeClass(
  label: string,
  fallbackV?: ShopTag["v"],
  size: ConditionBadgeSize = "default",
): string {
  const sizeCls =
    size === "compact" ? CONDITION_BADGE_SIZE_COMPACT : CONDITION_BADGE_SIZE_DEFAULT;
  return `${CONDITION_BADGE_SHELL} ${sizeCls} ${tagClassForLabel(label, fallbackV)}`;
}

/** FV / list filter chip — default pill; selected = filled green + white text. */
export function conditionFilterChipClass(selected: boolean): string {
  const base = `${CONDITION_BADGE_SHELL} ${CONDITION_BADGE_SIZE_DEFAULT} transition-all`;
  if (selected) return `${base} ${SELECTED_CLS}`;
  return `${base} ${TAG_CLS.green} hover:brightness-[0.97]`;
}
