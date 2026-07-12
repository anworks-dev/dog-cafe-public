/** Japan prefectures in geographic north-to-south order. */
export const PREFECTURE_ORDER = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
] as const;

const orderIndex = new Map<string, number>(
  PREFECTURE_ORDER.map((name, index) => [name, index]),
);

/** Index in fixed order; unknown labels sort after all known prefectures. */
export function prefectureOrderIndex(label: string): number {
  return orderIndex.get(label) ?? PREFECTURE_ORDER.length;
}

export function sortByPrefectureOrder<T extends { label: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const diff = prefectureOrderIndex(a.label) - prefectureOrderIndex(b.label);
    if (diff !== 0) return diff;
    return a.label.localeCompare(b.label, "ja");
  });
}
