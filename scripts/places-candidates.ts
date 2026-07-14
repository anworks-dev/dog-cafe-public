import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const PLACES_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const DEFAULT_OUTPUT_PATH = resolve(process.cwd(), "tmp/google-place-candidates.json");
const REQUEST_DELAY_MS = 300;

type ShopRow = {
  id: number;
  name: string;
  prefecture: string | null;
  city: string | null;
  address: string | null;
  station: string | null;
  station_label: string | null;
  area: string | null;
  reference_url: string | null;
  google_place_id: string | null;
  status?: string | null;
};

type PlaceCandidate = {
  placeId: string;
  displayName: string;
  formattedAddress: string;
  websiteUri: string | null;
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

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  websiteUri?: string;
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

function parseIds(argv: string[]): number[] | null {
  for (const arg of argv) {
    if (!arg.startsWith("--ids=")) continue;
    const raw = arg.slice("--ids=".length).trim();
    if (!raw) throw new Error("--ids が空です。例: --ids=96-104 または --ids=96,97,98");

    const ids = new Set<number>();
    for (const part of raw.split(",")) {
      const token = part.trim();
      if (!token) continue;
      const range = token.match(/^(\d+)\s*-\s*(\d+)$/);
      if (range) {
        const start = Number(range[1]);
        const end = Number(range[2]);
        if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) {
          throw new Error(`不正なID範囲: ${token}`);
        }
        for (let id = start; id <= end; id += 1) ids.add(id);
        continue;
      }
      const id = Number(token);
      if (!Number.isInteger(id) || id <= 0) {
        throw new Error(`不正なshop id: ${token}`);
      }
      ids.add(id);
    }
    return [...ids].sort((a, b) => a - b);
  }
  return null;
}

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

function normalizeShopRow(raw: Record<string, unknown>): ShopRow {
  return {
    id: Number(raw.id),
    name: String(raw.name ?? ""),
    prefecture: (raw.prefecture as string | null) ?? null,
    city: (raw.city as string | null) ?? null,
    address: (raw.address as string | null) ?? null,
    station: (raw.station as string | null) ?? null,
    station_label: (raw.station_label as string | null) ?? null,
    area: (raw.area as string | null) ?? null,
    reference_url: (raw.reference_url as string | null) ?? null,
    google_place_id: (raw.google_place_id as string | null) ?? null,
    status: (raw.status as string | null) ?? null,
  };
}

function loadShopsFromJson(path: string): ShopRow[] {
  const raw = JSON.parse(readFileSync(path, "utf-8")) as unknown;
  const rows = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as { rows?: unknown }).rows)
      ? ((raw as { rows: unknown[] }).rows)
      : null;
  if (!rows) {
    throw new Error(`shops JSONの形式が不正です: ${path}`);
  }
  return rows.map((row) => normalizeShopRow(row as Record<string, unknown>));
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
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.websiteUri",
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
      websiteUri: place.websiteUri?.trim() || null,
    }))
    .filter((place) => place.placeId);

  return { candidates, error: null };
}

async function main(): Promise<void> {
  loadEnvLocal();

  const argv = process.argv.slice(2);
  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const apiKey = readEnv("GOOGLE_PLACES_API_KEY");
  const limit = parseLimit(argv);
  const ids = parseIds(argv);
  const shopsJsonPath = parseArgValue(argv, "--shops-json");
  const outputPath = resolve(
    process.cwd(),
    parseArgValue(argv, "--out") ?? DEFAULT_OUTPUT_PATH,
  );

  if (!apiKey) {
    throw new Error("GOOGLE_PLACES_API_KEY を .env.local に設定してください。");
  }

  let shops: ShopRow[] = [];

  if (shopsJsonPath) {
    shops = loadShopsFromJson(resolve(process.cwd(), shopsJsonPath));
  } else {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に設定してください。",
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    let query = supabase
      .from("shops")
      .select(
        "id, name, prefecture, city, address, station, station_label, area, reference_url, google_place_id, status",
      )
      .order("id", { ascending: true });

    if (ids) {
      query = query.in("id", ids);
    } else {
      // Default: only shops not yet linked
      query = query.or("google_place_id.is.null,google_place_id.eq.");
    }

    const { data, error } = await query;
    if (error) {
      throw new Error(`Supabase read failed: ${error.message}`);
    }
    shops = ((data ?? []) as Record<string, unknown>[]).map(normalizeShopRow);
  }

  if (ids) {
    const byId = new Map(shops.map((shop) => [shop.id, shop]));
    const missing = ids.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      throw new Error(
        `指定IDのうち取得できない店舗があります: ${missing.join(", ")}（hidden等は --shops-json を利用）`,
      );
    }
    shops = ids.map((id) => byId.get(id)!);
  }

  const targetShops = limit ? shops.slice(0, limit) : shops;

  console.log(
    `対象店舗: ${targetShops.length}件` +
      `${ids ? ` (--ids=${ids.join(",")})` : ""}` +
      `${limit ? ` (--limit=${limit})` : ""}` +
      `${shopsJsonPath ? ` (--shops-json)` : ""}`,
  );

  const results: ShopCandidateResult[] = [];

  for (const [index, shop] of targetShops.entries()) {
    const searchQuery = buildSearchQuery(shop);
    const baseResult: ShopCandidateResult = {
      shopId: shop.id,
      shopName: shop.name,
      prefecture: shop.prefecture,
      city: shop.city,
      address: shop.address,
      station: shop.station,
      stationLabel: shop.station_label,
      area: shop.area,
      referenceUrl: shop.reference_url,
      currentGooglePlaceId: shop.google_place_id,
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
  writeFileSync(outputPath, `${JSON.stringify(results, null, 2)}\n`, "utf-8");

  const withCandidates = results.filter((item) => item.candidates.length > 0).length;
  const withErrors = results.filter((item) => item.error).length;

  console.log(`出力: ${outputPath}`);
  console.log(`結果件数: ${results.length}`);
  console.log(`候補あり: ${withCandidates}件 / エラー: ${withErrors}件`);
  console.log("Supabaseは更新していません（読み取りのみ）。");
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exit(1);
});
