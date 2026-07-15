"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Loader2, MapPin, Phone, Star } from "lucide-react";
import {
  normalizeGoogleAddress,
  type GooglePlaceDetails,
} from "@/lib/google-places";

type GooglePlaceInfoCardProps = {
  placeId: string;
  areaLabel: string;
};

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[12px] text-[#9A8878]">{label}</p>
      <div className="text-[14px] text-[#3B2F25] font-medium">{children}</div>
    </div>
  );
}

function ListingCorrectionNotice() {
  return (
    <div className="space-y-1.5">
      <p className="text-[#9A8878] leading-relaxed text-[12px]">
        掲載情報に誤りがある場合は、以下よりお知らせください。
      </p>
      <Link
        href="/contact?type=correction"
        className="inline-block text-[#B8906A] underline underline-offset-2 hover:text-[#9A7050] transition-colors text-[13px]"
      >
        掲載情報の修正依頼をする
      </Link>
    </div>
  );
}

export default function GooglePlaceInfoCard({
  placeId,
  areaLabel,
}: GooglePlaceInfoCardProps) {
  const [data, setData] = useState<GooglePlaceDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch(
          `/api/google-places/details?placeId=${encodeURIComponent(placeId)}`,
          { cache: "no-store" },
        );
        if (!response.ok) {
          if (!cancelled) setFailed(true);
          return;
        }
        const json = (await response.json()) as GooglePlaceDetails;
        if (!cancelled) setData(json);
      } catch {
        if (!cancelled) setFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [placeId]);

  if (failed) return null;

  if (loading) {
    return (
      <div
        id="google-place-info"
        className="bg-white rounded-2xl border border-[rgba(59,47,37,0.1)] p-5 flex items-center justify-center gap-2 text-[#9A8878] text-[13px]"
      >
        <Loader2 size={16} className="animate-spin shrink-0" />
        Googleマップの情報を取得中…
      </div>
    );
  }

  if (!data) return null;

  const openNow =
    data.currentOpeningHours?.openNow ?? data.regularOpeningHours?.openNow;
  const address = data.formattedAddress
    ? normalizeGoogleAddress(data.formattedAddress)
    : null;

  return (
    <div
      id="google-place-info"
      className="bg-white rounded-2xl border border-[rgba(59,47,37,0.1)] p-5 space-y-4 scroll-mt-24"
    >
      <div className="space-y-1">
        <p
          className="text-[16px] font-bold text-[#3B2F25]"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          Googleマップの店舗情報
        </p>
        <p className="text-[11px] text-[#B8AEA8]">情報提供：Google マップ</p>
      </div>

      {openNow != null && (
        <InfoRow label="営業状況">
          <span
            className={
              openNow
                ? "inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#ECF4EF] text-[#4A9070] border border-[#C5E0D5]"
                : "inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-semibold bg-[#F5F0EB] text-[#9A8878] border border-[rgba(59,47,37,0.1)]"
            }
          >
            {openNow ? "現在営業中" : "営業時間外"}
          </span>
        </InfoRow>
      )}

      {address && (
        <InfoRow label="住所">
          <p className="whitespace-pre-wrap leading-relaxed">{address}</p>
        </InfoRow>
      )}

      {data.nationalPhoneNumber && (
        <InfoRow label="電話番号">
          <a
            href={`tel:${data.nationalPhoneNumber.replace(/[^\d+]/g, "")}`}
            className="inline-flex items-center gap-1 text-[#6FAA88] hover:text-[#4A9070] transition-colors"
          >
            <Phone size={13} />
            {data.nationalPhoneNumber}
          </a>
        </InfoRow>
      )}

      {data.rating != null && data.rating > 0 && (
        <InfoRow label="Googleマップの評価">
          <p className="inline-flex items-center gap-1.5">
            <Star size={14} className="text-[#F2C255] fill-[#F2C255]" />
            <span>{data.rating.toFixed(1)}</span>
            {data.userRatingCount != null && data.userRatingCount > 0 && (
              <span className="text-[#9A8878] font-normal text-[13px]">
                （{data.userRatingCount.toLocaleString("ja-JP")}件）
              </span>
            )}
          </p>
        </InfoRow>
      )}

      {(data.websiteUri || data.googleMapsUri) && (
        <div className="flex flex-wrap gap-4">
          {data.websiteUri && (
            <a
              href={data.websiteUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-[#6FAA88] flex items-center gap-1 hover:text-[#4A9070] transition-colors"
            >
              <ExternalLink size={12} />
              公式サイト
            </a>
          )}
          {data.googleMapsUri && (
            <a
              href={data.googleMapsUri}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] text-[#6FAA88] flex items-center gap-1 hover:text-[#4A9070] transition-colors"
            >
              <MapPin size={12} />
              Googleマップで見る
            </a>
          )}
        </div>
      )}

      {areaLabel && (
        <InfoRow label="所在地">
          <p>{areaLabel}</p>
        </InfoRow>
      )}

      <div className="pt-1 border-t border-[rgba(59,47,37,0.06)]">
        <ListingCorrectionNotice />
      </div>
    </div>
  );
}
