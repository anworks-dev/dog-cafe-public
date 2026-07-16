# dog-cafe-public

犬と行けるカフェの**公開サイト（読み取り専用）**です。SEO 目的で Next.js（App Router）で構築しています。

> 管理画面・口コミ管理・写真管理・店舗管理・通知メールは、別プロジェクトの `dog-cafe-site`（Vite）側で行います。本プロジェクトはそれらを一切変更しません。

## 構成

- **Next.js 15 / App Router / React 19**
- Supabase の **anon（読み取り専用）** で既存 DB に接続
  - `shops.status = 'published'`
  - `reviews.status = 'approved'`
  - `review_photos.is_visible = true`
  - のみを表示（RLS 前提）
- `next/image` で Supabase Storage の画像を最適化
- ISR（`revalidate = 300`）で自動更新

## ページ

| パス | 内容 |
| --- | --- |
| `/` | TOP（都道府県・エリア・条件での検索、おすすめ店舗） |
| `/list` | 全国の店舗一覧 |
| `/{prefectureSlug}` | 都道府県別の店舗一覧 |
| `/{prefectureSlug}/{areaSlug}` | 都道府県＋エリア別の店舗一覧 |
| `/{prefectureSlug}/{areaSlug}/{shopSlug}` | 店舗詳細（動的 metadata / OGP / canonical / LocalBusiness・BreadcrumbList） |
| `/cafes/[slug]` | 旧店舗詳細 URL（正式パスへ永続リダイレクト） |
| `/sitemap.xml` | サイトマップ（都道府県・エリア・店舗を自動生成） |
| `/robots.txt` | robots |

### 旧URLのリダイレクト（301）

| 旧 | 新 |
| --- | --- |
| `/?pref=aichi` | `/aichi` |
| `/?pref=aichi&area=岡崎` | `/aichi/okazaki` |
| `/list?prefecture=aichi` | `/aichi` |
| `/areas/aichi` | `/aichi` |
| `/area/okazaki` | `/aichi/okazaki` |

## セットアップ

```bash
cp .env.example .env.local   # 値を設定
npm install
npm run dev                  # http://localhost:3000
```

### 環境変数（`.env.local`）

```
NEXT_PUBLIC_SITE_URL=https://（公開ドメイン）
NEXT_PUBLIC_SUPABASE_URL=https://（プロジェクトID）.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（anon key）
```

`SUPABASE_SERVICE_ROLE_KEY` や `RESEND_API_KEY` などのサーバー秘密鍵は**絶対に置かないでください**。公開サイトは読み取り専用です。

## ビルド

```bash
npm run build
npm run start
```

## Vercel デプロイ

- 既存の `dog-cafe-site` とは**別の新規 Vercel プロジェクト**として作成します。
- Root Directory: このフォルダ（`dog-cafe-public`）
- Environment Variables: 上記 3 つを設定
- Framework Preset: Next.js（自動検出）
