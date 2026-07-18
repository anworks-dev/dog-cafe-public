import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import BackToTopButton from "@/components/BackToTopButton";
import { siteUrl } from "@/lib/format";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: {
    default: "犬と行けるカフェ｜愛犬と一緒に楽しめるドッグフレンドリーなお店",
    template: "%s｜犬と行けるカフェ",
  },
  description:
    "犬と一緒に行けるカフェ・レストランを全国から探せます。店内OK・テラスOK・大型犬OK・ドッグメニューありなど、条件やエリアから愛犬とのおでかけ先を見つけられます。",
  openGraph: {
    type: "website",
    siteName: "犬と行けるカフェ",
    locale: "ja_JP",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <SiteHeader />
        <main className="min-h-[60vh] w-full overflow-x-clip">{children}</main>
        <SiteFooter />
        <BackToTopButton />
      </body>
    </html>
  );
}
