import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Strip legacy ?prefecture=* from /list (301).
 * Other query params (search, sort, pagination, etc.) are preserved.
 */
export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;
  if (pathname !== "/list" || !searchParams.has("prefecture")) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.searchParams.delete("prefecture");
  return NextResponse.redirect(url, 301);
}

export const config = {
  matcher: "/list",
};
