import { PawPrint } from "lucide-react";

type Props = {
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function SiteLogoMark({ size = "md", className = "" }: Props) {
  const config = {
    sm: { box: "w-6 h-6", icon: 12 },
    md: { box: "w-7 h-7", icon: 14 },
    lg: { box: "w-8 h-8", icon: 17 },
  }[size];

  return (
    <div
      className={`${config.box} bg-[#759F88] rounded-xl flex items-center justify-center text-white shadow-[0_1px_3px_rgba(62,43,35,0.08)] ${className}`}
    >
      <PawPrint size={config.icon} strokeWidth={2.5} />
    </div>
  );
}
