import { Suspense } from "react";
import ShopExplorer from "@/components/ShopExplorer";
import {
  attachShopCardImages,
  getApprovedReviewCounts,
  getPrefectures,
  getPublishedShops,
} from "@/lib/queries";

export const revalidate = 300;

export default async function HomePage() {
  const [shopsRaw, prefectures, reviewCounts] = await Promise.all([
    getPublishedShops(),
    getPrefectures(),
    getApprovedReviewCounts(),
  ]);
  const shops = await attachShopCardImages(shopsRaw);

  return (
    <Suspense fallback={null}>
      <ShopExplorer
        shops={shops}
        prefectures={prefectures}
        reviewCounts={reviewCounts}
      />
    </Suspense>
  );
}
