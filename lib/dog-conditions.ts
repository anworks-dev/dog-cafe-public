import type { Shop, ShopTag } from "./types";

export type DogConditionChip = {
  chip: string;
  matchLabels: string[];
  v: ShopTag["v"];
};

/**
 * Top-page dog condition chips. `matchLabels` uses labels stored on shops.tags
 * (e.g. combined tag「リード・おむつ・カート必須」,「膝の上や椅子の上OK」).
 */
export const TOP_DOG_CONDITIONS: DogConditionChip[] = [
  { chip: "店内OK", matchLabels: ["店内OK"], v: "green" },
  { chip: "テラスOK", matchLabels: ["テラスOK"], v: "green" },
  { chip: "大型犬OK", matchLabels: ["大型犬OK"], v: "green" },
  {
    chip: "リード必須",
    matchLabels: ["リード必須", "リード・おむつ・カート必須"],
    v: "orange",
  },
  {
    chip: "おむつ・マナーウェア必須",
    matchLabels: ["おむつ・マナーウェア必須", "リード・おむつ・カート必須"],
    v: "orange",
  },
  {
    chip: "カート必須",
    matchLabels: ["カート必須", "リード・おむつ・カート必須"],
    v: "orange",
  },
  {
    chip: "膝や椅子の上OK",
    matchLabels: ["膝や椅子の上OK", "膝の上や椅子の上OK"],
    v: "orange",
  },
];

export function shopHasConditionTag(shop: Shop, matchLabels: string[]): boolean {
  const shopLabels = shop.tags
    .map((t) => t.label.trim())
    .filter((label) => label.length > 0);
  return matchLabels.some((matchLabel) => shopLabels.includes(matchLabel.trim()));
}

/** Whether a shop satisfies one search chip (any of its matchLabels on shop.tags). */
export function shopMatchesConditionChip(shop: Shop, chip: string): boolean {
  const config = TOP_DOG_CONDITIONS.find((c) => c.chip === chip);
  return config ? shopHasConditionTag(shop, config.matchLabels) : false;
}

export function shopMatchesAllConditions(
  shop: Shop,
  chips: string[],
): boolean {
  if (chips.length === 0) return true;
  return chips.every((chip) => shopMatchesConditionChip(shop, chip));
}

export function parseConditionChipsFromParam(raw: string | null): string[] {
  if (!raw) return [];
  const known = new Set(TOP_DOG_CONDITIONS.map((c) => c.chip));
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((chip) => known.has(chip));
}
