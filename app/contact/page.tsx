import type { Metadata } from "next";
import { Suspense } from "react";
import ContactForm from "@/components/ContactForm";
import { siteUrl } from "@/lib/format";

export const metadata: Metadata = {
  title: "お問い合わせ",
  description:
    "犬と行けるカフェへのお問い合わせページです。掲載情報の修正依頼、店舗関係者からのご連絡、不具合報告などはこちらからお送りください。",
  alternates: { canonical: `${siteUrl()}/contact` },
};

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactForm />
    </Suspense>
  );
}
