import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const OUTPUT_PATH = resolve(process.cwd(), "tmp/google-place-candidates.json");
const REQUEST_DELAY_MS = 300;

type ShopRow = {
  id: number;
  name: string;
  prefecture: string | null;
  station: string | null;
  station_label: string | null;
  area: string | null;
  google_place_id: string | null;
};

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

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
};

function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), ".env.local");
  let content: string;
  try {
    content = readFileSync(envPath, "utf-8");
  } catch {
    throw new Error(".env.local が見つかりません。");
  }

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function readEnv(key: string): string {
  return process.env[key]?.trim().replace(/^['"]|['"]$/g, "") ?? "";
}

function parseLimit(argv: string[]): number | null {
  for (const arg of argv) {
    if (arg.startsWith("--limit=")) {
      const value = Number(arg.slice("--limit=".length));
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error("--limit には正の整数を指定してください。");
      }
      return value;
    }
  }
  return null;
}

function buildSearchQuery(shop: ShopRow): string {
  const parts = [
    shop.name?.trim(),
    shop.prefecture?.trim(),
    shop.station_label?.trim() || shop.station?.trim() || shop.area?.trim(),
  ].filter((part): part is string => Boolean(part));

  return parts.join(" ");
}

function normalizePlaceId(id: string): string {
  return id.startsWith("places/") ? id.slice("places/".length) : id;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => {
    setTimeout(resolveSleep, ms);
  });
}

async function searchPlaceCandidates(
  apiKey: string,
  searchQuery: string,
): Promise<{ candidates: PlaceCandidate[]; error: string | null }> {
  const response = await fetch(PLACES_SEARCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress",
    },
    body: JSON.stringify({
      textQuery: searchQuery,
      languageCode: "ja",
      regionCode: "JP",
      pageSize: 3,
    }),
  });

  const data = (await response.json()) as {
    places?: GooglePlace[];
    error?: { message?: string; status?: string };
  };

  if (!response.ok) {
    const message =
      data.error?.message ??
      `Google Places API error (status ${response.status})`;
    return { candidates: [], error: message };
  }

  const candidates = (data.places ?? [])
    .slice(0, 3)
    .map((place) => ({
      placeId: normalizePlaceId(place.id ?? ""),
      displayName: place.displayName?.text ?? "",
      formattedAddress: place.formattedAddress ?? "",
    }))
    .filter((place) => place.placeId);

  return { candidates, error: null };
}

async function main(): Promise<void> {
  loadEnvLocal();

  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const apiKey = readEnv("GOOGLE_PLACES_API_KEY");
  const limit = parseLimit(process.argv.slice(2));

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に設定してください。",
    );
  }
  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY を .env.local に設定してください。");
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("shops")
    .select("id, name, prefecture, station, station_label, area, google_place_id")
    .or("google_place_id.is.null,google_place_id.eq.")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Supabase read failed: ${error.message}`);
  }

  const shops = (data ?? []) as ShopRow[];
  const targetShops = limit ? shops.slice(0, limit) : shops;

  console.log(
    `対象店舗: ${targetShops.length}件${limit ? ` (--limit=${limit})` : ""} / 未連携 ${shops.length}件`,
  );

  const results: ShopCandidateResult[] = [];

  for (const [index, shop] of targetShops.entries()) {
    const searchQuery = buildSearchQuery(shop);
    const baseResult: ShopCandidateResult = {
      shopId: shop.id,
      shopName: shop.name,
      searchQuery,
      candidates: [],
      error: null,
    };

    if (!searchQuery) {
      results.push({
        ...baseResult,
        error: "検索文を作成できる項目がありません。",
      });
      continue;
    }

    try {
      const { candidates, error: searchError } = await searchPlaceCandidates(
        apiKey,
        searchQuery,
      );
      results.push({
        ...baseResult,
        candidates,
        error: searchError,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      results.push({
        ...baseResult,
        error: message,
      });
    }

    if (index < targetShops.length - 1) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  mkdirSync(resolve(process.cwd(), "tmp"), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(results, null, 2)}\n`, "utf-8");

  const withCandidates = results.filter((item) => item.candidates.length > 0).length;
  const withErrors = results.filter((item) => item.error).length;

  console.log(`出力: ${OUTPUT_PATH}`);
  console.log(`結果件数: ${results.length}`);
  console.log(`候補あり: ${withCandidates}件 / エラー: ${withErrors}件`);
  console.log("Supabaseは更新していません（読み取りのみ）。");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exit(1);
});
