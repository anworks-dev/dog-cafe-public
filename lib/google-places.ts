export type GooglePlaceOpeningHours = {
  id: string;
  displayName?: { text: string; languageCode?: string };
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  currentOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  businessStatus?: string;
  googleMapsUri?: string;
};

/** Full details type used by legacy GooglePlaceInfoCard client fetch. */
export type GooglePlaceDetails = GooglePlaceOpeningHours & {
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
};

const OPENING_HOURS_FIELD_MASK =
  "id,displayName,regularOpeningHours,currentOpeningHours,businessStatus,googleMapsUri";

const FULL_DETAILS_FIELD_MASK =
  "id,displayName,formattedAddress,googleMapsUri,websiteUri,nationalPhoneNumber,businessStatus,regularOpeningHours,currentOpeningHours,rating,userRatingCount";

/** Google住所の行政区重複（例: 麻生区麻生区）を表示用に整える */
export function normalizeGoogleAddress(address: string): string {
  return address.replace(/([\u4e00-\u9faf]+?[市区町村])(\1)+/g, "$1");
}

async function fetchPlaceDetails(
  placeId: string,
  fieldMask: string,
  revalidateSeconds = 300,
): Promise<GooglePlaceDetails | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey || !placeId.trim()) return null;

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=ja&regionCode=JP`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": fieldMask,
      },
      next: { revalidate: revalidateSeconds },
    });

    const contentType = response.headers.get("content-type") ?? "";
    if (!response.ok) {
      if (!contentType.includes("application/json")) {
        console.error(
          `Google Places API error: HTTP ${response.status} (${contentType || "non-json"})`,
        );
      }
      return null;
    }

    if (!contentType.includes("application/json")) return null;
    return (await response.json()) as GooglePlaceDetails;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Google Places API request failed:", message);
    return null;
  }
}

/** Server-side fetch for shop detail opening hours (minimal field mask). */
export async function fetchGooglePlaceOpeningHours(
  placeId: string,
): Promise<GooglePlaceOpeningHours | null> {
  return fetchPlaceDetails(placeId, OPENING_HOURS_FIELD_MASK);
}

/** Server-side fetch for full place card (address, phone, rating, etc.). */
export async function fetchGooglePlaceDetails(
  placeId: string,
): Promise<GooglePlaceDetails | null> {
  return fetchPlaceDetails(placeId, FULL_DETAILS_FIELD_MASK);
}

const JST_WEEKDAYS = ["日曜日", "月曜日", "火曜日", "水曜日", "木曜日", "金曜日", "土曜日"] as const;

function todayWeekdayJa(): string {
  const day = new Date().toLocaleString("en-US", { timeZone: "Asia/Tokyo", weekday: "short" });
  const map: Record<string, string> = {
    Sun: "日曜日",
    Mon: "月曜日",
    Tue: "火曜日",
    Wed: "水曜日",
    Thu: "木曜日",
    Fri: "金曜日",
    Sat: "土曜日",
  };
  return map[day] ?? JST_WEEKDAYS[new Date().getDay()];
}

function normalizeHoursLine(line: string): string {
  const colonIdx = line.indexOf(":");
  const fullWidthColon = line.indexOf("：");
  const splitAt = colonIdx >= 0 ? colonIdx : fullWidthColon;
  if (splitAt < 0) return line.replace(/~/g, "〜");
  const day = line.slice(0, splitAt).trim();
  const hours = line.slice(splitAt + 1).trim().replace(/~/g, "〜");
  return `${day}　${hours}`;
}

function closingTimeFromTodayLine(line: string): string | null {
  const hoursPart = line.includes("：")
    ? line.split("：").slice(1).join("：")
    : line.includes(":")
      ? line.split(":").slice(1).join(":")
      : line;
  const closed = /定休|休業|closed/i.test(hoursPart);
  if (closed) return null;
  // Support both "11:00～18:00" and "8時30分～18時00分"
  const colonRange = hoursPart.match(/(\d{1,2}:\d{2})\s*[〜～\-－]\s*(\d{1,2}:\d{2})/);
  if (colonRange) return colonRange[2];
  const jaRange = hoursPart.match(/(\d{1,2})時(?:(\d{1,2})分)?\s*[〜～\-－]\s*(\d{1,2})時(?:(\d{1,2})分)?/);
  if (jaRange) {
    const h = jaRange[3];
    const m = jaRange[4] ?? "00";
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
  }
  return null;
}

export function formatOpeningStatus(details: GooglePlaceOpeningHours): string | null {
  if (details.businessStatus === "CLOSED_PERMANENTLY") {
    return "閉業";
  }
  if (details.businessStatus === "CLOSED_TEMPORARILY") {
    return "一時休業";
  }

  const hours = details.currentOpeningHours ?? details.regularOpeningHours;
  if (!hours || hours.openNow == null) return null;

  if (!hours.openNow) return "営業時間外";

  const todayName = todayWeekdayJa();
  const lines = hours.weekdayDescriptions ?? [];
  const todayLine = lines.find((line) => line.startsWith(todayName));
  const closing = todayLine ? closingTimeFromTodayLine(todayLine) : null;
  return closing ? `営業中・${closing}まで` : "営業中";
}

export function openingHoursLines(details: GooglePlaceOpeningHours): string[] {
  const preferCurrent = (details.currentOpeningHours?.weekdayDescriptions?.length ?? 0) > 0;
  const source = preferCurrent
    ? details.currentOpeningHours
    : details.regularOpeningHours;
  const raw = source?.weekdayDescriptions ?? details.regularOpeningHours?.weekdayDescriptions ?? [];
  return raw.map(normalizeHoursLine);
}
