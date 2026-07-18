import { PawPrint } from "lucide-react";

type Props = {
  className?: string;
};

/**
 * FV catchphrase bubble — points down toward the hero pug.
 * Shared PC / SP; size tweaks only via responsive classes.
 */
export default function HeroSpeechBubble({ className = "" }: Props) {
  return (
    <div
      className={`hero-speech-bubble pointer-events-none relative z-10 inline-flex max-w-[calc(100vw-2rem)] items-center gap-1.5 rounded-full border border-[#759F88] bg-[#759F88] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_1px_4px_rgba(62,43,35,0.06)] md:gap-2 md:px-4 md:py-1.5 md:text-[13px] ${className}`.trim()}
    >
      <PawPrint
        size={12}
        strokeWidth={2.5}
        className="h-3 w-3 shrink-0 text-white md:h-[13px] md:w-[13px]"
        aria-hidden
      />
      <span className="whitespace-nowrap tracking-tight">犬と一緒に、おでかけしよう</span>
      {/* Tip — same green as bubble, points down toward pug */}
      <span
        aria-hidden
        className="absolute left-1/2 top-full -translate-x-1/2 border-x-[6px] border-t-[7px] border-x-transparent border-t-[#759F88]"
      />
    </div>
  );
}
