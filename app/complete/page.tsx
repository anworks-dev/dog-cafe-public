import type { Metadata } from "next";
import { Suspense } from "react";
import CompleteContent from "@/components/CompleteContent";

export const metadata: Metadata = {
  title: "送信完了",
  robots: { index: false, follow: false },
};

export default function CompletePage() {
  return (
    <Suspense fallback={null}>
      <CompleteContent />
    </Suspense>
  );
}
