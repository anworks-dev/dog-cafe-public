export type ApprovedCsvRow = {
  shopId: string;
  shopName: string;
  google_place_id: string;
  decision: string;
  note: string;
};

const EXPECTED_HEADER = [
  "shopId",
  "shopName",
  "google_place_id",
  "decision",
  "note",
] as const;

export function parseCsv(content: string): string[][] {
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

export function parseApprovedCsv(content: string): ApprovedCsvRow[] {
  const rows = parseCsv(content);
  if (rows.length === 0) {
    throw new Error("CSVが空です。");
  }

  const [header, ...dataRows] = rows;
  const headerValid =
    header.length === EXPECTED_HEADER.length &&
    EXPECTED_HEADER.every((name, index) => header[index] === name);

  if (!headerValid) {
    throw new Error("CSVヘッダーが想定と異なります。");
  }

  return dataRows.map((cells, index) => {
    if (cells.length < EXPECTED_HEADER.length) {
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

export function escapeSqlString(value: string): string {
  return value.replace(/'/g, "''");
}
