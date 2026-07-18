import Image from "next/image";
import Link from "next/link";
import { MapPin, AlertCircle, Globe, Instagram } from "lucide-react";
import {
  REFERENCE_URL_LABELS,
  areaLabelFromShop,
  classifyReferenceUrl,
  displayPublicReviewAuthor,
  formatReviewPostedAt,
  reviewShowsMetaTags,
  shopDetailUrl,
  shopLocationLabel,
  siteUrl,
} from "@/lib/format";
import { areaPath, formalAreaLabel, prefecturePath } from "@/lib/location-paths";
import { orderTagsForDisplay } from "@/lib/dog-conditions";
import { ConditionBadge, ConditionBadgeRow } from "@/components/ConditionBadge";
import CafeCard from "@/components/CafeCard";
import GoogleMapEmbed from "@/components/GoogleMapEmbed";
import GoogleOpeningHoursSection from "@/components/GoogleOpeningHoursSection";
import GooglePlaceInfoCard from "@/components/GooglePlaceInfoCard";
import ReviewCountLink from "@/components/ReviewCountLink";
import type { GooglePlaceOpeningHours } from "@/lib/google-places";
import type { Review, ReviewPhoto, Shop, ShopWithCardImage } from "@/lib/types";

const SHOP_DISCLAIMER =
  "掲載情報はユーザー投稿に基づくものです。営業時間・犬同伴条件は変更される場合があります。来店前に必ず公式サイト・Instagram・Google Map等で最新情報をご確認ください。";

const REVIEW_BUTTON_CLS =
  "block w-full py-4 bg-[#6FAA88] text-white rounded-xl text-[15px] font-bold hover:bg-[#5D9876] active:scale-[0.98] transition-all shadow-sm text-center";

/** Compact orange CTA — smaller than TOP hero CTA. */
const REQUEST_CTA_CLS =
  "inline-flex items-center justify-center min-h-[44px] px-6 py-2.5 md:px-7 md:py-3 bg-[#E0784A] text-white rounded-xl text-[14px] md:text-[15px] font-bold hover:bg-[#CC6A3D] active:scale-[0.98] transition-all shadow-sm text-center";

function ShopBreadcrumb({
  shop,
  areaLabel,
}: {
  shop: Shop;
  areaLabel: string;
}) {
  return (
    <nav
      aria-label="パンくずリスト"
      className="text-[12px] md:text-[13px] text-[#9A8878] flex flex-wrap items-center gap-x-1.5 gap-y-1 mb-3 md:mb-4"
    >
      <Link href="/" className="hover:text-[#4A9070] transition-colors shrink-0">
        TOP
      </Link>
      <span className="shrink-0" aria-hidden>
        ›
      </span>
      <Link
        href={prefecturePath(shop.prefecture_slug)}
        className="hover:text-[#4A9070] transition-colors shrink-0"
      >
        {shop.prefecture}
      </Link>
      <span className="shrink-0" aria-hidden>
        ›
      </span>
      <Link
        href={areaPath(shop.prefecture_slug, shop.area_slug)}
        className="hover:text-[#4A9070] transition-colors shrink-0 max-w-[40%] truncate sm:max-w-none sm:overflow-visible sm:whitespace-normal"
        title={areaLabel}
      >
        {areaLabel}
      </Link>
      <span className="shrink-0" aria-hidden>
        ›
      </span>
      <span
        className="text-[#6A5E54] min-w-0 basis-full sm:basis-auto sm:max-w-[min(100%,28rem)] break-words line-clamp-2 sm:line-clamp-none"
        aria-current="page"
        title={shop.name}
      >
        {shop.name}
      </span>
    </nav>
  );
}

function RequestListingCta() {
  return (
    <div className="flex justify-center pt-2 pb-1">
      <Link href="/request" className={REQUEST_CTA_CLS}>
        掲載してほしいカフェを知らせる
      </Link>
    </div>
  );
}

function DisclaimerBanner({ variant }: { variant: "sp" | "pc" }) {
  return (
    <div
      className={`flex gap-3 bg-[#FFF3EB] rounded-xl border border-[#F5D5C0] ${
        variant === "sp" ? "p-3.5" : "p-5"
      }`}
    >
      <AlertCircle
        size={variant === "sp" ? 16 : 18}
        className="text-[#E0784A] shrink-0 mt-0.5"
      />
      <p
        className={`text-[#9A6840] leading-relaxed ${
          variant === "sp" ? "text-[12px]" : "text-[13px]"
        }`}
      >
        {SHOP_DISCLAIMER}
      </p>
    </div>
  );
}

function ReviewPostedAt({
  createdAt,
  variant,
}: {
  createdAt?: string | null;
  variant: "sp" | "pc";
}) {
  const label = formatReviewPostedAt(createdAt, { includeTime: variant === "pc" });
  if (!label) return null;
  return (
    <p
      className={`text-[#9A8878] shrink-0 text-right leading-snug ${
        variant === "sp" ? "text-[10px] max-w-[52%]" : "text-[12px]"
      }`}
    >
      {label}
    </p>
  );
}

function ReviewPhotoGrid({
  photos,
  shopName,
  variant,
}: {
  photos: ReviewPhoto[];
  shopName: string;
  variant: "sp" | "pc";
}) {
  if (photos.length === 0) return null;
  return (
    <div className={`grid gap-2 ${variant === "sp" ? "grid-cols-2" : "grid-cols-3"}`}>
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-[#EDE6DE]"
        >
          <Image
            src={photo.public_url}
            alt={photo.alt ?? `${shopName}の口コミ写真`}
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-cover"
            loading="lazy"
          />
        </div>
      ))}
    </div>
  );
}

function ReviewList({
  reviews,
  photosByReviewId,
  shopName,
  variant,
}: {
  reviews: Review[];
  photosByReviewId: Record<string, ReviewPhoto[]>;
  shopName: string;
  variant: "sp" | "pc";
}) {
  if (reviews.length === 0) {
    return (
      <p className={`text-[#B8AEA8] ${variant === "sp" ? "text-[13px]" : "text-[14px]"}`}>
        口コミ募集中
      </p>
    );
  }

  const cardCls =
    variant === "sp"
      ? "bg-white rounded-xl p-4 shadow-[0_1px_3px_rgba(59,47,37,0.07)] space-y-2"
      : "bg-white rounded-xl p-5 shadow-[0_1px_4px_rgba(59,47,37,0.08)] space-y-3";

  return (
    <>
      {reviews.map((review) => (
        <div key={review.id} className={cardCls}>
          <div className="flex items-start justify-between gap-2">
            <p
              className={`font-bold text-[#3B2F25] ${
                variant === "sp" ? "text-[13px]" : "text-[14px]"
              }`}
            >
              {displayPublicReviewAuthor(review)}
            </p>
            <ReviewPostedAt createdAt={review.created_at} variant={variant} />
          </div>
          {reviewShowsMetaTags(review) && (
            <div className={variant === "sp" ? "flex gap-1.5" : "flex gap-2"}>
              {review.dog_size && review.dog_size !== "—" && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-[#ECF4EF] text-[#4A9070] border-[#C5E0D5]">
                  {review.dog_size}
                </span>
              )}
              {review.seat_location && review.seat_location !== "—" && (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold border bg-[#ECF4EF] text-[#4A9070] border-[#C5E0D5]">
                  {review.seat_location}
                </span>
              )}
            </div>
          )}
          {review.source !== "initial" && review.rating > 0 && (
            <p
              className={
                variant === "sp" ? "text-[13px] text-[#F2C255]" : "text-[14px] text-[#F2C255]"
              }
            >
              {"★".repeat(review.rating)}
              {"☆".repeat(Math.max(0, 5 - review.rating))}
            </p>
          )}
          <p
            className={`text-[#6A5E54] leading-relaxed whitespace-pre-wrap ${
              variant === "sp" ? "text-[12px]" : "text-[13px]"
            }`}
          >
            {review.comment}
          </p>
          <ReviewPhotoGrid
            photos={photosByReviewId[review.id] ?? []}
            shopName={shopName}
            variant={variant}
          />
        </div>
      ))}
    </>
  );
}

function ShopReferenceLink({ url, variant }: { url: string; variant: "sp" | "pc" }) {
  const kind = classifyReferenceUrl(url);
  const label = REFERENCE_URL_LABELS[kind];
  const Icon = kind === "instagram" ? Instagram : kind === "google-map" ? MapPin : Globe;
  const className =
    variant === "sp"
      ? "inline-flex items-center gap-1 text-[12px] text-[#6FAA88] hover:text-[#4A9070] transition-colors"
      : "text-[13px] text-[#6FAA88] flex items-center gap-1 hover:text-[#4A9070] transition-colors";
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={className}>
      <Icon size={12} />
      {label}
    </a>
  );
}

function ListingCorrectionNotice({ variant }: { variant: "sp" | "pc" }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[#9A8878] leading-relaxed text-[12px]">
        掲載情報に誤りがある場合は、以下よりお知らせください。
      </p>
      <Link
        href="/contact?type=correction"
        className={`inline-block text-[#B8906A] underline underline-offset-2 hover:text-[#9A7050] transition-colors ${
          variant === "sp" ? "text-[12px]" : "text-[13px]"
        }`}
      >
        掲載情報の修正依頼をする
      </Link>
    </div>
  );
}

function UnlinkedBasicInfoCard({
  shop,
  variant,
}: {
  shop: Shop;
  variant: "sp" | "pc";
}) {
  const location = shopLocationLabel(shop);
  const references = [shop.reference_url, shop.instagram_url, shop.google_map_url].filter(
    (u): u is string => Boolean(u),
  );

  return (
    <div className="bg-white rounded-2xl border border-[rgba(59,47,37,0.1)] p-5 space-y-4">
      <p
        className="text-[16px] font-bold text-[#3B2F25]"
        style={{ fontFamily: "Nunito, sans-serif" }}
      >
        基本情報
      </p>
      {shop.access && (
        <div className="space-y-0.5">
          <p className="text-[12px] text-[#9A8878]">アクセス</p>
          <p className="text-[14px] text-[#3B2F25] font-medium whitespace-pre-wrap">
            {shop.access}
          </p>
        </div>
      )}
      {location && (
        <div className="space-y-0.5">
          <p className="text-[12px] text-[#9A8878]">所在地</p>
          <p className="text-[14px] text-[#3B2F25] font-medium">
            {location}
          </p>
        </div>
      )}
      {references.length > 0 && (
        <div className="flex flex-wrap gap-4 pt-1 border-t border-[rgba(59,47,37,0.06)]">
          {references.map((refUrl) => (
            <ShopReferenceLink key={refUrl} url={refUrl} variant={variant} />
          ))}
        </div>
      )}
      <ListingCorrectionNotice variant={variant} />
    </div>
  );
}

function ShopHeader({
  shop,
  reviews,
  variant,
}: {
  shop: Shop;
  reviews: Review[];
  variant: "sp" | "pc";
}) {
  const location = shopLocationLabel(shop);

  return (
    <div className={variant === "sp" ? "space-y-5" : "space-y-6"}>
      <div className={variant === "sp" ? "space-y-1" : "space-y-2"}>
        <h1
          className={`font-bold text-[#3B2F25] leading-tight ${
            variant === "sp" ? "text-[20px]" : "text-[28px]"
          }`}
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          {shop.name}
        </h1>
        {location && (
          <p
            className={`text-[#9A8878] flex items-center gap-1 ${
              variant === "sp" ? "text-[13px]" : "text-[14px] gap-1.5"
            }`}
          >
            <MapPin size={variant === "sp" ? 12 : 13} />
            {location}
          </p>
        )}
        <ReviewCountLink count={reviews.length} variant={variant} />
      </div>

      {shop.tags.length > 0 && (
        <ConditionBadgeRow>
          {orderTagsForDisplay(shop.tags).map((t) => (
            <ConditionBadge key={t.label} label={t.label} fallbackV={t.v} />
          ))}
        </ConditionBadgeRow>
      )}

      {shop.description && (
        <p
          className={`text-[#6A5E54] leading-relaxed whitespace-pre-wrap ${
            variant === "sp" ? "text-[13px]" : "text-[14px]"
          }`}
        >
          {shop.description}
        </p>
      )}

      {shop.google_place_id && (
        <a
          href="#google-place-info"
          className={`inline-flex items-center gap-1 text-[#6FAA88] hover:text-[#4A9070] transition-colors ${
            variant === "sp" ? "text-[13px]" : "text-[14px]"
          }`}
        >
          <MapPin size={variant === "sp" ? 13 : 14} />
          Googleマップの店舗情報を見る
        </a>
      )}
    </div>
  );
}

function ReviewSection({
  reviews,
  photosByReview,
  shopName,
  variant,
}: {
  reviews: Review[];
  photosByReview: Record<string, ReviewPhoto[]>;
  shopName: string;
  variant: "sp" | "pc";
}) {
  return (
    <div
      {...(variant === "sp" ? { id: "reviews" } : {})}
      data-reviews-section
      className={`scroll-mt-24 ${variant === "sp" ? "space-y-3" : "space-y-4"}`}
    >
      <p
        className={`font-bold text-[#3B2F25] ${
          variant === "sp" ? "text-[18px]" : "text-[20px]"
        }`}
        style={{ fontFamily: "Nunito, sans-serif" }}
      >
        口コミ ({reviews.length}件)
      </p>
      <ReviewList
        reviews={reviews}
        photosByReviewId={photosByReview}
        shopName={shopName}
        variant={variant}
      />
    </div>
  );
}

export default function CafeDetailView({
  shop,
  reviews,
  photosByReview,
  nearby,
  googleMapEmbedUrl,
  googlePlaceOpeningHours = null,
  showGoogleHours = false,
}: {
  shop: Shop;
  reviews: Review[];
  photosByReview: Record<string, ReviewPhoto[]>;
  nearby: ShopWithCardImage[];
  googleMapEmbedUrl?: string | null;
  googlePlaceOpeningHours?: GooglePlaceOpeningHours | null;
  showGoogleHours?: boolean;
}) {
  const area = areaLabelFromShop(shop);
  const url = shopDetailUrl(shop);
  const areaLabel = formalAreaLabel(shop);
  const isGoogleLinked = Boolean(shop.google_place_id) || showGoogleHours;

  const localBusiness = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: shop.name,
    description: shop.description || undefined,
    address: shop.address
      ? {
          "@type": "PostalAddress",
          addressRegion: shop.prefecture,
          addressLocality: shop.city || undefined,
          streetAddress: shop.address,
          addressCountry: "JP",
        }
      : undefined,
    geo:
      shop.latitude != null && shop.longitude != null
        ? {
            "@type": "GeoCoordinates",
            latitude: shop.latitude,
            longitude: shop.longitude,
          }
        : undefined,
    telephone: shop.phone || undefined,
    url: shop.reference_url || url,
    image: shop.photo_url || undefined,
    openingHours: shop.business_hours || undefined,
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "TOP", item: siteUrl() },
      {
        "@type": "ListItem",
        position: 2,
        name: shop.prefecture,
        item: `${siteUrl()}${prefecturePath(shop.prefecture_slug)}`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: areaLabel,
        item: `${siteUrl()}${areaPath(shop.prefecture_slug, shop.area_slug)}`,
      },
      { "@type": "ListItem", position: 4, name: shop.name, item: url },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusiness) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* SP */}
      <div className="md:hidden">
        <div className="px-4 py-5 space-y-5">
          <ShopBreadcrumb shop={shop} areaLabel={areaLabel} />
          <ShopHeader shop={shop} reviews={reviews} variant="sp" />

          <DisclaimerBanner variant="sp" />

          <Link href={`/review/${shop.id}`} className={REVIEW_BUTTON_CLS}>
            口コミを投稿する
          </Link>

          <ReviewSection
            reviews={reviews}
            photosByReview={photosByReview}
            shopName={shop.name}
            variant="sp"
          />

          {isGoogleLinked ? (
            <>
              {showGoogleHours && (
                <GoogleOpeningHoursSection details={googlePlaceOpeningHours} />
              )}
              {shop.google_place_id && (
                <GooglePlaceInfoCard
                  placeId={shop.google_place_id}
                  areaLabel={shopLocationLabel(shop) || area || shop.prefecture}
                />
              )}
              {googleMapEmbedUrl && (
                <GoogleMapEmbed src={googleMapEmbedUrl} shopName={shop.name} />
              )}
            </>
          ) : (
            <UnlinkedBasicInfoCard shop={shop} variant="sp" />
          )}

          {nearby.length > 0 && (
            <div>
              <p
                className="text-[18px] font-bold text-[#3B2F25] mb-4"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                近くのカフェ
              </p>
              <div className="space-y-3">
                {nearby.map((s) => (
                  <CafeCard key={s.id} shop={s} />
                ))}
              </div>
            </div>
          )}

          <RequestListingCta />
        </div>
      </div>

      {/* PC */}
      <div className="hidden md:block">
        <div className="px-10 lg:px-24 xl:px-40 py-10">
          <ShopBreadcrumb shop={shop} areaLabel={areaLabel} />
          <div className="flex gap-8 items-start">
            <div className="flex-1 min-w-0 space-y-6">
              <ShopHeader shop={shop} reviews={reviews} variant="pc" />
              <DisclaimerBanner variant="pc" />
              <ReviewSection
                reviews={reviews}
                photosByReview={photosByReview}
                shopName={shop.name}
                variant="pc"
              />
            </div>

            <div className="w-[368px] shrink-0 space-y-4 sticky top-24">
              {isGoogleLinked ? (
                <>
                  {showGoogleHours && (
                    <GoogleOpeningHoursSection details={googlePlaceOpeningHours} />
                  )}
                  {shop.google_place_id && (
                    <GooglePlaceInfoCard
                      placeId={shop.google_place_id}
                      areaLabel={shopLocationLabel(shop) || area || shop.prefecture}
                    />
                  )}
                  {googleMapEmbedUrl && (
                    <GoogleMapEmbed src={googleMapEmbedUrl} shopName={shop.name} />
                  )}
                </>
              ) : (
                <UnlinkedBasicInfoCard shop={shop} variant="pc" />
              )}
              <Link href={`/review/${shop.id}`} className={REVIEW_BUTTON_CLS}>
                口コミを投稿する
              </Link>
              <Link
                href={areaPath(shop.prefecture_slug, shop.area_slug)}
                className="text-[13px] text-[#6FAA88] flex items-center gap-1 hover:text-[#4A9070] transition-colors"
              >
                ← 一覧に戻る
              </Link>
            </div>
          </div>

          {nearby.length > 0 && (
            <div className="mt-10">
              <p
                className="text-[20px] font-bold text-[#3B2F25] mb-4"
                style={{ fontFamily: "Nunito, sans-serif" }}
              >
                近くのカフェ
              </p>
              <div className="grid grid-cols-2 gap-6">
                {nearby.map((s) => (
                  <CafeCard key={s.id} shop={s} />
                ))}
              </div>
            </div>
          )}

          <div className="mt-10">
            <RequestListingCta />
          </div>
        </div>
      </div>
    </>
  );
}
