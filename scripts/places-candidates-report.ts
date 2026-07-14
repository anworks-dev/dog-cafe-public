import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Dry-run reporter for Google Places candidates.
 * Does NOT update shops / reviews / photos / tags / slugs / status.
 *
 * Usage:
 *   npx tsx scripts/places-candidates-report.ts \
 *     --in=tmp/google-place-candidates-cw-96-104.json \
 *     --out-prefix=tmp/google-place-cw-96-104
 */

const PREFECTURE_REGEX = /(北海道|東京都|(?:京都|大阪)府|[^\s　]+県)/;
const CITY_REGEX = /([^\s　]+?[市区町村郡])/;

const CHAIN_NAME_PATTERNS = [
  /ドトール/,
  /doutor/i,
  /フレッシュネス/,
  /freshness/i,
  /スターバックス/,
  /starbucks/i,
  /タリーズ/,
  /tully'?s/i,
  /コメダ/,
  /サンマルク/,
  /プロント/,
  /上島珈琲/,
  /excelsior/i,
];

type PlaceCandidate = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  websiteUri?: string | null;
};

type ShopCandidateResult = {
  shopId: number;
  shopName: string;
  prefecture: string | null;
  city: string | null;
  address: string | null;
  station: string | null;
  stationLabel: string | null;
  area: string | null;
  referenceUrl: string | null;
  currentGooglePlaceId: string | null;
  searchQuery: string;
  candidates: PlaceCandidate[];
  error: string | null;
};

type Confidence = "高" | "中" | "低";

type CandidateEvaluation = {
  shopId: number;
  shopName: string;
  prefecture: string | null;
  registeredAddress: string;
  nearestStation: string;
  googleName: string;
  googleAddress: string;
  placeId: string;
  nameMatch: boolean;
  nameMatchLevel: "exact" | "same" | "partial" | "none";
  prefectureMatch: boolean;
  locationMatch: boolean;
  locationMatchDetail: string;
  websiteUri: string | null;
  confidence: Confidence;
  isRecommended: boolean;
  autoLinkable: boolean;
  notes: string[];
  provisionalMismatchNotes: string[];
};

type ShopSummary = {
  shopId: number;
  shopName: string;
  recommendedPlaceId: string | null;
  autoLinkable: boolean;
  confidence: Confidence | null;
  reason: string;
  provisionalMismatches: string[];
  candidateCount: number;
};

function parseArgValue(argv: string[], name: string): string | null {
  const prefix = `${name}=`;
  for (const arg of argv) {
    if (arg.startsWith(prefix)) {
      const value = arg.slice(prefix.length).trim();
      return value || null;
    }
  }
  return null;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s\u3000]+/g, "")
    .replace(
      /[・･&＆\-−ー―／/｜|()（）「」『』【】\[\]{}.,、。!！?？:：;；'"＂＇]/g,
      "",
    );
}

function normalizeName(name: string): string {
  return normalizeText(name)
    .replace(/(本店|支店|直営店|旗艦店|グランベリーパーク店)$/g, "")
    .replace(/店$/g, "");
}

function stripStationSuffix(value: string): string {
  return value.replace(/(駅|ていしゃじょう)$/g, "");
}

function extractPrefecture(text: string | null | undefined): string | null {
  if (!text) return null;
  return text.match(PREFECTURE_REGEX)?.[1] ?? null;
}

function extractCity(text: string | null | undefined): string | null {
  if (!text) return null;
  const withoutPref = text.replace(PREFECTURE_REGEX, "");
  return withoutPref.match(CITY_REGEX)?.[1] ?? null;
}

function isChainShop(shopName: string, googleName: string): boolean {
  return CHAIN_NAME_PATTERNS.some(
    (pattern) => pattern.test(shopName) || pattern.test(googleName),
  );
}

function classifyNameMatch(
  shopName: string,
  googleName: string,
): { match: boolean; level: CandidateEvaluation["nameMatchLevel"] } {
  const a = normalizeName(shopName);
  const b = normalizeName(googleName);
  if (!a || !b) return { match: false, level: "none" };
  if (a === b) return { match: true, level: "exact" };

  const shopRaw = normalizeText(shopName);
  const googleRaw = normalizeText(googleName);

  // 森のvoivoi ↔ 森のVoiVoi
  if (shopRaw.includes("voivoi") && googleRaw.includes("voivoi")) {
    return { match: true, level: "same" };
  }

  // Clear same shop: one contains the other with reasonable length
  if (a.includes(b) || b.includes(a)) {
    const shorter = Math.min(a.length, b.length);
    const longer = Math.max(a.length, b.length);
    if (shorter >= 4 && shorter / longer >= 0.45) {
      return { match: true, level: "same" };
    }
    return { match: false, level: "partial" };
  }

  // ビストロ オム 鎌倉 ↔ Bistro Omme 鎌倉
  if (
    (a.includes("ビストロ") || a.includes("bistro")) &&
    (b.includes("bistro") || b.includes("ビストロ")) &&
    a.includes("鎌倉") &&
    b.includes("鎌倉")
  ) {
    return { match: true, level: "same" };
  }
  if (
    (a.includes("オム") && b.includes("omme")) ||
    (b.includes("オム") && a.includes("omme"))
  ) {
    return { match: true, level: "same" };
  }

  // Shared significant token (e.g. FUJIMI CAFE / メッツァラウハ)
  const tokensA = a.match(/[a-z0-9\u3040-\u30ff\u4e00-\u9fff]{3,}/g) ?? [];
  const tokensB = new Set(b.match(/[a-z0-9\u3040-\u30ff\u4e00-\u9fff]{3,}/g) ?? []);
  const shared = tokensA.filter((token) => tokensB.has(token));
  if (shared.some((token) => token.length >= 5)) {
    return { match: true, level: "same" };
  }
  if (shared.length > 0) return { match: false, level: "partial" };
  return { match: false, level: "none" };
}

function buildRegisteredAddress(shop: ShopCandidateResult): string {
  return [shop.prefecture, shop.city, shop.address].filter(Boolean).join(" ").trim() || "（未登録）";
}

function buildNearestStation(shop: ShopCandidateResult): string {
  return shop.station?.trim() || shop.stationLabel?.trim() || shop.area?.trim() || "（未登録）";
}

function evaluateLocationMatch(
  shop: ShopCandidateResult,
  googleAddress: string,
  googleName = "",
): { match: boolean; detail: string } {
  const details: string[] = [];
  const googleAddrNorm = normalizeText(googleAddress);
  const googleNameNorm = normalizeText(googleName);
  const googleHaystack = `${googleAddrNorm}${googleNameNorm}`;

  const cityCandidates = [
    shop.city,
    shop.area,
    extractCity(shop.address),
  ]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  for (const city of cityCandidates) {
    const key = normalizeText(city);
    if (!key) continue;
    if (googleHaystack.includes(key)) {
      details.push(`市区町村/エリア一致:${city}`);
      continue;
    }
    // 武蔵小金井 ↔ 小金井市 のような包含関係
    const googleCity = extractCity(googleAddress);
    if (googleCity) {
      const g = normalizeText(googleCity);
      if (g && (key.includes(g) || g.includes(key))) {
        details.push(`市区町村/エリア近似一致:${city}≈${googleCity}`);
      }
    }
  }

  const stationCandidates = [shop.station, shop.stationLabel]
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));

  for (const station of stationCandidates) {
    const key = normalizeText(stripStationSuffix(station));
    if (key && googleHaystack.includes(key)) {
      details.push(`最寄駅一致:${station}`);
    }
  }

  if (shop.address?.trim()) {
    const compactAddr = normalizeText(shop.address);
    if (compactAddr.length >= 6 && googleAddrNorm.includes(compactAddr)) {
      details.push("住所一致");
    } else {
      const registeredCity = extractCity(shop.address);
      if (registeredCity && googleAddrNorm.includes(normalizeText(registeredCity))) {
        details.push(`住所内市区町村一致:${registeredCity}`);
      }
    }
  }

  if (details.length === 0) {
    return { match: false, detail: "住所・市区町村・最寄駅のいずれも不一致" };
  }
  return { match: true, detail: [...new Set(details)].join(" / ") };
}

function detectProvisionalMismatches(
  shop: ShopCandidateResult,
  googleAddress: string,
  googleName = "",
): string[] {
  const notes: string[] = [];
  const googlePref = extractPrefecture(googleAddress);
  const registeredPref = shop.prefecture?.trim() || extractPrefecture(shop.address);
  if (registeredPref && googlePref && registeredPref !== googlePref) {
    notes.push(
      `都道府県不一致: 登録=${registeredPref} / Google=${googlePref}`,
    );
  }

  const googleCity = extractCity(googleAddress);
  const registeredCity =
    shop.city?.trim() ||
    extractCity(shop.address) ||
    shop.area?.trim() ||
    null;

  if (registeredCity && googleCity) {
    const a = normalizeText(registeredCity);
    const b = normalizeText(googleCity);
    const related = a.includes(b) || b.includes(a) || a.slice(0, 2) === b.slice(0, 2);
    if (a && b && a !== b && !related) {
      if (!normalizeText(`${googleAddress}${googleName}`).includes(a)) {
        notes.push(
          `地域のずれ疑い: 登録=${registeredCity} / Google=${googleCity}`,
        );
      }
    }
  }

  const station = shop.station?.trim() || shop.stationLabel?.trim();
  if (station) {
    const stationKey = normalizeText(stripStationSuffix(station));
    const haystack = normalizeText(`${googleAddress}${googleName}`);
    if (stationKey && !haystack.includes(stationKey)) {
      notes.push(`最寄駅「${station}」がGoogle住所・店名に含まれない`);
    }
  }

  if (!shop.address?.trim()) {
    notes.push("登録住所が空（仮情報のためGoogle住所との突合が限定的）");
  }

  return notes;
}

function scoreConfidence(input: {
  nameLevel: CandidateEvaluation["nameMatchLevel"];
  prefectureMatch: boolean;
  locationMatch: boolean;
  isChain: boolean;
  competingSameName: boolean;
  candidateCount: number;
}): { confidence: Confidence; autoLinkable: boolean; notes: string[] } {
  const notes: string[] = [];
  const nameOk = input.nameLevel === "exact" || input.nameLevel === "same";

  if (input.isChain) notes.push("チェーン店のため手動確認");
  if (input.competingSameName) notes.push("同名の別候補あり");
  if (input.candidateCount > 1) notes.push(`候補が${input.candidateCount}件`);
  if (!input.prefectureMatch) notes.push("都道府県不一致");
  if (!input.locationMatch) notes.push("住所/市区町村/最寄駅不一致");
  if (!nameOk) notes.push("店名一致が弱い");

  const autoLinkable =
    nameOk &&
    input.prefectureMatch &&
    input.locationMatch &&
    !input.isChain &&
    !input.competingSameName &&
    input.candidateCount === 1;

  if (autoLinkable) {
    return { confidence: "高", autoLinkable: true, notes: ["自動紐付け条件を満たす"] };
  }

  if (nameOk && input.prefectureMatch && input.locationMatch && !input.competingSameName) {
    return {
      confidence: input.isChain || input.candidateCount > 1 ? "中" : "高",
      autoLinkable: false,
      notes,
    };
  }

  if (nameOk && input.prefectureMatch) {
    return { confidence: "中", autoLinkable: false, notes };
  }

  return { confidence: "低", autoLinkable: false, notes };
}

function escapeCsv(value: string | number | boolean | null | undefined): string {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}

function main(): void {
  const argv = process.argv.slice(2);
  const inputPath = resolve(
    process.cwd(),
    parseArgValue(argv, "--in") ?? "tmp/google-place-candidates.json",
  );
  const outPrefix = resolve(
    process.cwd(),
    parseArgValue(argv, "--out-prefix") ?? "tmp/google-place-candidates-report",
  );

  const shops = JSON.parse(readFileSync(inputPath, "utf-8")) as ShopCandidateResult[];
  const evaluations: CandidateEvaluation[] = [];
  const summaries: ShopSummary[] = [];

  for (const shop of shops) {
    const competingNormalized = new Map<string, number>();
    for (const candidate of shop.candidates) {
      const key = normalizeName(candidate.displayName);
      competingNormalized.set(key, (competingNormalized.get(key) ?? 0) + 1);
    }

    const shopEvals: CandidateEvaluation[] = [];

    for (const candidate of shop.candidates) {
      const name = classifyNameMatch(shop.shopName, candidate.displayName);
      const prefecture =
        shop.prefecture?.trim() || extractPrefecture(shop.searchQuery);
      const prefectureMatch = prefecture
        ? candidate.formattedAddress.includes(prefecture)
        : false;
      const location = evaluateLocationMatch(
        shop,
        candidate.formattedAddress,
        candidate.displayName,
      );
      const isChain = isChainShop(shop.shopName, candidate.displayName);
      const competingSameName =
        (competingNormalized.get(normalizeName(candidate.displayName)) ?? 0) > 1 ||
        shop.candidates.filter((other) => {
          const otherName = classifyNameMatch(shop.shopName, other.displayName);
          return (
            other.placeId !== candidate.placeId &&
            (otherName.level === "exact" || otherName.level === "same") &&
            (!prefecture || other.formattedAddress.includes(prefecture))
          );
        }).length > 0;

      const scored = scoreConfidence({
        nameLevel: name.level,
        prefectureMatch,
        locationMatch: location.match,
        isChain,
        competingSameName,
        candidateCount: shop.candidates.length,
      });

      const provisionalMismatchNotes = detectProvisionalMismatches(
        shop,
        candidate.formattedAddress,
        candidate.displayName,
      );

      shopEvals.push({
        shopId: shop.shopId,
        shopName: shop.shopName,
        prefecture: shop.prefecture,
        registeredAddress: buildRegisteredAddress(shop),
        nearestStation: buildNearestStation(shop),
        googleName: candidate.displayName,
        googleAddress: candidate.formattedAddress,
        placeId: candidate.placeId,
        nameMatch: name.match,
        nameMatchLevel: name.level,
        prefectureMatch,
        locationMatch: location.match,
        locationMatchDetail: location.detail,
        websiteUri: candidate.websiteUri ?? null,
        confidence: scored.confidence,
        isRecommended: false,
        autoLinkable: scored.autoLinkable,
        notes: scored.notes,
        provisionalMismatchNotes,
      });
    }

    // Pick recommended: prefer autoLinkable, else highest confidence with name+pref+location
    const websiteBonus = (row: CandidateEvaluation): number => {
      const ref = shop.referenceUrl?.trim();
      const web = row.websiteUri?.trim();
      if (!ref || !web) return 0;
      try {
        const refHost = new URL(ref).hostname.replace(/^www\./, "");
        const webHost = new URL(web).hostname.replace(/^www\./, "");
        if (refHost && webHost && (refHost === webHost || ref.includes(webHost) || web.includes(refHost))) {
          return 20;
        }
      } catch {
        if (ref.includes(web) || web.includes(ref)) return 20;
      }
      return 0;
    };

    const rank = (row: CandidateEvaluation): number => {
      let score = 0;
      if (row.autoLinkable) score += 100;
      if (row.confidence === "高") score += 30;
      if (row.confidence === "中") score += 15;
      if (row.nameMatch) score += 10;
      if (row.nameMatchLevel === "exact") score += 5;
      if (row.nameMatchLevel === "same") score += 4;
      if (row.nameMatchLevel === "partial") score += 2;
      if (row.prefectureMatch) score += 8;
      if (row.locationMatch) score += 8;
      score += websiteBonus(row);
      return score;
    };

    shopEvals.sort((a, b) => rank(b) - rank(a));
    if (shopEvals[0]) {
      shopEvals[0].isRecommended = true;
    }

    evaluations.push(...shopEvals);

    if (shop.error) {
      summaries.push({
        shopId: shop.shopId,
        shopName: shop.shopName,
        recommendedPlaceId: null,
        autoLinkable: false,
        confidence: null,
        reason: `APIエラー: ${shop.error}`,
        provisionalMismatches: ["登録住所が空（仮情報のためGoogle住所との突合不可）"].filter(
          () => !shop.address?.trim(),
        ),
        candidateCount: 0,
      });
      continue;
    }

    if (shopEvals.length === 0) {
      summaries.push({
        shopId: shop.shopId,
        shopName: shop.shopName,
        recommendedPlaceId: null,
        autoLinkable: false,
        confidence: null,
        reason: "候補なし",
        provisionalMismatches: !shop.address?.trim()
          ? ["登録住所が空（仮情報のためGoogle住所との突合不可）"]
          : [],
        candidateCount: 0,
      });
      continue;
    }

    const recommended = shopEvals[0];
    summaries.push({
      shopId: shop.shopId,
      shopName: shop.shopName,
      recommendedPlaceId: recommended.placeId,
      autoLinkable: recommended.autoLinkable,
      confidence: recommended.confidence,
      reason: recommended.notes.join(" / "),
      provisionalMismatches: recommended.provisionalMismatchNotes,
      candidateCount: shop.candidates.length,
    });
  }

  const autoLink = summaries.filter((row) => row.autoLinkable);
  const manual = summaries.filter(
    (row) => !row.autoLinkable && row.candidateCount > 0,
  );
  const none = summaries.filter((row) => row.candidateCount === 0);

  const csvHeaders = [
    "shop_id",
    "shop_name",
    "prefecture",
    "registered_address",
    "nearest_station",
    "google_name",
    "google_address",
    "place_id",
    "name_match",
    "name_match_level",
    "prefecture_match",
    "location_match",
    "location_match_detail",
    "website_uri",
    "confidence",
    "recommended",
    "auto_linkable",
    "notes",
    "provisional_mismatch_notes",
  ] as const;

  const csv = [
    csvHeaders.join(","),
    ...evaluations.map((row) =>
      [
        row.shopId,
        row.shopName,
        row.prefecture,
        row.registeredAddress,
        row.nearestStation,
        row.googleName,
        row.googleAddress,
        row.placeId,
        row.nameMatch,
        row.nameMatchLevel,
        row.prefectureMatch,
        row.locationMatch,
        row.locationMatchDetail,
        row.websiteUri,
        row.confidence,
        row.isRecommended,
        row.autoLinkable,
        row.notes.join(" | "),
        row.provisionalMismatchNotes.join(" | "),
      ]
        .map(escapeCsv)
        .join(","),
    ),
  ].join("\n");

  const highForSql = autoLink.filter((row) => row.confidence === "高" && row.recommendedPlaceId);

  const values = highForSql
    .map((row) => {
      return `  (${row.shopId}, '${escapeSqlString(row.shopName)}', '${escapeSqlString(row.recommendedPlaceId!)}')`;
    })
    .join(",\n");

  const sql = `-- Dry-run approval SQL for CrowdWorks shops (google_place_id only)
-- Generated by places-candidates-report.ts
-- DO NOT RUN until you review tmp report outputs.
-- Updates ONLY shops.google_place_id / shops.updated_at for listed ids.
-- Does NOT change reviews, photos, tags, slug, area_slug, status, address fields.

BEGIN;

CREATE TEMP TABLE tmp_cw_place_updates (
  shop_id integer PRIMARY KEY NOT NULL,
  shop_name text NOT NULL,
  google_place_id text NOT NULL UNIQUE
) ON COMMIT PRESERVE ROWS;

${
  highForSql.length === 0
    ? "-- No auto-linkable high-confidence shops in this dry-run.\n-- INSERT INTO tmp_cw_place_updates ...\n"
    : `INSERT INTO tmp_cw_place_updates (shop_id, shop_name, google_place_id)
VALUES
${values};
`
}

DO $$
DECLARE
  v_count integer;
BEGIN
  SELECT COUNT(*) INTO v_count FROM tmp_cw_place_updates;
  IF v_count <> ${highForSql.length} THEN
    RAISE EXCEPTION 'unexpected row count %, expected ${highForSql.length}', v_count;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM tmp_cw_place_updates u
    JOIN public.shops s ON s.id = u.shop_id
    WHERE s.name <> u.shop_name
  ) THEN
    RAISE EXCEPTION 'shop name mismatch against current shops.name';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM tmp_cw_place_updates u
    JOIN public.shops s ON s.id = u.shop_id
    WHERE s.google_place_id IS NOT NULL AND TRIM(s.google_place_id) <> ''
  ) THEN
    RAISE EXCEPTION 'target shop already has google_place_id';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM tmp_cw_place_updates u
    JOIN public.shops s
      ON s.google_place_id = u.google_place_id
    WHERE s.id <> u.shop_id
  ) THEN
    RAISE EXCEPTION 'google_place_id already used by another shop';
  END IF;
END $$;

UPDATE public.shops s
SET
  google_place_id = u.google_place_id,
  updated_at = now()
FROM tmp_cw_place_updates u
WHERE s.id = u.shop_id
  AND s.name = u.shop_name
  AND (s.google_place_id IS NULL OR TRIM(s.google_place_id) = '');

-- Verify
SELECT s.id, s.name, s.google_place_id, s.status, s.slug, s.area_slug
FROM public.shops s
JOIN tmp_cw_place_updates u ON u.shop_id = s.id
ORDER BY s.id;

-- COMMIT;
-- ROLLBACK;
`;

  const report = {
    generatedAt: new Date().toISOString(),
    inputPath,
    shopCount: shops.length,
    autoLinkable: autoLink,
    needsManualReview: manual,
    noCandidates: none,
    summaries,
    evaluations,
  };

  mkdirSync(resolve(process.cwd(), "tmp"), { recursive: true });
  writeFileSync(`${outPrefix}.json`, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
  writeFileSync(`${outPrefix}.csv`, `\uFEFF${csv}\n`, "utf-8");
  writeFileSync(`${outPrefix}-high-confidence-update.sql`, sql, "utf-8");

  console.log(`入力: ${inputPath}`);
  console.log(`JSON: ${outPrefix}.json`);
  console.log(`CSV: ${outPrefix}.csv`);
  console.log(`SQL(未実行): ${outPrefix}-high-confidence-update.sql`);
  console.log(`自動紐付け可能: ${autoLink.length}件`);
  console.log(`手動確認: ${manual.length}件`);
  console.log(`候補なし: ${none.length}件`);
  console.log("DBは更新していません。");
}

main();
