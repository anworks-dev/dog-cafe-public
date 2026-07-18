import type { Shop, ShopTag } from "./types";

export type DogConditionChip = {
  chip: string;
  matchLabels: string[];
  /** Display tone: positive = green filterable; rule = attention (not filterable on FV). */
  kind: "positive" | "rule";
};

/**
 * Positive (green) — usable as search filters on FV.
 * matchLabels cover DB label variants.
 */
export const POSITIVE_DOG_CONDITIONS: DogConditionChip[] = [
  { chip: "店内OK", matchLabels: ["店内OK"], kind: "positive" },
  { chip: "テラスOK", matchLabels: ["テラスOK"], kind: "positive" },
  { chip: "大型犬OK", matchLabels: ["大型犬OK"], kind: "positive" },
  {
    chip: "膝や椅子の上OK",
    matchLabels: ["膝や椅子の上OK", "膝の上や椅子の上OK"],
    kind: "positive",
  },
];

/**
 * Rules (red) — shown on cards/detail as attention badges.
 * Not used as FV search filters. Combined DB tag maps to all three.
 */
export const RULE_DOG_CONDITIONS: DogConditionChip[] = [
  {
    chip: "リード必須",
    matchLabels: ["リード必須", "リード・おむつ・カート必須"],
    kind: "rule",
  },
  {
    chip: "おむつ・マナーウェア必須",
    matchLabels: ["おむつ・マナーウェア必須", "リード・おむつ・カート必須"],
    kind: "rule",
  },
  {
    chip: "カート必須",
    matchLabels: ["カート必須", "リード・おむつ・カート必須"],
    kind: "rule",
  },
];

/** @deprecated Prefer POSITIVE_DOG_CONDITIONS — kept for callers that listed all chips. */
export const TOP_DOG_CONDITIONS: DogConditionChip[] = [
  ...POSITIVE_DOG_CONDITIONS,
  ...RULE_DOG_CONDITIONS,
];

/** Labels treated as positive (green) on cards / detail. */
const POSITIVE_LABELS = new Set(
  POSITIVE_DOG_CONDITIONS.flatMap((c) => c.matchLabels),
);

/** Labels treated as rules (red) on cards / detail. */
const RULE_LABELS = new Set([
  ...RULE_DOG_CONDITIONS.flatMap((c) => c.matchLabels),
  "リード・おむつ・カート必須",
]);

export type ConditionTagKind = "positive" | "rule" | "other";

export function conditionTagKind(label: string): ConditionTagKind {
  const trimmed = label.trim();
  if (POSITIVE_LABELS.has(trimmed)) return "positive";
  if (RULE_LABELS.has(trimmed)) return "rule";
  return "other";
}

export function shopHasConditionTag(shop: Shop, matchLabels: string[]): boolean {
  const shopLabels = shop.tags
    .map((t) => t.label.trim())
    .filter((label) => label.length > 0);
  return matchLabels.some((matchLabel) => shopLabels.includes(matchLabel.trim()));
}

/** Whether a shop satisfies one search chip (any of its matchLabels on shop.tags). */
export function shopMatchesConditionChip(shop: Shop, chip: string): boolean {
  const config = POSITIVE_DOG_CONDITIONS.find((c) => c.chip === chip);
  return config ? shopHasConditionTag(shop, config.matchLabels) : false;
}

export function shopMatchesAllConditions(shop: Shop, chips: string[]): boolean {
  if (chips.length === 0) return true;
  return chips.every((chip) => shopMatchesConditionChip(shop, chip));
}

/** Parse URL tags= — only positive (filterable) chips are accepted. */
export function parseConditionChipsFromParam(raw: string | null): string[] {
  if (!raw) return [];
  const known = new Set(POSITIVE_DOG_CONDITIONS.map((c) => c.chip));
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((chip) => known.has(chip));
}

/** Resolve display variant from label (overrides stale shops.tags.v from DB). */
export function displayVariantForTagLabel(label: string): ShopTag["v"] {
  const kind = conditionTagKind(label);
  if (kind === "positive") return "green";
  if (kind === "rule") return "orange";
  return "brown";
}

/**
 * Tags for cafe cards / shop detail (display only — includes rules).
 * Order: positive (green) → rule (red) → other.
 * Never filters out rule tags.
 */
export function orderTagsForDisplay(tags: ShopTag[]): ShopTag[] {
  const positive: ShopTag[] = [];
  const rules: ShopTag[] = [];
  const other: ShopTag[] = [];
  for (const tag of tags) {
    if (!tag?.label?.trim()) continue;
    const kind = conditionTagKind(tag.label);
    if (kind === "positive") positive.push(tag);
    else if (kind === "rule") rules.push(tag);
    else other.push(tag);
  }
  return [...positive, ...rules, ...other];
}

/**
 * Cafe card tag selection.
 * When `limit` is set (SP), keep at least one rule badge if the shop has any,
 * so greens alone don't push rules off the visible set.
 */
export function selectTagsForCafeCard(tags: ShopTag[], limit?: number): ShopTag[] {
  const ordered = orderTagsForDisplay(tags);
  if (limit == null || ordered.length <= limit) return ordered;

  const positive = ordered.filter((t) => conditionTagKind(t.label) === "positive");
  const rules = ordered.filter((t) => conditionTagKind(t.label) === "rule");
  const other = ordered.filter((t) => conditionTagKind(t.label) === "other");

  if (rules.length > 0 && limit >= 2) {
    const out: ShopTag[] = [];
    if (positive.length > 0) out.push(positive[0]);
    out.push(rules[0]);
    for (const t of [...positive.slice(1), ...rules.slice(1), ...other]) {
      if (out.length >= limit) break;
      if (!out.includes(t)) out.push(t);
    }
    return out.slice(0, limit);
  }

  return ordered.slice(0, limit);
}
