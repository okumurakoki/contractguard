# ContractGuard - AI契約書レビューSaaS

「中小企業が安心して契約できる世界を作る」

AIを活用して契約書のリスクを自動分析し、弁護士費用を大幅に削減できるSaaSプラットフォームです。

## 🚀 技術スタック

### フロントエンド
- **Framework**: Next.js 16 (App Router, Turbopack)
- **Language**: TypeScript 5.x
- **UI Library**: Material-UI v7
- **State Management**: TanStack Query
- **Form**: React Hook Form + Zod
- **Styling**: Emotion (CSS-in-JS)
- **Editor**: ContentEditable (Custom Implementation)

### バックエンド
- **API**: Next.js API Routes (Serverless)
- **ORM**: Prisma v7
- **Database**: PostgreSQL (Supabase)
- **Authentication**: Clerk
- **File Storage**: Supabase Storage
- **PDF Processing**: unpdf

### AI/ML
- **Primary LLM**: Anthropic Claude 4 Sonnet
- **Text Matching**: Custom Levenshtein Distance Algorithm
- **Fuzzy Matching**: 70%+ similarity threshold

### テスト
- **Unit Testing**: Vitest
- **Testing Library**: @testing-library/react
- **Coverage**: v8 provider
- **Test Files**: 39 tests (2 files)

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

## 📚 主要機能

### ✅ 実装済み（2026年1月4日時点）

#### コア機能
- [x] プロジェクト初期化
- [x] Material-UI v7デザインシステム
- [x] Prismaスキーマ定義
- [x] 基本的なダッシュボードUI
- [x] PDF契約書アップロード機能
- [x] AI契約書分析（Anthropic Claude 4）
- [x] リスク検出と評価
- [x] 契約書エディタ（ContentEditable）
- [x] バージョン管理・履歴機能
- [x] チーム管理・権限設定
- [x] フォルダ機能
- [x] 監査ログ

#### 最近の改善（本セッション）
- [x] **AI提案の反映精度向上** (90%以上の成功率)
  - ファジーマッチングアルゴリズム実装
  - Levenshtein距離による類似度計算
  - デバッグモード追加

- [x] **エディタUX改善**
  - IME入力時のカーソル位置保持
  - Undo/Redoのメモリ最適化（デバウンス500ms）
  - 履歴管理（最大50エントリ）

- [x] **テスト追加**
  - Vitestセットアップ完了
  - 39個のユニットテスト（すべて成功）
  - textMatching, editorUtils のテストカバレッジ

### 🚧 今後の実装予定

#### 中優先度
- [ ] **PDF抽出の改善**
  - OCR対応（スキャンPDF）
  - 表形式の認識
  - 複雑なレイアウト対応

- [ ] **弁護士相談機能**
  - 弁護士リスト・検索
  - 相談予約システム
  - チャット機能

- [ ] **レポート機能**
  - 分析結果のPDFレポート出力
  - グラフ・チャート埋め込み
  - メール送信機能

#### 低優先度
- [ ] 比較機能（バージョン間差分表示）
- [ ] 通知機能（メール/ブラウザ通知）
- [ ] モバイル対応

詳細は `PROGRESS_AND_TODO.md` を参照してください。

---

## 🧪 テスト

```bash
# 全テスト実行
npm test

# UIモードでテスト実行
npm test:ui

# カバレッジレポート生成
npm test:coverage

# 特定のテストのみ実行
npm test textMatching
```

**テスト結果** (2026年1月4日時点):
- Test Files: 2 passed
- Tests: 39 passed
- Duration: ~1.2s

---

## 📖 ドキュメント

- **開発ログ**: `DEVELOPMENT_LOG.md` - 詳細な実装履歴
- **進捗とTODO**: `PROGRESS_AND_TODO.md` - 今後のタスクと実装内容
- **APIドキュメント**: `/docs/api` (準備中)

---

## 🤝 コントリビューション

このプロジェクトはプライベートリポジトリです。

---

## 📝 ライセンス

Proprietary - All Rights Reserved

---

## 📞 サポート

問題が発生した場合:
1. `DEVELOPMENT_LOG.md` で最近の変更を確認
2. `PROGRESS_AND_TODO.md` のトラブルシューティングセクションを確認
3. `npm test` でテストを実行して問題箇所を特定

---

**最終更新**: 2026年1月4日

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
