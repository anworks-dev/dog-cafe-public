import Link from "next/link";

export default function NotFound() {
  return (
    <div className="px-4 md:px-10 py-20 md:py-28 text-center flex flex-col items-center gap-5">
      <h1
        className="text-[22px] md:text-[28px] font-extrabold text-[#3B2F25]"
        style={{ fontFamily: "Nunito, sans-serif" }}
      >
        ページが見つかりません
      </h1>
      <p className="text-[14px] text-[#6A5E54] leading-relaxed">
        お探しのページは削除されたか、URLが変更された可能性があります。
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 px-6 py-3 bg-[#6FAA88] text-white rounded-xl text-[14px] font-bold hover:bg-[#5D9876] active:scale-[0.98] transition-all shadow-sm"
      >
        ホームに戻る
      </Link>
    </div>
  );
}
