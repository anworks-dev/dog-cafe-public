"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ChevronDown } from "lucide-react";
import { createContactInquiry, isSupabaseConfigured } from "@/lib/submissions";

const INQUIRY_TYPES = [
  "掲載情報の修正依頼",
  "口コミ・投稿に関するご相談",
  "掲載リクエスト",
  "サイトの不具合・改善要望",
  "その他",
];

const CORRECTION_INQUIRY_TYPE = "掲載情報の修正依頼";

function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <p className="text-[13px] md:text-[14px] font-semibold text-[#3B2F25]">
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
      className="w-full px-3 py-2.5 md:py-3 text-[13px] md:text-[13px] text-[#3B2F25] bg-[#FAF8F4] border border-[rgba(59,47,37,0.15)] rounded-xl outline-none focus:border-[#6FAA88] focus:ring-2 focus:ring-[#6FAA88]/15 placeholder:text-[#B8AEA8] transition-all"
    />
  );
}

export default function ContactForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState(() =>
    searchParams.get("type") === "correction" ? CORRECTION_INQUIRY_TYPE : "",
  );
  const [message, setMessage] = useState("");
  const [typeOpen, setTypeOpen] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    if (!name.trim()) errs.push("お名前を入力してください");
    if (!email.trim()) errs.push("メールアドレスを入力してください");
    if (!type) errs.push("お問い合わせ種別を選択してください");
    if (!message.trim()) errs.push("お問い合わせ内容を入力してください");
    if (!isSupabaseConfigured())
      errs.push("データベース接続が設定されていません。管理者にお問い合わせください。");
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setErrors([]);
    try {
      await createContactInquiry({ name, email, inquiry_type: type, message });
      router.push("/complete?type=contact");
    } catch {
      setErrors(["送信に失敗しました。時間をおいて再度お試しください。"]);
    } finally {
      setSubmitting(false);
    }
  };

  const SelectField = () => (
    <div className="relative">
      <button
        type="button"
        onClick={() => setTypeOpen(!typeOpen)}
        className="w-full flex items-center justify-between px-3 py-3 text-[13px] bg-[#FAF8F4] border border-[rgba(59,47,37,0.15)] rounded-xl hover:border-[#6FAA88] transition-colors"
      >
        <span className={type ? "text-[#3B2F25]" : "text-[#B8AEA8]"}>{type || "選択してください"}</span>
        <ChevronDown
          size={14}
          className={`text-[#9A8878] transition-transform ${typeOpen ? "rotate-180" : ""}`}
        />
      </button>
      {typeOpen && (
        <div className="absolute top-full left-0 right-0 z-20 bg-white border border-[rgba(59,47,37,0.12)] rounded-xl shadow-lg mt-1 overflow-hidden">
          {INQUIRY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setType(t);
                setTypeOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 text-[13px] hover:bg-[#ECF4EF] transition-colors ${
                type === t ? "text-[#6FAA88] font-semibold bg-[#ECF4EF]" : "text-[#3B2F25]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* SP */}
      <div className="md:hidden">
        <form onSubmit={handleSubmit} className="px-4 py-5 space-y-5">
          <div>
            <h1
              className="text-[20px] font-extrabold text-[#3B2F25] mb-1"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              お問い合わせ
            </h1>
            <p className="text-[13px] text-[#9A8878] leading-relaxed">
              サイトに関するご質問・ご要望などがございましたら、以下のフォームよりお気軽にご連絡ください。
            </p>
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>お名前</FieldLabel>
            <TextInput placeholder="例）山田 太郎" value={name} onChange={setName} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>メールアドレス</FieldLabel>
            <TextInput placeholder="例）example@mail.com" value={email} onChange={setEmail} type="email" />
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>お問い合わせ種別</FieldLabel>
            <SelectField />
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>お問い合わせ内容</FieldLabel>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="お問い合わせ内容をご記入ください"
              rows={5}
              className="w-full px-3 py-2.5 text-[13px] text-[#3B2F25] bg-white border border-[rgba(59,47,37,0.15)] rounded-xl outline-none focus:border-[#6FAA88] focus:ring-2 focus:ring-[#6FAA88]/15 placeholder:text-[#B8AEA8] resize-none transition-all"
            />
          </div>

          <div className="px-3 py-2.5 bg-[#FAF8F4] border border-[rgba(59,47,37,0.1)] rounded-xl">
            <p className="text-[12px] text-[#9A8878] leading-relaxed">
              送信いただいた内容について、確認のためご返信までお時間をいただく場合がございます。
            </p>
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
            {submitting ? "送信中..." : "送信する"}
          </button>
        </form>
      </div>

      {/* PC */}
      <div className="hidden md:block py-16">
        <form
          onSubmit={handleSubmit}
          className="max-w-[800px] mx-auto bg-white rounded-2xl shadow-[0_2px_16px_rgba(59,47,37,0.08)] p-10 space-y-6"
        >
          <div>
            <h1
              className="text-[24px] font-extrabold text-[#3B2F25] mb-2"
              style={{ fontFamily: "Nunito, sans-serif" }}
            >
              お問い合わせ
            </h1>
            <p className="text-[13px] text-[#9A8878] leading-relaxed">
              サイトに関するご質問・ご要望などがございましたら、以下のフォームよりお気軽にご連絡ください。
            </p>
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>お名前</FieldLabel>
            <TextInput placeholder="例）山田 太郎" value={name} onChange={setName} />
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>メールアドレス</FieldLabel>
            <TextInput placeholder="例）example@mail.com" value={email} onChange={setEmail} type="email" />
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>お問い合わせ種別</FieldLabel>
            <SelectField />
          </div>

          <div className="space-y-1.5">
            <FieldLabel required>お問い合わせ内容</FieldLabel>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="お問い合わせ内容をご記入ください"
              rows={6}
              className="w-full px-3 py-3 text-[13px] text-[#3B2F25] bg-[#FAF8F4] border border-[rgba(59,47,37,0.15)] rounded-xl outline-none focus:border-[#6FAA88] focus:ring-2 focus:ring-[#6FAA88]/15 placeholder:text-[#B8AEA8] resize-none transition-all"
            />
          </div>

          <div className="flex gap-2.5 p-3.5 bg-[#FFFBEB] rounded-xl border border-[#FCD34D]">
            <AlertCircle size={15} className="text-[#B45309] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#92400E] leading-relaxed">
              送信いただいた内容について、確認のためご返信までお時間をいただく場合がございます。
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
            className="w-full py-4 bg-[#6FAA88] text-white rounded-xl text-[15px] font-bold hover:bg-[#5D9876] active:scale-[0.98] transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {submitting ? "送信中..." : "送信する"}
          </button>
        </form>
      </div>
    </>
  );
}
