import Link from "next/link";
import { MapPin } from "lucide-react";
import type { ShopWithCardImage } from "@/lib/types";
import { selectTagsForCafeCard } from "@/lib/dog-conditions";
import { shopDetailPath, shopLocationLabel } from "@/lib/format";
import { TAG_CLS } from "@/lib/shop-tags";
import { ConditionBadge, ConditionBadgeRow } from "./ConditionBadge";
import CafeCardImage from "./CafeCardImage";

export { TAG_CLS };

export default function CafeCard({ shop }: { shop: ShopWithCardImage }) {
  const href = shopDetailPath(shop);
  const location = shopLocationLabel(shop);
  const cardText = shop.description?.trim() || shop.card_excerpt?.trim() || "";
  const tags = Array.isArray(shop.tags) ? shop.tags : [];
  /** SP: max 2, but always keep a rule badge when present. PC: all tags. */
  const spTags = selectTagsForCafeCard(tags, 2);
  const pcTags = selectTagsForCafeCard(tags);

  return (
    <>
      {/* SP card (80px thumb, horizontal) */}
      <Link
        href={href}
        className="md:hidden bg-white rounded-xl shadow-[0_1px_3px_rgba(59,47,37,0.08)] flex gap-3 p-3 active:scale-[0.99] transition-transform"
      >
        <CafeCardImage shop={shop} size="sm" variant="sp" />
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p
            className="font-bold text-[#3B2F25] text-[14px] leading-snug"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {shop.name}
          </p>
          {location && (
            <p className="text-[11px] text-[#9A8878] flex items-center gap-0.5">
              <MapPin size={10} />
              {location}
            </p>
          )}
          {spTags.length > 0 && (
            <ConditionBadgeRow size="compact">
              {spTags.map((t) => (
                <ConditionBadge
                  key={t.label}
                  label={t.label}
                  fallbackV={t.v}
                  size="compact"
                />
              ))}
            </ConditionBadgeRow>
          )}
          {cardText && (
            <p className="text-[11px] text-[#6A5E54] line-clamp-2">{cardText}</p>
          )}
          <p className="text-[11px] text-[#B8906A] font-semibold text-right">詳細を見る ›</p>
        </div>
      </Link>

      {/* PC card (120px thumb, horizontal) */}
      <Link
        href={href}
        className="hidden md:flex bg-white rounded-xl shadow-[0_1px_4px_rgba(59,47,37,0.1)] gap-4 p-4 hover:shadow-[0_3px_12px_rgba(59,47,37,0.13)] hover:-translate-y-0.5 transition-all duration-200 group"
      >
        <CafeCardImage shop={shop} size="lg" variant="pc" />
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <p
            className="font-bold text-[#3B2F25] text-[16px] leading-snug"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {shop.name}
          </p>
          {location && (
            <p className="text-[12px] text-[#9A8878] flex items-center gap-1">
              <MapPin size={11} />
              {location}
            </p>
          )}
          {pcTags.length > 0 && (
            <ConditionBadgeRow>
              {pcTags.map((t) => (
                <ConditionBadge key={t.label} label={t.label} fallbackV={t.v} />
              ))}
            </ConditionBadgeRow>
          )}
          {cardText && (
            <p className="text-[12px] text-[#6A5E54] leading-relaxed line-clamp-2">
              {cardText}
            </p>
          )}
          <p className="text-[12px] text-[#B8906A] font-semibold">詳細を見る ›</p>
        </div>
      </Link>
    </>
  );
}
