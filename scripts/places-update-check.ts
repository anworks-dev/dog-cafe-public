import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { createClient } from "@supabase/supabase-js";

const INPUT_PATH = resolve(process.cwd(), "tmp/google-place-approved-update.csv");
const OUTPUT_PATH = resolve(process.cwd(), "tmp/google-place-update-dry-run.json");
const EXPECTED_ROW_COUNT = 81;
const MIN_PLACE_ID_LENGTH = 10;
const PLACE_ID_PATTERN = /^[A-Za-z0-9_-]+$/;

type CsvRow = {
  shopId: string;
  shopName: string;
  google_place_id: string;
  decision: string;
  note: string;
};

type ShopRecord = {
  id: number;
  name: string;
  google_place_id: string | null;
};

type DryRunStatus =
  | "ready"
  | "error"
  | "already_linked"
  | "shop_not_found"
  | "name_mismatch"
  | "duplicate_place_id";

type DryRunResult = {
  shopId: number;
  shopName: string;
  googlePlaceId: string;
  currentGooglePlaceId: string | null;
  status: DryRunStatus;
  errors: string[];
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

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const text = content.replace(/^\uFEFF/, "");

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      field = "";
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  return rows;
}

function parseApprovedCsv(content: string): CsvRow[] {
  const rows = parseCsv(content);
  if (rows.length === 0) {
    throw new Error("CSVが空です。");
  }

  const [header, ...dataRows] = rows;
  const expectedHeader = [
    "shopId",
    "shopName",
    "google_place_id",
    "decision",
    "note",
  ];

  const headerValid =
    header.length === expectedHeader.length &&
    expectedHeader.every((name, index) => header[index] === name);

  if (!headerValid) {
    throw new Error("CSVヘッダーが想定と異なります。");
  }

  return dataRows.map((cells, index) => {
    if (cells.length < expectedHeader.length) {
      throw new Error(`CSV ${index + 2}行目の列数が不足しています。`);
    }

    return {
      shopId: cells[0] ?? "",
      shopName: cells[1] ?? "",
      google_place_id: cells[2] ?? "",
      decision: cells[3] ?? "",
      note: cells.slice(4).join(","),
    };
  });
}

function isBlank(value: string | null | undefined): boolean {
  return !value?.trim();
}

function isValidPlaceId(placeId: string): boolean {
  const trimmed = placeId.trim();
  if (!trimmed) return false;
  if (/\s/.test(trimmed)) return false;
  if (trimmed.length < MIN_PLACE_ID_LENGTH) return false;
  return PLACE_ID_PATTERN.test(trimmed);
}

function chooseStatus(errors: string[], statuses: DryRunStatus[]): DryRunStatus {
  const priority: DryRunStatus[] = [
    "shop_not_found",
    "name_mismatch",
    "already_linked",
    "duplicate_place_id",
    "error",
    "ready",
  ];

  for (const status of priority) {
    if (statuses.includes(status)) return status;
  }

  return errors.length > 0 ? "error" : "ready";
}

async function main(): Promise<void> {
  loadEnvLocal();

  const supabaseUrl = readEnv("NEXT_PUBLIC_SUPABASE_URL");
  const supabaseAnonKey = readEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY を .env.local に設定してください。",
    );
  }

  let csvContent: string;
  try {
    csvContent = readFileSync(INPUT_PATH, "utf-8");
  } catch {
    throw new Error(`CSVが見つかりません: ${INPUT_PATH}`);
  }

  const csvRows = parseApprovedCsv(csvContent);

  if (csvRows.length !== EXPECTED_ROW_COUNT) {
    throw new Error(
      `CSVのデータ行数が ${EXPECTED_ROW_COUNT} 件ではありません（実際: ${csvRows.length} 件）。`,
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase
    .from("shops")
    .select("id, name, google_place_id")
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Supabase read failed: ${error.message}`);
  }

  const shops = (data ?? []) as ShopRecord[];
  const shopById = new Map<number, ShopRecord>(
    shops.map((shop) => [shop.id, shop]),
  );
  const placeIdOwners = new Map<string, number>();

  for (const shop of shops) {
    const placeId = shop.google_place_id?.trim();
    if (!placeId) continue;
    placeIdOwners.set(placeId, shop.id);
  }

  const shopIdCounts = new Map<string, number>();
  const placeIdCounts = new Map<string, number>();

  for (const row of csvRows) {
    shopIdCounts.set(row.shopId, (shopIdCounts.get(row.shopId) ?? 0) + 1);
    placeIdCounts.set(
      row.google_place_id.trim(),
      (placeIdCounts.get(row.google_place_id.trim()) ?? 0) + 1,
    );
  }

  const results: DryRunResult[] = csvRows.map((row) => {
    const errors: string[] = [];
    const statuses: DryRunStatus[] = [];
    const shopId = Number(row.shopId);
    const googlePlaceId = row.google_place_id.trim();
    const shopName = row.shopName.trim();

    if (!row.shopId.trim() || !row.shopName.trim() || !row.google_place_id.trim()) {
      errors.push("必須項目が空です。");
      statuses.push("error");
    }

    if (!Number.isInteger(shopId) || shopId <= 0) {
      errors.push("shopIdが不正です。");
      statuses.push("error");
    }

    if ((shopIdCounts.get(row.shopId) ?? 0) > 1) {
      errors.push("shopIdがCSV内で重複しています。");
      statuses.push("error");
    }

    if ((placeIdCounts.get(googlePlaceId) ?? 0) > 1) {
      errors.push("google_place_idがCSV内で重複しています。");
      statuses.push("duplicate_place_id");
    }

    if (googlePlaceId && !isValidPlaceId(googlePlaceId)) {
      errors.push("google_place_idの形式が不正です。");
      statuses.push("error");
    }

    const shop = shopById.get(shopId);
    if (!shop) {
      errors.push("Supabaseに該当shopIdが存在しません。");
      statuses.push("shop_not_found");
    } else {
      if (shop.name.trim() !== shopName) {
        errors.push(
          `店舗名不一致（CSV: ${shopName} / Supabase: ${shop.name.trim()}）`,
        );
        statuses.push("name_mismatch");
      }

      const currentPlaceId = shop.google_place_id?.trim() || null;
      if (currentPlaceId) {
        errors.push(`すでにgoogle_place_idが登録済みです（${currentPlaceId}）。`);
        statuses.push("already_linked");
      }

      const ownerId = placeIdOwners.get(googlePlaceId);
      if (ownerId != null && ownerId !== shopId) {
        const owner = shopById.get(ownerId);
        errors.push(
          `google_place_idは別店舗に登録済みです（shopId: ${ownerId}${owner ? ` / ${owner.name.trim()}` : ""}）。`,
        );
        statuses.push("duplicate_place_id");
      }

      const status = chooseStatus(errors, statuses);
      return {
        shopId,
        shopName,
        googlePlaceId,
        currentGooglePlaceId: currentPlaceId,
        status,
        errors,
      };
    }

    const status = chooseStatus(errors, statuses);
    return {
      shopId,
      shopName,
      googlePlaceId,
      currentGooglePlaceId: null,
      status,
      errors,
    };
  });

  mkdirSync(resolve(process.cwd(), "tmp"), { recursive: true });
  writeFileSync(OUTPUT_PATH, `${JSON.stringify(results, null, 2)}\n`, "utf-8");

  const readyCount = results.filter((row) => row.status === "ready").length;
  const errorCount = results.filter((row) => row.status === "error").length;
  const alreadyLinkedCount = results.filter(
    (row) => row.status === "already_linked",
  ).length;
  const duplicatePlaceIdCount = results.filter(
    (row) => row.status === "duplicate_place_id",
  ).length;
  const nameMismatchCount = results.filter(
    (row) => row.status === "name_mismatch",
  ).length;
  const problemRows = results.filter((row) => row.status !== "ready");

  console.log(`CSV行数: ${csvRows.length}`);
  console.log(`登録可能 ready 件数: ${readyCount}`);
  console.log(`エラー件数: ${errorCount}`);
  console.log(`すでに連携済みの件数: ${alreadyLinkedCount}`);
  console.log(`重複Place ID件数: ${duplicatePlaceIdCount}`);
  console.log(`店舗名不一致件数: ${nameMismatchCount}`);

  if (problemRows.length > 0) {
    console.log("問題がある店舗:");
    for (const row of problemRows) {
      console.log(`- ${row.shopName} (shopId: ${row.shopId}): ${row.errors.join(" / ")}`);
    }
  }

  console.log("Supabaseは更新していません。");

  if (readyCount === EXPECTED_ROW_COUNT && problemRows.length === 0) {
    console.log("81件すべて更新準備OK。Supabaseはまだ更新していません。");
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(message);
  process.exit(1);
});
