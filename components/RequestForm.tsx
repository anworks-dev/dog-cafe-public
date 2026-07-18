"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Check } from "lucide-react";
import { createListingRequest, isSupabaseConfigured } from "@/lib/submissions";

const CONDITIONS = ["店内OK", "テラスOK", "大型犬OK", "ドッグメニューあり", "駐車場あり", "雨の日OK"];

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-[13px] md:text-[14px] font-semibold text-[#3E2B23]">
      {children}
      {required && <span className="text-[#E0784A] ml-0.5">*</span>}
    </p>
  );
}

function TextInput({
  placeholder,
  value,
  onChange,
  type = "text",
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2.5 md:py-3 text-[13px] md:text-[14px] text-[#3E2B23] bg-[#FAF7F2] border border-[rgba(62,43,35,0.15)] rounded-xl outline-none focus:border-[#759F88] focus:ring-2 focus:ring-[#759F88]/15 placeholder:text-[#B8AEA8] transition-all"
    />
  );
}

export default function RequestForm() {
  const router = useRouter();

  const [shopName, setShopName] = useState("");
  const [address, setAddress] = useState("");
  const [pref, setPref] = useState("");
  const [refUrl, setRefUrl] = useState("");
  const [spComment, setSpComment] = useState("");

  const [area, setArea] = useState("");
  const [station, setStation] = useState("");
  const [conditions, setConditions] = useState<Set<string>>(new Set());
  const [siteUrlValue, setSiteUrlValue] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [comment, setComment] = useState("");
  const [posterName, setPosterName] = useState("");
  const [email, setEmail] = useState("");

  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleCondition = (c: string) =>
    setConditions((prev) => {
      const n = new Set(prev);
      if (n.has(c)) n.delete(c);
      else n.add(c);
      return n;
    });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!shopName.trim()) errs.push("店舗名を入力してください");
    if (!pref.trim()) errs.push("都道府県を入力してください");
    if (!isSupabaseConfigured())
      errs.push("データベース接続が設定されていません。管理者にお問い合わせください。");
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setErrors([]);
    try {
      await createListingRequest({
        shop_name: shopName,
        prefecture: pref,
        area: area || null,
        address: address || null,
        station: station || null,
        conditions: Array.from(conditions),
        reference_url: refUrl || null,
        site_url: siteUrlValue || null,
        map_url: mapUrl || null,
        comment: comment || spComment || null,
        poster_name: posterName || null,
        email: email || null,
      });
      router.push("/complete?type=request");
    } catch {
      setErrors(["送信に失敗しました。時間をおいて再度お試しください。"]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* SP */}
      <div className="md:hidden">
        <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5">
          <div>
            <h1
              className="text-[20px] font-extrabold text-[#3E2B23] mb-1"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              掲載リクエスト
            </h1>
            <p className="text-[13px] text-[#9A8578] leading-relaxed">
              掲載してほしいカフェの情報をお知らせください。運営が確認のうえ掲載を検討します。
            </p>
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>店舗名</FieldLabel>
            <TextInput placeholder="例）カフェ・ドッグハウス" value={shopName} onChange={setShopName} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>住所またはエリア</FieldLabel>
            <TextInput placeholder="例）東京都渋谷区神宮前1-2-3" value={address} onChange={setAddress} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>都道府県</FieldLabel>
            <TextInput placeholder="例）東京都" value={pref} onChange={setPref} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>参考URL（任意）</FieldLabel>
            <TextInput placeholder="例）https://example.com" value={refUrl} onChange={setRefUrl} type="url" />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>補足コメント（任意）</FieldLabel>
            <textarea
              value={spComment}
              onChange={(e) => setSpComment(e.target.value)}
              placeholder="メニューの特徴やおすすめポイントなど"
              rows={4}
              className="w-full px-3 py-2.5 text-[13px] text-[#3E2B23] bg-[#FAF7F2] border border-[rgba(62,43,35,0.15)] rounded-xl outline-none focus:border-[#759F88] focus:ring-2 focus:ring-[#759F88]/15 placeholder:text-[#B8AEA8] resize-none transition-all"
            />
          </div>

          <div className="px-3 py-2.5 bg-[#FAF7F2] border border-[rgba(62,43,35,0.1)] rounded-xl">
            <p className="text-[12px] text-[#9A8578]">送信内容は運営のみが確認します</p>
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
            className="w-full py-3.5 rounded-2xl text-[15px] bg-[#E0784A] text-white font-bold hover:bg-[#CC6A3D] cta-elevated disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "送信中..." : "掲載リクエストを送る"}
          </button>

          <Link
            href="/"
            className="block text-center text-[13px] text-[#759F88] hover:text-[#4F856C] transition-colors"
          >
            ← TOPに戻る
          </Link>
        </form>
      </div>

      {/* PC */}
      <div className="hidden md:block py-16">
        <form
          onSubmit={handleSubmit}
          className="max-w-[800px] mx-auto bg-white rounded-2xl shadow-[0_2px_16px_rgba(62,43,35,0.08)] p-10 space-y-6"
        >
          <div>
            <h1
              className="text-[24px] font-extrabold text-[#3E2B23] mb-2"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              掲載してほしいお店を知らせる
            </h1>
            <p className="text-[13px] text-[#9A8578] leading-relaxed">
              掲載してほしいカフェの情報をお知らせください。運営が内容を確認のうえ、掲載を検討いたします。
            </p>
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>店舗名</FieldLabel>
            <TextInput placeholder="例）カフェ・ドッグハウス" value={shopName} onChange={setShopName} />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <FieldLabel required>都道府県</FieldLabel>
              <TextInput placeholder="例）東京都" value={pref} onChange={setPref} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel required>エリア</FieldLabel>
              <TextInput placeholder="例）渋谷区" value={area} onChange={setArea} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <FieldLabel>住所（任意）</FieldLabel>
              <TextInput placeholder="例）東京都渋谷区神宮前1-2-3" value={address} onChange={setAddress} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>最寄駅（任意）</FieldLabel>
              <TextInput placeholder="例）表参道駅 徒歩5分" value={station} onChange={setStation} />
            </div>
          </div>

          <div className="space-y-3">
            <FieldLabel>対応している条件（あてはまるものを選択）</FieldLabel>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {CONDITIONS.slice(0, 3).map((c) => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => toggleCondition(c)}
                      className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-all ${
                        conditions.has(c)
                          ? "border-[#759F88] bg-[#759F88]"
                          : "border-[rgba(62,43,35,0.25)] bg-white group-hover:border-[#759F88]"
                      }`}
                    >
                      {conditions.has(c) && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-[14px] text-[#3E2B23] font-medium">{c}</span>
                  </label>
                ))}
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-3">
                {CONDITIONS.slice(3).map((c) => (
                  <label key={c} className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => toggleCondition(c)}
                      className={`w-[18px] h-[18px] rounded-[4px] border-2 flex items-center justify-center transition-all ${
                        conditions.has(c)
                          ? "border-[#759F88] bg-[#759F88]"
                          : "border-[rgba(62,43,35,0.25)] bg-white group-hover:border-[#759F88]"
                      }`}
                    >
                      {conditions.has(c) && <Check size={11} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="text-[14px] text-[#3E2B23] font-medium">{c}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <FieldLabel>公式サイトURL（任意）</FieldLabel>
            <TextInput placeholder="例）https://example.com" value={siteUrlValue} onChange={setSiteUrlValue} type="url" />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>Google Map URL（任意）</FieldLabel>
            <TextInput placeholder="例）https://maps.google.com/..." value={mapUrl} onChange={setMapUrl} type="url" />
          </div>

          <div className="space-y-1.5">
            <FieldLabel>コメント（任意）</FieldLabel>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="メニューの特徴やおすすめポイントなど"
              rows={4}
              className="w-full px-3 py-3 text-[14px] text-[#3E2B23] bg-[#FAF7F2] border border-[rgba(62,43,35,0.15)] rounded-xl outline-none focus:border-[#759F88] focus:ring-2 focus:ring-[#759F88]/15 placeholder:text-[#B8AEA8] resize-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <FieldLabel>投稿者名（任意）</FieldLabel>
              <TextInput placeholder="例）わんこ好き太郎" value={posterName} onChange={setPosterName} />
            </div>
            <div className="space-y-1.5">
              <FieldLabel>メールアドレス（任意）</FieldLabel>
              <TextInput placeholder="例）example@mail.com" value={email} onChange={setEmail} type="email" />
            </div>
          </div>

          <div className="flex gap-2.5 p-3.5 bg-[#FFFBEB] rounded-xl border border-[#FCD34D]">
            <AlertCircle size={16} className="text-[#B45309] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#92400E] leading-relaxed">
              ※ 送信内容は運営のみが確認します。掲載可否についての個別のご連絡は行っておりません。
            </p>
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
            className="w-full py-4 rounded-2xl text-[15px] bg-[#E0784A] text-white font-bold hover:bg-[#CC6A3D] cta-elevated disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "送信中..." : "掲載リクエストを送る"}
          </button>

          <div className="text-center">
            <Link href="/" className="text-[13px] text-[#759F88] hover:text-[#4F856C] transition-colors">
              ← TOPに戻る
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
