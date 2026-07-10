"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Star, Camera, AlertCircle } from "lucide-react";
import { shopDetailPath } from "@/lib/format";
import { createReview, isSupabaseConfigured } from "@/lib/submissions";
import type { Shop } from "@/lib/types";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-[13px] font-bold text-[#3B2F25]">
      {children}
      {required && <span className="text-[#E0784A] ml-0.5">*</span>}
    </p>
  );
}

function TextInput({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 text-[13px] md:text-[14px] text-[#3B2F25] bg-white border border-[rgba(59,47,37,0.15)] rounded-xl outline-none focus:border-[#6FAA88] focus:ring-2 focus:ring-[#6FAA88]/15 placeholder:text-[#B8AEA8] transition-all"
    />
  );
}

function DateInput({
  value,
  onChange,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  max: string;
}) {
  return (
    <input
      type="date"
      value={value}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-2.5 text-[13px] md:text-[14px] text-[#3B2F25] bg-white border border-[rgba(59,47,37,0.15)] rounded-xl outline-none focus:border-[#6FAA88] focus:ring-2 focus:ring-[#6FAA88]/15 transition-all [color-scheme:light]"
    />
  );
}

function RadioGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-5 md:gap-8 flex-wrap">
      {options.map((opt) => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer group">
          <div
            onClick={() => onChange(opt)}
            className={`w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
              value === opt
                ? "border-[#6FAA88] bg-[#6FAA88]"
                : "border-[rgba(59,47,37,0.25)] bg-white group-hover:border-[#6FAA88]"
            }`}
          >
            {value === opt && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
          <span className="text-[13px] md:text-[14px] text-[#3B2F25] font-medium">{opt}</span>
        </label>
      ))}
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1 items-center px-3 py-2 bg-white border border-[rgba(59,47,37,0.15)] rounded-xl w-fit">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          onMouseEnter={() => setHover(i)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            size={22}
            className={
              (hover || value) >= i ? "text-[#F2C255] fill-[#F2C255]" : "text-[#EDE6DE] fill-[#EDE6DE]"
            }
          />
        </button>
      ))}
      {value > 0 && (
        <span className="text-[13px] font-medium text-[#9A8878] ml-1">
          {["", "もう少し", "普通", "良い", "とても良い", "最高！"][value]}
        </span>
      )}
    </div>
  );
}

export default function ReviewForm({ shop }: { shop: Shop }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [posterName, setPosterName] = useState("");
  const [dogSize, setDogSize] = useState("");
  const [location, setLocation] = useState("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date());
  const shopPath = shopDetailPath(shop);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!dogSize) errs.push("犬のサイズを選択してください");
    if (!location) errs.push("利用場所を選択してください");
    if (!rating) errs.push("同伴しやすさを選択してください");
    if (!comment.trim()) errs.push("コメントを入力してください");
    if (!isSupabaseConfigured())
      errs.push("データベース接続が設定されていません。管理者にお問い合わせください。");
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setErrors([]);
    try {
      await createReview({
        cafe_id: shop.id,
        shop_name: shop.name,
        reviewer_name: posterName.trim() || null,
        visited_at: date || null,
        dog_size: dogSize,
        seat_location: location,
        rating,
        comment,
      });
      router.push("/complete");
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[ReviewForm] submit failed:", err);
      }
      setErrors(["送信に失敗しました。時間をおいて再度お試しください。"]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="md:hidden">
        <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5">
          <h1
            className="text-[20px] font-extrabold text-[#3B2F25]"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            口コミを投稿する
          </h1>

          <div className="space-y-1.5">
            <FieldLabel>対象店舗</FieldLabel>
            <div className="px-3 py-2.5 bg-[#EDE6DE] rounded-xl text-[13px] font-bold text-[#3B2F25]">
              {shop.name}
            </div>
          </div>

          <div className="flex gap-2.5 p-3 bg-[#FFFBEB] rounded-xl border border-[#FCD34D]">
            <AlertCircle size={15} className="text-[#B45309] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#92400E] leading-relaxed">
              ※ 口コミ内容は公開されます。個人情報の記載はお控えください。
            </p>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>利用日（任意）</FieldLabel>
            <DateInput value={date} onChange={setDate} max={today} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>投稿者名（任意）</FieldLabel>
            <TextInput
              placeholder="未入力の場合は「匿名」で表示されます"
              value={posterName}
              onChange={setPosterName}
            />
          </div>

          <div className="space-y-2.5">
            <FieldLabel required>犬のサイズ</FieldLabel>
            <RadioGroup
              options={["小型犬", "中型犬", "大型犬"]}
              value={dogSize}
              onChange={setDogSize}
            />
          </div>

          <div className="space-y-2.5">
            <FieldLabel required>利用場所</FieldLabel>
            <RadioGroup options={["店内", "テラス"]} value={location} onChange={setLocation} />
          </div>

          <div className="space-y-2.5">
            <FieldLabel required>同伴しやすさ</FieldLabel>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>コメント</FieldLabel>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="カフェの雰囲気や愛犬との過ごし方など、感じたことをご記入ください"
              rows={4}
              className="w-full px-3 py-2.5 text-[13px] text-[#3B2F25] bg-white border border-[rgba(59,47,37,0.15)] rounded-xl outline-none focus:border-[#6FAA88] focus:ring-2 focus:ring-[#6FAA88]/15 placeholder:text-[#B8AEA8] resize-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>写真（任意）</FieldLabel>
            <button
              type="button"
              className="w-full h-[60px] bg-white border border-dashed border-[rgba(59,47,37,0.2)] rounded-xl flex items-center justify-center gap-2 text-[13px] text-[#9A8878] hover:border-[#6FAA88] hover:text-[#6FAA88] transition-colors"
            >
              <Camera size={16} />
              写真を追加（任意）
            </button>
          </div>

          {errors.length > 0 && (
            <div className="p-3 bg-[#FFF3EB] rounded-xl border border-[#F5D5C0] space-y-1">
              {errors.map((e) => (
                <p key={e} className="text-[12px] text-[#C05A25]">
                  ・{e}
                </p>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3.5 bg-[#6FAA88] text-white rounded-xl text-[15px] font-bold hover:bg-[#5D9876] active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "送信中..." : "口コミを投稿する"}
          </button>

          <Link
            href={shopPath}
            className="block text-center text-[13px] text-[#6FAA88] hover:text-[#4A9070] transition-colors"
          >
            ← 店舗ページに戻る
          </Link>
        </form>
      </div>

      <div className="hidden md:block py-16">
        <form
          onSubmit={handleSubmit}
          className="max-w-[720px] mx-auto bg-white rounded-2xl shadow-[0_2px_16px_rgba(59,47,37,0.08)] p-10 space-y-6"
        >
          <h1
            className="text-[24px] font-extrabold text-[#3B2F25]"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            口コミを投稿する
          </h1>

          <div className="space-y-1.5">
            <FieldLabel>対象店舗</FieldLabel>
            <div className="px-3 py-3 bg-[#EDE6DE] rounded-xl text-[14px] font-bold text-[#3B2F25]">
              {shop.name}
            </div>
          </div>

          <div className="flex gap-2.5 p-3.5 bg-[#FFFBEB] rounded-xl border border-[#FCD34D]">
            <AlertCircle size={16} className="text-[#B45309] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#92400E] leading-relaxed">
              ※ 口コミ内容は公開されます。個人情報の記載はお控えください。
            </p>
          </div>

          <div className="max-w-[280px] space-y-1.5">
            <FieldLabel>利用日（任意）</FieldLabel>
            <DateInput value={date} onChange={setDate} max={today} />
          </div>

          <div className="max-w-[400px] space-y-1.5">
            <FieldLabel>投稿者名（任意）</FieldLabel>
            <TextInput
              placeholder="未入力の場合は「匿名」で表示されます"
              value={posterName}
              onChange={setPosterName}
            />
          </div>

          <div className="space-y-3">
            <FieldLabel required>犬のサイズ</FieldLabel>
            <RadioGroup
              options={["小型犬", "中型犬", "大型犬"]}
              value={dogSize}
              onChange={setDogSize}
            />
          </div>

          <div className="space-y-3">
            <FieldLabel required>利用場所</FieldLabel>
            <RadioGroup options={["店内", "テラス"]} value={location} onChange={setLocation} />
          </div>

          <div className="space-y-3">
            <FieldLabel required>同伴しやすさ</FieldLabel>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>コメント</FieldLabel>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="カフェの雰囲気や愛犬との過ごし方など、感じたことをご記入ください"
              rows={5}
              className="w-full px-3 py-3 text-[14px] text-[#3B2F25] bg-white border border-[rgba(59,47,37,0.15)] rounded-xl outline-none focus:border-[#6FAA88] focus:ring-2 focus:ring-[#6FAA88]/15 placeholder:text-[#B8AEA8] resize-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>写真（任意）</FieldLabel>
            <button
              type="button"
              className="w-full h-[70px] bg-white border border-dashed border-[rgba(59,47,37,0.2)] rounded-xl flex items-center justify-center gap-2 text-[14px] text-[#9A8878] hover:border-[#6FAA88] hover:text-[#6FAA88] transition-colors"
            >
              <Camera size={18} />
              写真を追加（任意）
            </button>
          </div>

          {errors.length > 0 && (
            <div className="p-4 bg-[#FFF3EB] rounded-xl border border-[#F5D5C0] space-y-1">
              {errors.map((e) => (
                <p key={e} className="text-[12px] text-[#C05A25]">
                  ・{e}
                </p>
              ))}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 bg-[#6FAA88] text-white rounded-xl text-[15px] font-bold hover:bg-[#5D9876] active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "送信中..." : "口コミを投稿する"}
          </button>

          <div className="text-center">
            <Link
              href={shopPath}
              className="text-[13px] text-[#6FAA88] hover:text-[#4A9070] transition-colors"
            >
              ← 店舗ページに戻る
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
