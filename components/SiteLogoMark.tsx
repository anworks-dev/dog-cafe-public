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
      className={`${config.box} bg-[#6FAA88] rounded-lg flex items-center justify-center text-white shadow-sm ${className}`}
    >
      <PawPrint size={config.icon} strokeWidth={2.5} />
    </div>
  );
}
