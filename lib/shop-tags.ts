import type { ShopTag } from "./types";

export const TAG_CLS = {
  green: "bg-[#ECF4EF] text-[#4A9070] border-[#C5E0D5]",
  brown: "bg-[#F2E8DC] text-[#9A6840] border-[#DFD0BC]",
  orange: "bg-[#FFF3EB] text-[#C05A25] border-[#F5D5C0]",
} as const;

/** Top-page filter chip — unselected matches CafeCard tag colors; selected uses primary fill. */
export function conditionFilterChipClass(
  v: ShopTag["v"],
  selected: boolean,
): string {
  const base =
    "whitespace-nowrap px-3 py-1.5 rounded-[4px] text-[11px] font-semibold border transition-all";
  if (selected) {
    return `${base} bg-[#6FAA88] text-white border-[#6FAA88]`;
  }
  return `${base} ${TAG_CLS[v]} hover:brightness-[0.97]`;
}
