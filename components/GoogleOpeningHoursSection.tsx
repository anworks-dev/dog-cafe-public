import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  formatOpeningStatus,
  openingHoursLines,
  type GooglePlaceOpeningHours,
} from "@/lib/google-places";

type GoogleOpeningHoursSectionProps = {
  details: GooglePlaceOpeningHours | null;
  fetchFailed?: boolean;
};

function GoogleMapsAttribution() {
  return (
    <p className="text-[11px] text-[#B8AEA8]">情報提供：Google マップ</p>
  );
}

export default function GoogleOpeningHoursSection({
  details,
  fetchFailed = false,
}: GoogleOpeningHoursSectionProps) {
  const status = details ? formatOpeningStatus(details) : null;
  const lines = details ? openingHoursLines(details) : [];
  const hasHours = lines.length > 0;
  const mapsUri = details?.googleMapsUri?.trim();

  if (fetchFailed || !details || (!hasHours && !status)) {
    return (
      <section
        id="opening-hours"
        className="bg-white rounded-2xl border border-[rgba(59,47,37,0.1)] p-5 space-y-3 scroll-mt-24"
      >
        <div className="space-y-1">
          <h2
            className="text-[16px] font-bold text-[#3E2B23]"
            style={{ fontFamily: "Nunito, sans-serif" }}
          >
            営業時間
          </h2>
          <GoogleMapsAttribution />
        </div>
        <p className="text-[14px] text-[#3E2B23] leading-relaxed">
          営業時間は店舗へ直接ご確認ください
        </p>
        {mapsUri && (
          <Link
            href={mapsUri}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[13px] text-[#759F88] hover:text-[#4F856C] transition-colors"
          >
            <ExternalLink size={12} />
            Google Mapsで確認
          </Link>
        )}
      </section>
    );
  }

  return (
    <section
      id="opening-hours"
      className="bg-white rounded-2xl border border-[rgba(59,47,37,0.1)] p-5 space-y-3 scroll-mt-24"
    >
      <div className="space-y-1">
        <h2
          className="text-[16px] font-bold text-[#3E2B23]"
          style={{ fontFamily: "Nunito, sans-serif" }}
        >
          営業時間
        </h2>
        <GoogleMapsAttribution />
      </div>

      {status && (
        <p
          className={`text-[14px] font-semibold ${
            status.startsWith("営業中")
              ? "text-[#4F856C]"
              : status === "営業時間外" || status.includes("休")
                ? "text-[#9A8578]"
                : "text-[#3E2B23]"
          }`}
        >
          {status}
        </p>
      )}

      {hasHours ? (
        <ul className="space-y-0.5 text-[14px] text-[#3E2B23] leading-relaxed">
          {lines.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="text-[14px] text-[#3E2B23] leading-relaxed">
          営業時間は店舗へ直接ご確認ください
        </p>
      )}

      <p className="text-[12px] text-[#9A8578] leading-relaxed">
        営業時間・営業状況は変更される場合があります。
        {mapsUri ? "Google Mapsで最新情報を確認" : "最新情報は店舗へご確認ください"}
      </p>

      {mapsUri && (
        <Link
          href={mapsUri}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[13px] text-[#759F88] hover:text-[#4F856C] transition-colors"
        >
          <ExternalLink size={12} />
          Google Mapsで確認
        </Link>
      )}
    </section>
  );
}
