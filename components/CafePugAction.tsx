import Link from "next/link";

type Props = {
  label: string;
  href: string;
  /** Optional override for screen readers; defaults to label. */
  ariaLabel?: string;
};

/**
 * Pug + orange speech bubble CTA (face-only asset).
 * Positioning is provided by FloatingActions — this piece is not fixed alone.
 */
export default function CafePugAction({ label, href, ariaLabel }: Props) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      className="group flex flex-col items-center outline-none
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#E0784A]
        active:scale-[0.98] transition-transform"
    >
      <span
        className="relative mb-4 inline-flex max-w-[9.5rem] items-center justify-center rounded-full
          border-2 border-white bg-[#E0784A] px-2.5 py-1
          text-[11px] md:text-[12px] font-bold text-white leading-tight text-center whitespace-nowrap
          shadow-[0_2px_8px_rgba(62,43,35,0.12)]
          md:mb-4 md:px-3 md:max-w-none"
      >
        {label}
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-full -translate-x-1/2
            border-x-[7px] border-t-[8px] border-x-transparent border-t-white"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-full -mt-px -translate-x-1/2
            border-x-[5px] border-t-[6px] border-x-transparent border-t-[#E0784A]"
        />
      </span>

      <img
        src="/images/pug-face.png"
        alt=""
        aria-hidden="true"
        width={70}
        height={54}
        draggable={false}
        className="pointer-events-none h-auto w-[56px] select-none object-contain md:w-[70px]"
      />
    </Link>
  );
}
