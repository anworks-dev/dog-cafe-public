export type GooglePlaceDetails = {
  id: string;
  displayName?: { text: string; languageCode?: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  regularOpeningHours?: {
    openNow?: boolean;
    weekdayDescriptions?: string[];
  };
  currentOpeningHours?: {
    openNow?: boolean;
  };
  rating?: number;
  userRatingCount?: number;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
};

/** Google住所の行政区重複（例: 麻生区麻生区）を表示用に整える */
export function normalizeGoogleAddress(address: string): string {
  return address.replace(/([\u4e00-\u9faf]+?[市区町村])(\1)+/g, "$1");
}
