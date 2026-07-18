"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { PawPrint, MapPin, ChevronDown, Search } from "lucide-react";
import type { ShopWithCardImage } from "@/lib/types";
import {
  POSITIVE_DOG_CONDITIONS,
  parseConditionChipsFromParam,
} from "@/lib/dog-conditions";
import { buildLocationSearchPath } from "@/lib/location-paths";
import {
  buildAreaOptions,
  buildPrefectureOptions,
  filterShops,
  type ShopSearchFilters,
} from "@/lib/shop-search";
import { ConditionFilterChip, ConditionBadgeRow } from "./ConditionBadge";
import CafeCard from "./CafeCard";
import HeroBackgroundPattern from "./HeroBackgroundPattern";

const FEATURED_COUNT = 8;

function shopUpdatedAtMs(shop: ShopWithCardImage): number | null {
  const raw = shop.updated_at?.trim();
  if (!raw) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

const selectCls =
  "flex-1 flex items-center justify-between bg-[#FAF8F4] border border-[rgba(59,47,37,0.12)] rounded-xl px-3.5 py-2.5 text-[13px] text-[#3B2F25] hover:border-[#6FAA88] transition-colors appearance-none cursor-pointer";

type TopShopSort = "newest" | "reviews";

const SORT_TABS: { id: TopShopSort; label: string }[] = [
  { id: "newest", label: "新着順" },
  { id: "reviews", label: "口コミ数順" },
];

type AppliedFilters = ShopSearchFilters;

function readFiltersFromParams(searchParams: URLSearchParams): AppliedFilters {
  return {
    keyword: searchParams.get("q") ?? "",
    prefecture: "",
    area: "",
    conditions: parseConditionChipsFromParam(searchParams.get("tags")),
  };
}

function buildTopOnlyQueryPath(applied: AppliedFilters): string {
  const p = new URLSearchParams();
  const q = applied.keyword.trim();
  if (q) p.set("q", q);
  if (applied.conditions.length) p.set("tags", applied.conditions.join(","));
  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}

function filtersEqual(a: ShopSearchFilters, b: ShopSearchFilters): boolean {
  return (
    a.keyword === b.keyword &&
    a.prefecture === b.prefecture &&
    a.area === b.area &&
    a.conditions.length === b.conditions.length &&
    a.conditions.every((chip, index) => chip === b.conditions[index])
  );
}

function SortTabs({
  value,
  onChange,
}: {
  value: TopShopSort;
  onChange: (sort: TopShopSort) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SORT_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={`px-3 py-1.5 md:px-3.5 rounded-full text-[12px] md:text-[13px] font-semibold border transition-all ${
            value === tab.id
              ? "bg-[#6FAA88] text-white border-[#6FAA88]"
              : "bg-white text-[#4A9070] border-[#C5E0D5] hover:bg-[#ECF4EF]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

type PrefOption = { slug: string; label: string; count: number };

export default function ShopExplorer({
  shops,
  prefectures,
  reviewCounts = {},
}: {
  shops: ShopWithCardImage[];
  prefectures: PrefOption[];
  reviewCounts?: Record<number, number>;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [keyword, setKeyword] = useState("");
  const [prefecture, setPrefecture] = useState("");
  const [area, setArea] = useState("");
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [pendingSearch, setPendingSearch] = useState<ShopSearchFilters | null>(null);
  const [shopSort, setShopSort] = useState<TopShopSort>("newest");
  const resultsRef = useRef<HTMLDivElement>(null);

  const appliedFromUrl = useMemo<ShopSearchFilters>(
    () => readFiltersFromParams(searchParams),
    [searchParams],
  );

  const appliedFilters = pendingSearch ?? appliedFromUrl;

  useEffect(() => {
    const urlFilters = readFiltersFromParams(searchParams);
    setKeyword(urlFilters.keyword);
    setSelectedConditions(urlFilters.conditions);
    setPendingSearch((pending) =>
      pending && filtersEqual(pending, urlFilters) ? null : pending,
    );
  }, [searchParams]);

  const draftFilters = useMemo<ShopSearchFilters>(
    () => ({
      keyword,
      prefecture,
      area,
      conditions: selectedConditions,
    }),
    [keyword, prefecture, area, selectedConditions],
  );

  const prefectureOptions = useMemo(
    () =>
      buildPrefectureOptions(shops, prefectures, {
        keyword,
        conditions: selectedConditions,
      }),
    [shops, prefectures, keyword, selectedConditions],
  );

  const areaOptions = useMemo(
    () =>
      buildAreaOptions(shops, {
        keyword,
        conditions: selectedConditions,
        prefecture,
      }),
    [shops, keyword, selectedConditions, prefecture],
  );

  const previewCount = useMemo(
    () => filterShops(shops, draftFilters).length,
    [shops, draftFilters],
  );

  useEffect(() => {
    const prefStillValid =
      !prefecture || prefectureOptions.some((opt) => opt.slug === prefecture);
    const areaStillValid = !area || areaOptions.some((opt) => opt.slug === area);

    if (!prefStillValid) {
      setPrefecture("");
      setArea("");
      return;
    }
    if (!areaStillValid) {
      setArea("");
    }
  }, [prefecture, area, prefectureOptions, areaOptions]);

  const filtered = useMemo(() => filterShops(shops, appliedFilters), [shops, appliedFilters]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (shopSort === "newest") {
      return list.sort((a, b) => {
        const aMs = shopUpdatedAtMs(a);
        const bMs = shopUpdatedAtMs(b);
        if (aMs != null && bMs != null && aMs !== bMs) return bMs - aMs;
        if (aMs != null && bMs == null) return -1;
        if (aMs == null && bMs != null) return 1;
        return b.id - a.id;
      });
    }
    return list.sort((a, b) => {
      const diff = (reviewCounts[b.id] ?? 0) - (reviewCounts[a.id] ?? 0);
      return diff !== 0 ? diff : b.id - a.id;
    });
  }, [filtered, shopSort, reviewCounts]);

  const isFiltering = Boolean(
    appliedFilters.keyword.trim() ||
      appliedFilters.prefecture ||
      appliedFilters.area ||
      appliedFilters.conditions.length > 0,
  );
  const displayed = isFiltering ? sorted : sorted.slice(0, FEATURED_COUNT);

  const scrollToResults = useCallback(() => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleSearch = useCallback(() => {
    if (previewCount === 0) return;
    const next: AppliedFilters = {
      keyword,
      prefecture,
      area,
      conditions: selectedConditions,
    };
    setPendingSearch(next);

    if (prefecture) {
      router.push(
        buildLocationSearchPath(prefecture, area, {
          keyword,
          conditions: selectedConditions,
        }),
      );
      return;
    }

    router.replace(buildTopOnlyQueryPath(next), { scroll: false });
    scrollToResults();
  }, [keyword, prefecture, area, selectedConditions, previewCount, router, scrollToResults]);

  const handlePrefectureChange = (value: string) => {
    setPrefecture(value);
    setArea("");
  };

  const toggleCondition = (chip: string) => {
    setSelectedConditions((prev) =>
      prev.includes(chip) ? prev.filter((c) => c !== chip) : [...prev, chip],
    );
  };

  return (
    <>
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[rgb(237,245,241)] overflow-visible">
        <HeroBackgroundPattern />
        <div className="relative overflow-visible px-4 md:px-10 lg:px-24 xl:px-40 pt-6 pb-5 md:py-10 lg:py-12">
          <div className="max-w-[920px] mx-auto overflow-visible">
            <div className="relative mx-auto flex w-full max-w-[840px] flex-col items-center overflow-visible">
              <p className="relative z-10 hidden md:flex text-[13px] font-medium text-[#6FAA88] items-center gap-1.5">
                <PawPrint size={12} strokeWidth={2.5} />
                犬と一緒に、おでかけしよう
              </p>

              {/* Headline + search card */}
              <div className="relative w-full overflow-visible">
                <h1
                  className="relative z-10 text-[20px] md:text-[32px] font-extrabold text-[#3B2F25] leading-snug md:leading-tight text-center"
                  style={{ fontFamily: "Nunito, sans-serif" }}
                >
                  愛犬と行けるカフェ・お店を探す
                </h1>
                <p className="relative z-10 mt-2 md:mt-3 text-[13px] md:text-[14px] text-[#6A5E54] leading-[1.7] md:leading-relaxed max-w-[17.5rem] md:max-w-none mx-auto text-center">
                  全国のドッグフレンドリーなお店を
                  <br className="md:hidden" />
                  みんなの口コミで見つけよう。
                </p>

                {/*
                  Outer padding reserves peek space; absolute containing block is
                  the inner relative (card height only) so paws stay on the card.
                  On PC, padding is shorter than the pug so the face nests into
                  the headline’s bottom-left.
                */}
                <div className="w-full overflow-visible mt-5 pt-[clamp(2.1rem,6.5vw,2.85rem)] md:mt-2 md:pt-[clamp(2rem,2.8vw,2.5rem)]">
                  <div className="relative w-full overflow-visible">
                    {/* PC: peek from card left; clear of title/description */}
                    <img
                      src="/images/hero-pug.png"
                      alt=""
                      aria-hidden="true"
                      width={120}
                      height={93}
                      draggable={false}
                      className="pointer-events-none absolute z-20 hidden select-none h-auto md:block
                        w-[clamp(5.1rem,9vw,6.25rem)]
                        left-[clamp(3.75rem,calc(12%-1.5rem),5.75rem)]
                        bottom-[calc(100%-0.7rem)]"
                    />

                    {/* SP: centered on search card; paws mid-line on card top */}
                    <img
                      src="/images/hero-pug.png"
                      alt=""
                      aria-hidden="true"
                      width={120}
                      height={93}
                      draggable={false}
                      className="pointer-events-none absolute z-20 select-none h-auto md:hidden
                        w-[clamp(3.7rem,17vw,4.35rem)]
                        left-1/2 -translate-x-1/2
                        bottom-[calc(100%-clamp(0.28rem,1.5vw,0.4rem))]"
                    />

                    <div className="relative z-10 w-full bg-white rounded-2xl p-4 md:p-5 shadow-sm space-y-3 md:space-y-4 text-left">
                <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
                  <label className="relative flex-1 min-w-0">
                    <span className="sr-only">都道府県を選択</span>
                    <MapPin
                      size={12}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6FAA88] pointer-events-none z-10"
                    />
                    <select
                      value={prefecture}
                      onChange={(e) => handlePrefectureChange(e.target.value)}
                      className={`${selectCls} pl-8 pr-8 w-full`}
                    >
                      <option value="">都道府県を選択</option>
                      {prefectureOptions.map((opt) => (
                        <option key={opt.slug} value={opt.slug}>
                          {opt.label}（{opt.count}）
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={11}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8878] pointer-events-none"
                    />
                  </label>

                  <label className="relative flex-1 min-w-0">
                    <span className="sr-only">エリアを選択</span>
                    <select
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      disabled={!prefecture}
                      className={`${selectCls} pr-8 w-full disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      <option value="">
                        {prefecture ? "エリアを選択" : "先に都道府県を選択"}
                      </option>
                      {areaOptions.map((opt) => (
                        <option key={opt.slug} value={opt.slug}>
                          {opt.label}（{opt.count}）
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={11}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A8878] pointer-events-none"
                    />
                  </label>
                </div>

                <ConditionBadgeRow>
                  {POSITIVE_DOG_CONDITIONS.map(({ chip }) => (
                    <ConditionFilterChip
                      key={chip}
                      label={chip}
                      selected={selectedConditions.includes(chip)}
                      onClick={() => toggleCondition(chip)}
                    />
                  ))}
                </ConditionBadgeRow>

                <div className="flex items-center gap-2 bg-[#FAF8F4] border border-[rgba(59,47,37,0.12)] rounded-xl px-3 py-2.5 md:px-3.5 md:py-3">
                  <input
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && previewCount > 0 && handleSearch()}
                    className="flex-1 text-[13px] md:text-[14px] text-[#3B2F25] bg-transparent outline-none placeholder:text-[#9A8878]"
                    placeholder="カフェ名・エリアで検索"
                  />
                  <Search size={14} className="text-[#9A8878] shrink-0" />
                </div>

                <p className="text-[13px] md:text-[14px] text-[#6A5E54] text-center md:text-left">
                  {previewCount === 0 ? (
                    "該当する店舗はありません"
                  ) : (
                    <>
                      該当する店舗は
                      <span className="font-bold text-[#6FAA88] mx-0.5">{previewCount}</span>
                      件あります
                    </>
                  )}
                </p>

                <button
                  type="button"
                  onClick={handleSearch}
                  disabled={previewCount === 0}
                  className="w-full bg-[#6FAA88] text-white rounded-xl font-bold hover:bg-[#5D9876] active:scale-[0.98] transition-all shadow-sm py-3 text-[15px] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 disabled:hover:bg-[#6FAA88]"
                >
                  この条件で探す
                </button>
                  </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        ref={resultsRef}
        className="px-4 md:px-10 lg:px-24 xl:px-40 pt-6 md:pt-8 pb-6 md:pb-10 scroll-mt-16"
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
          <p
            className="text-[18px] md:text-[20px] font-bold text-[#3B2F25]"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {isFiltering ? "検索結果" : "おすすめカフェ"}{" "}
            <span className="text-[#6FAA88]">{isFiltering ? filtered.length : shops.length}</span>
            件
          </p>
          <SortTabs value={shopSort} onChange={setShopSort} />
        </div>
        {displayed.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center text-[#9A8878] text-[14px]">
            条件に合うお店が見つかりませんでした。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {displayed.map((shop) => (
              <CafeCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}

        {!isFiltering && displayed.length > 0 && (
          <div className="text-center mt-6 md:mt-8">
            <Link
              href="/list"
              className="text-[13px] md:text-[15px] font-medium text-[#B8906A] hover:text-[#9A7050] transition-colors"
            >
              店舗一覧を見る ›
            </Link>
          </div>
        )}
      </div>

      <div className="flex flex-col items-center px-4 md:px-10 lg:px-24 xl:px-40 pb-10 md:pb-14">
        <Link
          href="/request"
          className="w-full md:w-auto text-center px-10 py-4 bg-[#E0784A] text-white rounded-xl text-[15px] md:text-[16px] font-bold hover:bg-[#CC6A3D] active:scale-[0.98] transition-all shadow-md"
        >
          掲載してほしいカフェを知らせる
        </Link>
      </div>
    </>
  );
}
