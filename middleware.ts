import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  areaPath,
  isReservedPathSegment,
  prefecturePath,
  resolveLegacyAreaParamToSlug,
} from "@/lib/location-paths";
import type { Shop } from "@/lib/types";

type ShopLocationRow = Pick<
  Shop,
  "prefecture_slug" | "area_slug" | "area" | "station" | "station_label" | "prefecture"
>;

async function fetchPublishedShopLocations(): Promise<ShopLocationRow[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !key) return [];

  const endpoint =
    `${url}/rest/v1/shops` +
    `?select=prefecture_slug,area_slug,area,station,station_label,prefecture` +
    `&status=eq.published`;

  const res = await fetch(endpoint, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) return [];
  return (await res.json()) as ShopLocationRow[];
}

function stripLocationParams(searchParams: URLSearchParams): string {
  const kept = new URLSearchParams(searchParams);
  kept.delete("prefecture");
  kept.delete("pref");
  kept.delete("area");
  const qs = kept.toString();
  return qs ? `?${qs}` : "";
}

/**
 * Legacy location URL redirects (301):
 * - /list?prefecture=aichi → /aichi
 * - /?pref=aichi → /aichi
 * - /?pref=aichi&area=岡崎 → /aichi/okazaki (unique)
 * - /?pref=kanagawa&area=馬車道 → /kanagawa (ambiguous)
 * - /area/okazaki → /aichi/okazaki
 */
export async function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === "/list" && searchParams.has("prefecture")) {
    const pref = (searchParams.get("prefecture") ?? "").trim();
    const suffix = stripLocationParams(searchParams);
    if (pref && !isReservedPathSegment(pref)) {
      return NextResponse.redirect(new URL(`${prefecturePath(pref)}${suffix}`, request.url), 301);
    }
    const url = request.nextUrl.clone();
    url.searchParams.delete("prefecture");
    return NextResponse.redirect(url, 301);
  }

  if (pathname === "/" && searchParams.has("pref")) {
    const pref = (searchParams.get("pref") ?? "").trim();
    if (!pref || isReservedPathSegment(pref)) {
      const url = request.nextUrl.clone();
      url.searchParams.delete("pref");
      url.searchParams.delete("area");
      return NextResponse.redirect(url, 301);
    }

    const areaRaw = (searchParams.get("area") ?? "").trim();
    let destPath = prefecturePath(pref);

    if (areaRaw) {
      const shops = await fetchPublishedShopLocations();
      const areaSlug = resolveLegacyAreaParamToSlug(shops, pref, areaRaw);
      if (areaSlug) destPath = areaPath(pref, areaSlug);
    }

    const suffix = stripLocationParams(searchParams);
    return NextResponse.redirect(new URL(`${destPath}${suffix}`, request.url), 301);
  }

  const areaMatch = /^\/area\/([^/]+)\/?$/.exec(pathname);
  if (areaMatch) {
    const areaSlug = decodeURIComponent(areaMatch[1]);
    const shops = await fetchPublishedShopLocations();
    const hit = shops.find((s) => s.area_slug === areaSlug);
    if (!hit?.prefecture_slug) {
      return NextResponse.next();
    }
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return NextResponse.redirect(
      new URL(`${areaPath(hit.prefecture_slug, areaSlug)}${suffix}`, request.url),
      301,
    );
  }

  if (pathname === "/areas" || pathname === "/areas/") {
    return NextResponse.redirect(new URL("/", request.url), 301);
  }

  const areasMatch = /^\/areas\/([^/]+)\/?$/.exec(pathname);
  if (areasMatch) {
    const pref = decodeURIComponent(areasMatch[1]).trim();
    if (!pref || isReservedPathSegment(pref)) {
      return NextResponse.redirect(new URL("/", request.url), 301);
    }
    const suffix = searchParams.toString() ? `?${searchParams.toString()}` : "";
    return NextResponse.redirect(new URL(`${prefecturePath(pref)}${suffix}`, request.url), 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/list", "/area/:areaSlug*", "/areas", "/areas/:prefecture*"],
};
