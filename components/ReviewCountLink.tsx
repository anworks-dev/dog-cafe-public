"use client";

type ReviewCountLinkProps = {
  count: number;
  variant: "sp" | "pc";
};

export default function ReviewCountLink({ count, variant }: ReviewCountLinkProps) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();

    const sections = document.querySelectorAll<HTMLElement>("[data-reviews-section]");
    const target = window.matchMedia("(min-width: 768px)").matches
      ? sections[1]
      : sections[0];

    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", "#reviews");
  };

  return (
    <a
      href="#reviews"
      onClick={handleClick}
      className={`text-[#9A8878] hover:text-[#6A5E54] hover:underline underline-offset-2 transition-colors ${
        variant === "sp" ? "text-[12px]" : "text-[13px]"
      }`}
    >
      口コミ{count}件
    </a>
  );
}
