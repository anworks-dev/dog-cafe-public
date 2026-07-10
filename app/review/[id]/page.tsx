import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReviewForm from "@/components/ReviewForm";
import { getShopById } from "@/lib/queries";

export const metadata: Metadata = {
  title: "口コミを投稿する",
  robots: { index: false, follow: true },
};

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const shopId = Number(id);
  if (!Number.isFinite(shopId)) notFound();

  const shop = await getShopById(shopId);
  if (!shop) notFound();

  return <ReviewForm shop={shop} />;
}
