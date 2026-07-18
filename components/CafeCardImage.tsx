"use client";

import Image from "next/image";
import { useState } from "react";
import { PawPrint, Camera } from "lucide-react";
import type { ShopWithCardImage } from "@/lib/types";

function resolveCardImage(shop: ShopWithCardImage): {
  src: string;
  alt: string;
  fromReview: boolean;
} | null {
  const shopPhoto = shop.photo_url?.trim();
  if (shopPhoto) {
    return { src: shopPhoto, alt: shop.name, fromReview: false };
  }
  const reviewPhoto = shop.card_image_url?.trim();
  if (reviewPhoto) {
    return { src: reviewPhoto, alt: `${shop.name}の口コミ写真`, fromReview: true };
  }
  return null;
}

function Placeholder({
  size,
  variant,
}: {
  size: "sm" | "lg";
  variant: "sp" | "pc";
}) {
  if (variant === "sp") {
    return (
      <div
        className={`${size === "sm" ? "w-[80px] h-[80px]" : "w-[120px] h-[120px]"} rounded-xl bg-[#F3E6D8] shrink-0 flex flex-col items-center justify-center gap-1`}
      >
        <PawPrint size={20} className="text-[#759F88] opacity-60" strokeWidth={1.5} />
        <p className="text-[9px] text-[#9A8578]">写真募集中</p>
      </div>
    );
  }

  return (
    <div
      className={`${size === "sm" ? "w-[80px] h-[80px]" : "w-[120px] h-[120px]"} rounded-xl bg-[#F3E6D8] shrink-0 flex flex-col items-center justify-center gap-1.5`}
    >
      <Camera size={22} className="text-[#9A8578]" />
      <p className="text-[10px] text-[#9A8578]">写真募集中</p>
    </div>
  );
}

export default function CafeCardImage({
  shop,
  size,
  variant,
}: {
  shop: ShopWithCardImage;
  size: "sm" | "lg";
  variant: "sp" | "pc";
}) {
  const resolved = resolveCardImage(shop);
  const [failed, setFailed] = useState(false);

  if (!resolved || failed) {
    return <Placeholder size={size} variant={variant} />;
  }

  const box =
    size === "sm"
      ? "w-[80px] h-[80px] rounded-xl overflow-hidden shrink-0 bg-[#EBE0D4] relative"
      : "w-[120px] h-[120px] rounded-xl overflow-hidden shrink-0 bg-[#EBE0D4] relative";

  return (
    <div className={box}>
      <Image
        src={resolved.src}
        alt={resolved.alt}
        fill
        sizes={size === "sm" ? "80px" : "120px"}
        className={
          variant === "pc"
            ? "object-cover group-hover:scale-[1.03] transition-transform duration-300"
            : "object-cover"
        }
        onError={() => setFailed(true)}
      />
    </div>
  );
}
