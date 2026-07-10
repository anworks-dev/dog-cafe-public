import type { Metadata } from "next";
import RequestForm from "@/components/RequestForm";
import { siteUrl } from "@/lib/format";

export const metadata: Metadata = {
  title: "掲載リクエスト",
  description:
    "掲載してほしい犬同伴可能なカフェの情報をお知らせください。運営が内容を確認のうえ、掲載を検討します。",
  alternates: { canonical: `${siteUrl()}/request` },
};

export default function RequestPage() {
  return <RequestForm />;
}
