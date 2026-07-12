import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const INPUT_PATH = resolve(process.cwd(), "tmp/google-place-candidates.json");
const OUTPUT_PATH = resolve(process.cwd(), "tmp/google-place-candidates-review.csv");

const PREFECTURE_REGEX = /(北海道|東京都|(?:京都|大阪)府|[^\s　]+県)/;

type PlaceCandidate = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
};

type ShopCandidateResult = {
  shopId: number;
  shopName: string;
  searchQuery: string;
  candidates: PlaceCandidate[];
  error: string | null;
};

type ReviewRow = {
  shopId: number;
  shopName: string;
  searchQuery: string;
  candidateCount: number;
  placeId: string;
  googleDisplayName: string;
  formattedAddress: string;
  prefectureMatch: boolean;
  needsReview: boolean;
  reviewNote: string;
};

const CSV_HEADERS = [
  "shopId",
  "shopName",
  "searchQuery",
  "candidateCount",
  "placeId",
  "googleDisplayName",
  "formattedAddress",
  "prefectureMatch",
  "needsReview",
  "reviewNote",
] as const;

function extractPrefecture(searchQuery: string): string | null {
  const match = searchQuery.match(PREFECTURE_REGEX);
  return match?.[1] ?? null;
}

function normalizeName(name: string): string {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u3000]+/g, "")
    .replace(
      /[・･&＆\-−ー―／/｜|()（）「」『』【】\[\]{}.,、。!！?？:：;；'"＂＇]/g,
      "",
    )
    .replace(/(本店|支店|直営店|旗艦店|グランベリーパーク店)$/g, "")
    .replace(/店$/g, "");
}

function levenshtein(a: string, b: string): number {
  const matrix = Array.from({ length: a.length + 1 }, () =>
    Array<number>(b.length + 1).fill(0),
  );

  for (let i = 0; i <= a.length; i += 1) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j += 1) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[a.length][b.length];
}

function nameMatchesWell(shopName: string, googleName: string): boolean {
  const normalizedShop = normalizeName(shopName);
  const normalizedGoogle = normalizeName(googleName);

  if (!normalizedShop || !normalizedGoogle) return false;
  if (normalizedShop === normalizedGoogle) return true;
  if (
    normalizedShop.includes(normalizedGoogle) ||
    normalizedGoogle.includes(normalizedShop)
  ) {
    return true;
  }

  const distance = levenshtein(normalizedShop, normalizedGoogle);
  const similarity =
    1 - distance / Math.max(normalizedShop.length, normalizedGoogle.length);

  return similarity >= 0.72;
}

function checkPrefectureMatch(
  searchQuery: string,
  formattedAddress: string,
): boolean {
  const prefecture = extractPrefecture(searchQuery);
  if (!prefecture) return true;
  return formattedAddress.includes(prefecture);
}

function evaluateCandidateRow(
  shop: ShopCandidateResult,
  candidate: PlaceCandidate | null,
): ReviewRow {
  const candidateCount = shop.candidates.length;
  const reasons: string[] = [];
  let needsReview = false;

  if (shop.error) {
    needsReview = true;
    reasons.push(`APIエラー: ${shop.error}`);
  }

  if (candidateCount === 0) {
    needsReview = true;
    reasons.push("候補が0件");
    return {
      shopId: shop.shopId,
      shopName: shop.shopName,
      searchQuery: shop.searchQuery,
      candidateCount,
      placeId: "",
      googleDisplayName: "",
      formattedAddress: "",
      prefectureMatch: true,
      needsReview,
      reviewNote: reasons.join(" / "),
    };
  }

  if (candidateCount >= 2) {
    needsReview = true;
    reasons.push(`候補が${candidateCount}件`);
  }

  if (!candidate) {
    return {
      shopId: shop.shopId,
      shopName: shop.shopName,
      searchQuery: shop.searchQuery,
      candidateCount,
      placeId: "",
      googleDisplayName: "",
      formattedAddress: "",
      prefectureMatch: true,
      needsReview: true,
      reviewNote: "候補データがありません",
    };
  }

  const prefectureMatch = checkPrefectureMatch(
    shop.searchQuery,
    candidate.formattedAddress,
  );
  if (!prefectureMatch) {
    needsReview = true;
    const prefecture = extractPrefecture(shop.searchQuery);
    reasons.push(
      prefecture
        ? `都道府県不一致（検索文: ${prefecture}）`
        : "都道府県不一致",
    );
  }

  if (!nameMatchesWell(shop.shopName, candidate.displayName)) {
    needsReview = true;
    reasons.push(
      `店舗名の差が大きい（サイト: ${shop.shopName} / Google: ${candidate.displayName}）`,
    );
  }

  if (!needsReview) {
    reasons.push("問題なし");
  }

  return {
    shopId: shop.shopId,
    shopName: shop.shopName,
    searchQuery: shop.searchQuery,
    candidateCount,
    placeId: candidate.placeId,
    googleDisplayName: candidate.displayName,
    formattedAddress: candidate.formattedAddress,
    prefectureMatch,
    needsReview,
    reviewNote: reasons.join(" / "),
  };
}

function escapeCsvValue(value: string | number | boolean): string {
  const text = String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function toCsv(rows: ReviewRow[]): string {
  const lines = [
    CSV_HEADERS.join(","),
    ...rows.map((row) =>
      CSV_HEADERS.map((header) => escapeCsvValue(row[header])).join(","),
    ),
  ];
  return `${lines.join("\n")}\n`;
}

function summarizeShopReview(rows: ReviewRow[]): boolean {
  return rows.some((row) => row.needsReview);
}

function main(): void {
  let raw: string;
  try {
    raw = readFileSync(INPUT_PATH, "utf-8");
  } catch {
    throw new Error(`入力ファイルが見つかりません: ${INPUT_PATH}`);
  }

  const shops = JSON.parse(raw) as ShopCandidateResult[];
  const rows: ReviewRow[] = [];

  for (const shop of shops) {
    if (shop.candidates.length === 0) {
      rows.push(evaluateCandidateRow(shop, null));
      continue;
    }

    for (const candidate of shop.candidates) {
      rows.push(evaluateCandidateRow(shop, candidate));
    }
  }

  mkdirSync(resolve(process.cwd(), "tmp"), { recursive: true });
  const csvBody = toCsv(rows);
  writeFileSync(OUTPUT_PATH, `\uFEFF${csvBody}`, "utf-8");

  const shopGroups = new Map<number, ReviewRow[]>();
  for (const row of rows) {
    const group = shopGroups.get(row.shopId) ?? [];
    group.push(row);
    shopGroups.set(row.shopId, group);
  }

  const reviewShops: Array<{ shopName: string; reasons: string }> = [];
  let okShopCount = 0;
  let reviewShopCount = 0;

  for (const shopRows of shopGroups.values()) {
    const needsReview = summarizeShopReview(shopRows);
    if (needsReview) {
      reviewShopCount += 1;
      const reasons = [...new Set(shopRows.flatMap((row) => row.reviewNote.split(" / ")))].join(
        " / ",
      );
      reviewShops.push({
        shopName: shopRows[0]?.shopName ?? "",
        reasons,
      });
    } else {
      okShopCount += 1;
    }
  }

  console.log(`出力: ${OUTPUT_PATH}`);
  console.log(`CSV総行数: ${rows.length}`);
  console.log(`needsReview=false の店舗数: ${okShopCount}`);
  console.log(`needsReview=true の店舗数: ${reviewShopCount}`);
  console.log("要確認店舗:");
  for (const shop of reviewShops) {
    console.log(`- ${shop.shopName}: ${shop.reasons}`);
  }
  console.log("Supabaseは更新していません。");
}

main();
