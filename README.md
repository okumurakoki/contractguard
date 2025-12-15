# ContractGuard - AI契約書レビューSaaS

「中小企業が安心して契約できる世界を作る」

AIを活用して契約書のリスクを自動分析し、弁護士費用を大幅に削減できるSaaSプラットフォームです。

## 🚀 技術スタック

### フロントエンド
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.3+
- **UI Library**: Material-UI v5
- **State Management**: Zustand + TanStack Query
- **Form**: React Hook Form + Zod
- **Styling**: Emotion (CSS-in-JS)

### バックエンド
- **API**: Next.js API Routes (Serverless)
- **ORM**: Prisma
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Clerk
- **File Storage**: AWS S3

### AI/ML
- **Primary LLM**: OpenAI GPT-4o
- **Secondary LLM**: Anthropic Claude 3.5 Sonnet
- **Vector DB**: Supabase pgvector

## 📦 プロジェクト構造

```
contractguard/
├── app/                      # Next.js App Router
│   ├── (dashboard)/         # ダッシュボードレイアウトグループ
│   │   ├── dashboard/       # ダッシュボードページ
│   │   ├── contracts/       # 契約書一覧・詳細
│   │   ├── upload/          # アップロードページ
│   │   └── layout.tsx       # 共通レイアウト
│   ├── api/                 # APIルート
│   │   ├── auth/           # 認証関連API
│   │   ├── contracts/      # 契約書管理API
│   │   └── dashboard/      # ダッシュボードAPI
│   └── layout.tsx          # ルートレイアウト
├── components/              # Reactコンポーネント
│   ├── layout/             # レイアウトコンポーネント
│   ├── contracts/          # 契約書関連コンポーネント
│   └── ui/                 # 汎用UIコンポーネント
├── lib/                     # ユーティリティ・設定
│   ├── prisma.ts           # Prismaクライアント
│   ├── theme.ts            # MUIテーマ設定
│   ├── registry.tsx        # MUIレジストリ
│   ├── ai/                 # AI関連ユーティリティ
│   ├── s3/                 # S3操作
│   └── utils/              # 汎用ユーティリティ
├── prisma/
│   └── schema.prisma       # データベーススキーマ
├── hooks/                   # カスタムReact Hooks
├── types/                   # TypeScript型定義
└── public/                  # 静的ファイル
```

## 🛠️ セットアップ手順

### 1. 必要な環境

- Node.js 20+
- PostgreSQL（Supabaseアカウント）
- AWS S3（ファイルストレージ用）
- OpenAI APIキー
- Anthropic APIキー（オプション）
- Clerk アカウント（認証用）

### 2. プロジェクトのクローン

```bash
cd contractguard
```

### 3. 依存関係のインストール

```bash
npm install
```

### 4. 環境変数の設定

`.env.example`をコピーして`.env`ファイルを作成：

```bash
cp .env.example .env
```

必要な環境変数を設定：

```env
# Database
DATABASE_URL="postgresql://..."

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# AI APIs
OPENAI_API_KEY="sk-..."
ANTHROPIC_API_KEY="sk-ant-..."

# AWS S3
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_S3_BUCKET="contractguard-files"
AWS_REGION="ap-northeast-1"

# Stripe (決済)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 5. データベースのセットアップ

Prismaマイグレーションを実行：

```bash
npx prisma generate
npx prisma db push
```

### 6. 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

## 📚 主要機能（Phase 1 MVP）

### ✅ 実装済み
- [x] プロジェクト初期化
- [x] Material-UIデザインシステム
- [x] Prismaスキーマ定義
- [x] 基本的なダッシュボードUI
- [x] サイドバーナビゲーション

### 🚧 実装予定
- [ ] 認証機能（Clerk統合）
- [ ] 契約書アップロード（S3統合）
- [ ] AI分析機能（GPT-4o統合）
- [ ] 契約書一覧・詳細表示
- [ ] リスク項目の表示・編集
- [ ] テンプレート機能
- [ ] チーム管理
- [ ] Stripe決済統合

## 🧪 テスト

### 単体テスト

```bash
npm run test
```

### E2Eテスト

```bash
npm run test:e2e
```

## 🚀 デプロイ

### Vercelへのデプロイ

```bash
# Vercel CLIをインストール
npm i -g vercel

# デプロイ
vercel
```

### 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定：
- `DATABASE_URL`
- `CLERK_SECRET_KEY`
- `OPENAI_API_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- その他必要な環境変数

## 📖 開発ガイド

### コーディング規約

- **言語**: TypeScript必須
- **スタイル**: Prettier + ESLint
- **コンポーネント**: 関数コンポーネント + Hooks
- **命名規則**:
  - ファイル名: PascalCase (コンポーネント), camelCase (ユーティリティ)
  - 関数名: camelCase
  - コンポーネント名: PascalCase

### ブランチ戦略

- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 新機能開発
- `fix/*`: バグ修正
- `release/*`: リリース準備

### コミットメッセージ

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードフォーマット
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・ツール関連
```

## 📝 ライセンス

Proprietary - All rights reserved

## 🤝 コントリビューション

このプロジェクトは現在プライベートです。

## 📧 お問い合わせ

質問や問題がある場合は、開発チームまでお問い合わせください。

---

**ContractGuard** - Powered by AI 🤖
