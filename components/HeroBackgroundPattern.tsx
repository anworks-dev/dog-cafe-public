"use client";

import { useEffect, useRef, useState } from "react";
import { Bone, Coffee, PawPrint, type LucideIcon } from "lucide-react";

const ICON_COLOR = "#6FAA88";
const ICON_OPACITY = 0.155;
const STROKE_WIDTH = 2.75;
const ICON_SIZE = 24;
/** Half-diagonal of rotated 24px icon — used to keep icons inside hero bounds. */
const ICON_SAFE_RADIUS = 14;

const ICONS: LucideIcon[] = [PawPrint, Coffee, Bone];

/** Slight rotation per slot — same variety as the original diagonal pattern. */
const ROTATIONS = [-8, 6, -5, 7, -6, 4, 5, -7, 8];

type PatternLayout = {
  cols: number;
  rows: number;
  width: number;
  height: number;
};

function measureLayout(el: HTMLElement): PatternLayout {
  const isMd = window.matchMedia("(min-width: 768px)").matches;
  const spacingX = isMd ? 92 : 60;
  const spacingY = isMd ? 76 : 60;
  const width = el.clientWidth;
  const height = el.clientHeight;
  return {
    cols: Math.max(3, Math.round(width / spacingX)),
    rows: Math.max(2, Math.round(height / spacingY)),
    width,
    height,
  };
}

function iconPosition(
  row: number,
  col: number,
  layout: PatternLayout,
): { left: string; top: string } {
  const { cols, rows, width, height } = layout;

  let leftPct = ((col + 0.5) / cols) * 100;
  let topPct = ((row + 0.5) / rows) * 100;

  if (row % 2 === 1) {
    const staggerPx = width >= 768 ? 12 : 8;
    leftPct += (staggerPx / width) * 100;
  }

  const marginXPct = (ICON_SAFE_RADIUS / width) * 100;
  const marginYPct = (ICON_SAFE_RADIUS / height) * 100;
  leftPct = Math.min(100 - marginXPct, Math.max(marginXPct, leftPct));
  topPct = Math.min(100 - marginYPct, Math.max(marginYPct, topPct));

  return {
    left: `${leftPct}%`,
    top: `${topPct}%`,
  };
}

export default function HeroBackgroundPattern() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<PatternLayout>({
    cols: 4,
    rows: 4,
    width: 390,
    height: 360,
  });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const update = () => setLayout(measureLayout(el));
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();

    const mq = window.matchMedia("(min-width: 768px)");
    mq.addEventListener("change", update);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", update);
    };
  }, []);

  const slots = layout.cols * layout.rows;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 h-full w-full overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {Array.from({ length: slots }, (_, index) => {
        const row = Math.floor(index / layout.cols);
        const col = index % layout.cols;
        const Icon = ICONS[(row + col) % 3];
        const rotation = ROTATIONS[index % ROTATIONS.length];
        const pos = iconPosition(row, col, layout);

        return (
          <div
            key={index}
            className="absolute"
            style={{
              left: pos.left,
              top: pos.top,
              transform: "translate(-50%, -50%)",
            }}
          >
            <Icon
              size={ICON_SIZE}
              strokeWidth={STROKE_WIDTH}
              color={ICON_COLOR}
              style={{
                opacity: ICON_OPACITY,
                transform: `rotate(${rotation}deg)`,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
