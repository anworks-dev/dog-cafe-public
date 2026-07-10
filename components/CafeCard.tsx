import Image from "next/image";
import Link from "next/link";
import { MapPin, PawPrint, Camera } from "lucide-react";
import type { Shop } from "@/lib/types";
import { areaLabelFromShop, shopDetailPath } from "@/lib/format";

export const TAG_CLS = {
  green: "bg-[#ECF4EF] text-[#4A9070] border-[#C5E0D5]",
  brown: "bg-[#F2E8DC] text-[#9A6840] border-[#DFD0BC]",
  orange: "bg-[#FFF3EB] text-[#C05A25] border-[#F5D5C0]",
} as const;

export default function CafeCard({ shop }: { shop: Shop }) {
  const href = shopDetailPath(shop);
  const area = shop.area?.trim() || areaLabelFromShop(shop);
  const station = shop.station?.trim();

  return (
    <>
      {/* SP card (80px thumb, horizontal) */}
      <Link
        href={href}
        className="md:hidden bg-white rounded-xl shadow-[0_1px_3px_rgba(59,47,37,0.08)] flex gap-3 p-3 active:scale-[0.99] transition-transform"
      >
        {shop.photo_url ? (
          <div className="w-[80px] h-[80px] rounded-lg overflow-hidden shrink-0 bg-[#EDE6DE] relative">
            <Image
              src={shop.photo_url}
              alt={shop.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>
        ) : (
          <div className="w-[80px] h-[80px] rounded-lg bg-[#F2E8DC] shrink-0 flex flex-col items-center justify-center gap-1">
            <PawPrint size={20} className="text-[#6FAA88] opacity-60" strokeWidth={1.5} />
            <p className="text-[9px] text-[#9A8878]">写真募集中</p>
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-1">
          <p
            className="font-bold text-[#3B2F25] text-[14px] leading-snug"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {shop.name}
          </p>
          <p className="text-[11px] text-[#9A8878] flex items-center gap-0.5">
            <MapPin size={10} />
            {area}
          </p>
          {shop.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {shop.tags.slice(0, 2).map((t) => (
                <span
                  key={t.label}
                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${TAG_CLS[t.v]}`}
                >
                  {t.label}
                </span>
              ))}
            </div>
          )}
          {shop.description && (
            <p className="text-[11px] text-[#6A5E54] line-clamp-2">{shop.description}</p>
          )}
          <p className="text-[11px] text-[#B8906A] font-semibold text-right">詳細を見る ›</p>
        </div>
      </Link>

      {/* PC card (120px thumb, horizontal) */}
      <Link
        href={href}
        className="hidden md:flex bg-white rounded-xl shadow-[0_1px_4px_rgba(59,47,37,0.1)] gap-4 p-4 hover:shadow-[0_3px_12px_rgba(59,47,37,0.13)] hover:-translate-y-0.5 transition-all duration-200 group"
      >
        {shop.photo_url ? (
          <div className="w-[120px] h-[120px] rounded-lg overflow-hidden shrink-0 bg-[#EDE6DE] relative">
            <Image
              src={shop.photo_url}
              alt={shop.name}
              fill
              sizes="120px"
              className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="w-[120px] h-[120px] rounded-lg bg-[#F2E8DC] shrink-0 flex flex-col items-center justify-center gap-1.5">
            <Camera size={22} className="text-[#9A8878]" />
            <p className="text-[10px] text-[#9A8878]">写真募集中</p>
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <p
            className="font-bold text-[#3B2F25] text-[16px] leading-snug"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {shop.name}
          </p>
          <p className="text-[12px] text-[#9A8878] flex items-center gap-1">
            <MapPin size={11} />
            {area}
            {station ? ` ・ ${station}` : ""}
          </p>
          {shop.tags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {shop.tags.map((t) => (
                <span
                  key={t.label}
                  className={`px-2 py-0.5 rounded-[4px] text-[10px] font-semibold border ${TAG_CLS[t.v]}`}
                >
                  {t.label}
                </span>
              ))}
            </div>
          )}
          {shop.description && (
            <p className="text-[12px] text-[#6A5E54] leading-relaxed line-clamp-2">
              {shop.description}
            </p>
          )}
          <p className="text-[12px] text-[#B8906A] font-semibold">詳細を見る ›</p>
        </div>
      </Link>
    </>
  );
}
