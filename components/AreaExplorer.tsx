"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { ShopWithCardImage } from "@/lib/types";
import { POSITIVE_DOG_CONDITIONS, shopHasConditionTag } from "@/lib/dog-conditions";
import CafeCard from "./CafeCard";
import { ConditionFilterChip, ConditionBadgeRow } from "./ConditionBadge";

const PAGE_SIZE = 8;

type TopShopSort = "newest" | "reviews";

const SORT_TABS: { id: TopShopSort; label: string }[] = [
  { id: "newest", label: "新着順" },
  { id: "reviews", label: "口コミ数順" },
];

export default function AreaExplorer({
  shops,
  areaLabel,
  resultLabel,
  reviewCounts = {},
}: {
  shops: ShopWithCardImage[];
  areaLabel?: string;
  resultLabel?: string;
  reviewCounts?: Record<number, number>;
}) {
  const [keyword, setKeyword] = useState("");
  const [activeChip, setActiveChip] = useState<string | null>(null);
  const [shopSort, setShopSort] = useState<TopShopSort>("newest");
  const [page, setPage] = useState(1);

  const conditionChips = useMemo(
    () =>
      POSITIVE_DOG_CONDITIONS.filter((c) =>
        shops.some((s) => shopHasConditionTag(s, c.matchLabels)),
      ).map((c) => c.chip),
    [shops],
  );

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return shops.filter((s) => {
      if (activeChip) {
        const config = POSITIVE_DOG_CONDITIONS.find((c) => c.chip === activeChip);
        if (config && !shopHasConditionTag(s, config.matchLabels)) return false;
      }
      if (q) {
        const hay =
          `${s.name} ${s.area} ${s.prefecture} ${s.station} ${s.station_label}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [shops, keyword, activeChip]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    if (shopSort === "newest") return list.sort((a, b) => b.id - a.id);
    return list.sort((a, b) => {
      const diff = (reviewCounts[b.id] ?? 0) - (reviewCounts[a.id] ?? 0);
      return diff !== 0 ? diff : b.id - a.id;
    });
  }, [filtered, shopSort, reviewCounts]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageShops = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const pageNumbers = Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1);

  const changePage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages));
  };

  const toggleChip = (chip: string) => {
    setActiveChip((prev) => (prev === chip ? null : chip));
    setPage(1);
  };

  return (
    <>
      {/* Filter */}
      <div className="px-4 md:px-10 lg:px-24 xl:px-40 pb-6">
        <div className="max-w-[1040px] mx-auto bg-white rounded-3xl shadow-[0_2px_10px_rgba(62,43,35,0.06)] border border-[rgba(62,43,35,0.06)] p-4 md:p-5 space-y-4">
          <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[rgba(62,43,35,0.14)] rounded-2xl px-3.5 py-2.5 md:py-3">
            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setPage(1);
              }}
              className="flex-1 text-[14px] text-[#3E2B23] bg-transparent outline-none placeholder:text-[#9A8578]"
              placeholder="キーワードで絞り込む"
            />
            <Search size={14} className="text-[#9A8578] shrink-0" />
          </div>

          {conditionChips.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-4">
              <ConditionBadgeRow>
                {conditionChips.map((chip) => (
                  <ConditionFilterChip
                    key={chip}
                    label={chip}
                    selected={activeChip === chip}
                    onClick={() => toggleChip(chip)}
                  />
                ))}
              </ConditionBadgeRow>
              <div className="flex flex-wrap gap-2">
                {SORT_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setShopSort(tab.id)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-semibold border transition-all ${
                      shopSort === tab.id
                        ? "bg-[#759F88] text-white border-[#759F88]"
                        : "bg-white text-[#4F856C] border-[#BFD4C8] hover:bg-[#E8F0EB]"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 md:px-10 lg:px-24 xl:px-40 pb-8">
        <div className="max-w-[1040px] mx-auto">
          <p
            className="text-[18px] md:text-[20px] font-bold text-[#3E2B23] mb-4 md:mb-6"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {resultLabel ?? `${areaLabel ?? ""}のカフェ`}{" "}
            <span className="text-[#759F88]">{filtered.length}</span>件
          </p>

          {pageShops.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-[#9A8578] text-[14px]">
              条件に合うお店が見つかりませんでした。
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-8">
                {pageShops.map((shop) => (
                  <CafeCard key={shop.id} shop={shop} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex gap-2 items-center justify-center">
                  <button
                    type="button"
                    onClick={() => changePage(currentPage - 1)}
                    className="px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-[13px] md:text-[14px] font-medium bg-[#F3E6D8] text-[#3E2B23] hover:bg-[#759F88] hover:text-white transition-colors"
                  >
                    前へ
                  </button>
                  {pageNumbers.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => changePage(p)}
                      className={`px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-[13px] md:text-[14px] font-medium transition-colors ${
                        currentPage === p
                          ? "bg-[#759F88] text-white"
                          : "bg-[#F3E6D8] text-[#3E2B23] hover:bg-[#759F88] hover:text-white"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => changePage(currentPage + 1)}
                    className="px-3 py-2 md:px-4 md:py-2.5 rounded-lg text-[13px] md:text-[14px] font-medium bg-[#F3E6D8] text-[#3E2B23] hover:bg-[#759F88] hover:text-white transition-colors"
                  >
                    次へ
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
