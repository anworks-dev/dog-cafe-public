import ShopExplorer from "@/components/ShopExplorer";
import {
  getApprovedReviewCounts,
  getPrefectures,
  getPublishedShops,
} from "@/lib/queries";

export const revalidate = 300;

export default async function HomePage() {
  const [shops, prefectures, reviewCounts] = await Promise.all([
    getPublishedShops(),
    getPrefectures(),
    getApprovedReviewCounts(),
  ]);

  return (
    <ShopExplorer
      shops={shops}
      prefectures={prefectures}
      reviewCounts={reviewCounts}
    />
  );
}
