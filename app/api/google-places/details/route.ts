import { NextRequest, NextResponse } from "next/server";

const PLACES_DETAILS_BASE_URL = "https://places.googleapis.com/v1/places";
const FIELD_MASK =
  "id,displayName,formattedAddress,googleMapsUri,websiteUri,nationalPhoneNumber,businessStatus,regularOpeningHours,currentOpeningHours,rating,userRatingCount";

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

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GOOGLE_PLACES_API_KEY is not configured" },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }

  const url = `${PLACES_DETAILS_BASE_URL}/${encodeURIComponent(placeId)}?languageCode=ja&regionCode=JP`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": FIELD_MASK,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Google Places API error",
          status: response.status,
          details: data,
        },
        { status: response.status, headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(data, { headers: NO_STORE_HEADERS });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    console.error("Google Places API request failed:", message);

    return NextResponse.json(
      { error: "Failed to connect to Google Places API", message },
      { status: 500, headers: NO_STORE_HEADERS },
    );
  }
}
