import type { ReactNode } from "react";
import type { ShopTag } from "@/lib/types";
import {
  CONDITION_BADGE_GAP,
  CONDITION_BADGE_GAP_COMPACT,
  conditionBadgeClass,
  conditionFilterChipClass,
  type ConditionBadgeSize,
} from "@/lib/shop-tags";

type DisplayProps = {
  label: string;
  fallbackV?: ShopTag["v"];
  /** `compact` = SP cafe cards only; PC/detail/filters stay `default`. */
  size?: ConditionBadgeSize;
  className?: string;
};

/** Non-interactive condition badge (cards / shop detail). */
export function ConditionBadge({
  label,
  fallbackV,
  size = "default",
  className = "",
}: DisplayProps) {
  return (
    <span className={`${conditionBadgeClass(label, fallbackV, size)} ${className}`.trim()}>
      {label}
    </span>
  );
}

type FilterProps = {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
};

/** Interactive filter chip (TOP FV / list page). Same pill shape as ConditionBadge. */
export function ConditionFilterChip({
  label,
  selected,
  onClick,
  className = "",
}: FilterProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${conditionFilterChipClass(selected)} ${className}`.trim()}
    >
      {label}
    </button>
  );
}

export function ConditionBadgeRow({
  children,
  size = "default",
  className = "",
}: {
  children: ReactNode;
  size?: ConditionBadgeSize;
  className?: string;
}) {
  const gap = size === "compact" ? CONDITION_BADGE_GAP_COMPACT : CONDITION_BADGE_GAP;
  return <div className={`flex flex-wrap ${gap} ${className}`.trim()}>{children}</div>;
}
