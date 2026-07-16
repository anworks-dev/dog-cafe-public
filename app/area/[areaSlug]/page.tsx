import { notFound } from "next/navigation";

/**
 * Legacy /area/[areaSlug] URLs are 301-redirected in middleware.
 * This page remains so the route exists; unmatched slugs 404 if middleware cannot resolve.
 */
export default function LegacyAreaPage() {
  notFound();
}
