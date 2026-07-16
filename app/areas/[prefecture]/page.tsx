import { permanentRedirect } from "next/navigation";

/** next.config also redirects; this page is a fallback for /areas/:prefecture. */
export default async function PrefectureAreaPage({
  params,
}: {
  params: Promise<{ prefecture: string }>;
}) {
  const { prefecture } = await params;
  permanentRedirect(`/${prefecture}`);
}
