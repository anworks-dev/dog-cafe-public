"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function CompleteContent() {
  const params = useSearchParams();
  const type = params.get("type");

  const isRequest = type === "request";
  const isContact = type === "contact";
  const title = isContact
    ? "お問い合わせを受け付けました"
    : isRequest
      ? "掲載リクエストを受け付けました"
      : "投稿を受け付けました";
  const message = isContact
    ? "お問い合わせありがとうございます。内容を確認のうえ、必要に応じてご連絡いたします。"
    : isRequest
      ? "掲載リクエストありがとうございます。内容を確認のうえ、必要に応じてサイトに反映します。"
      : "投稿ありがとうございます。内容を確認のうえ、サイトに反映します。";

  return (
    <>
      {/* SP */}
      <div className="md:hidden flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 bg-[#ECF4EF] rounded-full" />
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="text-[32px] font-bold text-[#6FAA88] leading-none"
              style={{ paddingTop: "2px" }}
            >
              ✓
            </span>
          </div>
        </div>

        <h1
          className="text-[22px] font-extrabold text-[#3B2F25] mb-3 leading-snug"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          {title}
        </h1>
        <p className="text-[14px] text-[#9A8878] leading-relaxed mb-8 max-w-[280px]">{message}</p>

        <Link
          href="/"
          className="w-full max-w-[280px] py-3.5 bg-[#6FAA88] text-white rounded-xl text-[15px] font-bold text-center hover:bg-[#5D9876] active:scale-[0.98] transition-all shadow-sm block"
        >
          TOPに戻る
        </Link>
      </div>

      {/* PC */}
      <div className="hidden md:flex items-center justify-center py-32">
        <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(59,47,37,0.08)] p-12 w-[480px] flex flex-col items-center text-center space-y-5">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 bg-[#ECF4EF] rounded-full" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="text-[32px] font-bold text-[#6FAA88] leading-none"
                style={{ paddingTop: "2px" }}
              >
                ✓
              </span>
            </div>
          </div>

          <h1
            className="text-[24px] font-extrabold text-[#3B2F25] leading-tight"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            {title}
          </h1>
          <p className="text-[14px] text-[#9A8878] leading-relaxed">{message}</p>

          <Link
            href="/"
            className="w-full py-4 bg-[#6FAA88] text-white rounded-xl text-[15px] font-bold text-center hover:bg-[#5D9876] active:scale-[0.98] transition-all shadow-sm block mt-2"
          >
            TOPに戻る
          </Link>
        </div>
      </div>
    </>
  );
}
