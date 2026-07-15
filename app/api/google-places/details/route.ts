import { NextRequest, NextResponse } from "next/server";
import { fetchGooglePlaceDetails } from "@/lib/google-places";

const NO_STORE_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
};

export async function GET(request: NextRequest) {
  const placeId = request.nextUrl.searchParams.get("placeId");

  if (!placeId?.trim()) {
    return NextResponse.json(
      { error: "placeId parameter is required" },
      { status: 400, headers: NO_STORE_HEADERS },
    );
  }

  if (!process.env.GOOGLE_PLACES_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY is not configured" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  const data = await fetchGooglePlaceDetails(placeId.trim());
  if (!data) {
    return NextResponse.json(
      { error: "Google Places API error" },
      { status: 502, headers: NO_STORE_HEADERS },
    );
  }

  return NextResponse.json(data, { headers: NO_STORE_HEADERS });
}
