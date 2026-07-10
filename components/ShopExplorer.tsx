"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PawPrint, MapPin, ChevronDown, Search } from "lucide-react";
import type { Shop } from "@/lib/types";
import CafeCard from "./CafeCard";

const PAW_BG = `url("data:image/svg+xml,%3Csvg width='52' height='52' viewBox='0 0 52 52' xmlns='http://www.w3.org/2000/svg'%3E%3Cellipse cx='26' cy='35' rx='9' ry='8' fill='%236FAA88' opacity='0.1'/%3E%3Cellipse cx='15' cy='24' rx='4.5' ry='5.5' transform='rotate(-15 15 24)' fill='%236FAA88' opacity='0.1'/%3E%3Cellipse cx='37' cy='24' rx='4.5' ry='5.5' transform='rotate(15 37 24)' fill='%236FAA88' opacity='0.1'/%3E%3Cellipse cx='19' cy='16' rx='3.5' ry='4.5' fill='%236FAA88' opacity='0.1'/%3E%3Cellipse cx='33' cy='16' rx='3.5' ry='4.5' fill='%236FAA88' opacity='0.1'/%3E%3C/svg%3E")`;

const CONDITION_CHIPS = [
  "店内OK",
  "テラスOK",
  "大型犬OK",
  "ドッグメニューあり",
  "駐車場あり",
  "雨の日OK",
];

const FEATURED_COUNT = 6;

const selectCls =
  "flex-1 flex items-center justify-between bg-[#FAF8F4] border border-[rgba(59,47,37,0.12)] rounded-xl px-3.5 py-2.5 text-[13px] text-[#3B2F25] hover:border-[#6FAA88] transition-colors appearance-none cursor-pointer";

type TopShopSort = "newest" | "reviews";

const SORT_TABS: { id: TopShopSort; label: string }[] = [
  { id: "newest", label: "新着順" },
  { id: "reviews", label: "口コミ数順" },
];

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
  shops: Shop[];
  prefectures: PrefOption[];
  reviewCounts?: Record<number, number>;
}) {
  const [prefecture, setPrefecture] = useState("");
  const [area, setArea] = useState("");
  const [keyword, setKeyword] = useState("");
  const [activeCondition, setActiveCondition] = useState<string | null>(null);
  const [shopSort, setShopSort] = useState<TopShopSort>("newest");
  const resultsRef = useRef<HTMLDivElement>(null);

  const areaOptions = useMemo(() => {
    const map = new Map<string, { slug: string; label: string; count: number }>();
    for (const s of shops) {
      if (prefecture && s.prefecture_slug !== prefecture) continue;
      if (!s.area_slug) continue;
      const existing = map.get(s.area_slug);
      if (existing) existing.count += 1;
      else map.set(s.area_slug, { slug: s.area_slug, label: s.area || s.area_slug, count: 1 });
    }
    return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "ja"));
  }, [shops, prefecture]);

  const conditionChips = useMemo(
    () =>
      CONDITION_CHIPS.filter((chip) =>
        shops.some((s) => s.tags.some((t) => t.label === chip)),
      ),
    [shops],
  );

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return shops.filter((s) => {
      if (prefecture && s.prefecture_slug !== prefecture) return false;
      if (area && s.area_slug !== area) return false;
      if (activeCondition && !s.tags.some((t) => t.label === activeCondition)) return false;
      if (q) {
        const hay =
          `${s.name} ${s.area} ${s.prefecture} ${s.station} ${s.station_label}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [shops, prefecture, area, keyword, activeCondition]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (shopSort === "newest") {
      return list.sort((a, b) => b.id - a.id);
    }
    return list.sort((a, b) => {
      const diff = (reviewCounts[b.id] ?? 0) - (reviewCounts[a.id] ?? 0);
      return diff !== 0 ? diff : b.id - a.id;
    });
  }, [filtered, shopSort, reviewCounts]);

  const isFiltering = Boolean(prefecture || area || keyword.trim() || activeCondition);
  const displayed = isFiltering ? sorted : sorted.slice(0, FEATURED_COUNT);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handlePrefectureChange = (value: string) => {
    setPrefecture(value);
    setArea("");
  };

  const toggleCondition = (chip: string) => {
    setActiveCondition((prev) => (prev === chip ? null : chip));
    scrollToResults();
  };

  return (
    <>
      {/* Hero */}
      <div
        className="px-4 md:px-10 lg:px-24 xl:px-40 pt-6 pb-5 md:py-10 lg:py-12"
        style={{ backgroundColor: "#EDF5F1", backgroundImage: PAW_BG, backgroundSize: "52px 52px" }}
      >
        <div className="max-w-[920px] mx-auto">
          <div className="flex flex-col gap-2 md:gap-3 text-center items-center">
            <p className="hidden md:flex text-[13px] font-medium text-[#6FAA88] items-center gap-1.5">
              <PawPrint size={12} strokeWidth={2.5} />
              犬と一緒に、おでかけしよう
            </p>
            <h1
              className="text-[20px] md:text-[32px] font-extrabold text-[#3B2F25] leading-snug md:leading-tight"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              愛犬と行けるカフェ・お店を探す
            </h1>
            <p className="text-[13px] md:text-[14px] text-[#6A5E54] leading-relaxed">
              全国のドッグフレンドリーなお店をみんなの口コミで見つけよう。
            </p>

            <div className="w-full max-w-[840px] bg-white rounded-2xl p-4 md:p-5 shadow-sm space-y-3 md:space-y-4 mt-2 text-left">
              <div className="flex items-center gap-2 bg-[#FAF8F4] border border-[rgba(59,47,37,0.12)] rounded-xl px-3 py-2.5 md:px-3.5 md:py-3">
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && scrollToResults()}
                  className="flex-1 text-[13px] md:text-[14px] text-[#3B2F25] bg-transparent outline-none placeholder:text-[#9A8878]"
                  placeholder="カフェ名・エリアで検索"
                />
                <Search size={14} className="text-[#9A8878] shrink-0" />
              </div>

              <div className="flex gap-2 md:gap-3">
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
                    {prefectures.map((opt) => (
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
                  <span className="sr-only">エリア・駅を選択</span>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    disabled={!prefecture}
                    className={`${selectCls} pr-8 w-full disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <option value="">{prefecture ? "エリア・駅を選択" : "先に都道府県を選択"}</option>
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

              <button
                type="button"
                onClick={scrollToResults}
                className="w-full bg-[#6FAA88] text-white rounded-xl font-bold hover:bg-[#5D9876] active:scale-[0.98] transition-all shadow-sm py-3 text-[15px]"
              >
                この条件で探す
              </button>

              {conditionChips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {conditionChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => toggleCondition(chip)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all ${
                        activeCondition === chip
                          ? "bg-[#6FAA88] text-white border-[#6FAA88]"
                          : "bg-[#ECF4EF] text-[#4A9070] border-[#C5E0D5] hover:bg-[#6FAA88] hover:text-white hover:border-[#6FAA88]"
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Results */}
      <div ref={resultsRef} className="px-4 md:px-10 lg:px-24 xl:px-40 py-6 md:py-10 scroll-mt-16">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4 md:mb-6">
          <p
            className="text-[18px] md:text-[20px] font-bold text-[#3B2F25]"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {isFiltering ? "検索結果" : "おすすめカフェ"}{" "}
            <span className="text-[#6FAA88]">{isFiltering ? filtered.length : shops.length}</span>件
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

      {/* Bottom CTA */}
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
