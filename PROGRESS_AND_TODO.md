# ContractGuard 開発進捗と今後のタスク

最終更新: 2026年1月5日

## 📊 本セッションで実装した内容

### ✅ 1. PDF抽出の改善

#### 実装内容
- **改善ファイル**: `lib/pdf/extract.ts`
  - OCR対応（Tesseract.jsによるスキャンPDFのテキスト抽出）
  - 表形式の認識と HTML table タグへの変換
  - ヘッダー・フッターの除去機能
  - 段組みレイアウトの正規化

- **新規テスト**: `lib/pdf/__tests__/extract.test.ts` (18テスト)
  - extractTextFromPdf, detectAndConvertTables
  - removeHeadersAndFooters, normalizeColumnLayout

#### 成果
- スキャンした契約書もOCRで分析可能に
- 表形式の契約条項を正確に認識
- より多様な契約書フォーマットに対応

---

### ✅ 2. 弁護士相談機能

#### 実装内容
- **Prismaスキーマ追加**: `prisma/schema.prisma`
  - Lawyer, LawyerAvailability, LawyerReview モデル

- **APIエンドポイント**:
  - `app/api/lawyers/route.ts` - 弁護士一覧
  - `app/api/lawyers/[id]/route.ts` - 弁護士詳細
  - `app/api/consultations/route.ts` - 相談予約

- **フロントエンド**:
  - `app/(dashboard)/lawyer/consultation/page.tsx` - 相談予約ページ
  - 専門分野フィルタリング、評価表示、予約ダイアログ

#### 成果
- 弁護士検索・フィルタリング機能
- 相談予約システム（カレンダーUI）
- 弁護士評価・レビュー表示

---

### ✅ 3. レポート機能（分析結果のPDF出力）

#### 実装内容
- **依存関係追加**: jspdf, jspdf-autotable

- **APIエンドポイント**: `app/api/contracts/[id]/report/route.ts`
  - 契約書基本情報
  - リスクサマリー（高・中・低リスク件数）
  - 検出されたリスク詳細テーブル
  - 日本語フォント対応

- **フロントエンド**: `app/(dashboard)/contracts/[id]/page.tsx`
  - PDFダウンロードボタン追加

#### 成果
- ワンクリックでPDFレポートをダウンロード
- 専門的な分析レポートを生成

---

### ✅ 4. 比較機能（バージョン間差分表示）

#### 実装内容
- **依存関係追加**: diff-match-patch

- **ユーティリティ**: `lib/compare/diff.ts`
  - computeDiff, computeDiffStats
  - stripHtml, diffToHtml
  - computeLineDiff, calculateSimilarity

- **フロントエンド**: `app/(dashboard)/contracts/compare/page.tsx`
  - 2つの契約書を選択して比較
  - バージョン間差分表示
  - 差分ハイライト（追加: 緑、削除: 赤）
  - 類似度パーセンテージ表示

- **テスト**: `lib/compare/__tests__/diff.test.ts` (24テスト)

#### 成果
- 契約書のバージョン間差分を視覚的に確認可能
- 変更箇所の統計情報を表示

---

### ✅ 5. 通知機能

#### 実装内容
- **メール通知**: `lib/notifications/email.ts`
  - Resend APIによるメール送信
  - 分析完了通知、相談リマインダー、契約期限通知

- **ブラウザ通知**: `lib/notifications/browser.ts`
  - Web Notification API
  - 高リスク検出時の通知
  - 相談リマインダー通知

- **設定ページ**: `app/(dashboard)/settings/notifications/page.tsx`
  - メール通知のオン/オフ
  - ブラウザ通知の許可リクエスト
  - 通知タイプごとの設定

- **テスト**: `lib/notifications/__tests__/browser.test.ts` (7テスト)

#### 成果
- AI分析完了時に自動通知
- 重要なリスク検出時にブラウザ通知
- 相談予約のリマインダー機能

---

### ✅ 6. モバイル対応

#### 実装内容
- **グローバルスタイル**: `app/globals.css`
  - レスポンシブデザイン改善
  - タッチ操作最適化（min-height: 44px）
  - iOSズーム防止（font-size: 16px）
  - テーブルスクロール対応

- **ナビゲーション**: `components/layout/DashboardLayout.tsx`
  - モバイルメニューの改善
  - 新機能へのナビゲーション追加

#### 成果
- スマートフォン・タブレットで快適に使用可能
- タッチ操作に最適化されたUI

---

### ✅ 7. テストカバレッジ拡充

#### 実装内容
- **新規テストファイル**:
  - `lib/pdf/__tests__/extract.test.ts` (18テスト)
  - `lib/compare/__tests__/diff.test.ts` (24テスト)
  - `lib/notifications/__tests__/browser.test.ts` (7テスト)

#### テスト結果
```
Test Files  5 passed (5)
Tests      88 passed (88)
Duration   1.30s
```

---

### ✅ 8. エディタパフォーマンス改善

#### 実装内容
- **コンポーネントのメモ化**: `components/editor/ContractEditor.tsx`
  - `SortableArticleItem` → `React.memo`
  - `SortableEditorArticle` → `React.memo`

- **ハンドラーのメモ化**:
  - `handleArticleContentChange` → `useCallback`
  - `handleDragEnd` → `useCallback`
  - `handleJumpToArticle` → `useCallback`
  - `handleInsertTemplate` → `useCallback`

- **計算結果のメモ化**:
  - スタイルオブジェクト → `useMemo`
  - `articleIds` → `useMemo`
  - `contentHtml` → `useMemo`

- **デバウンス追加**:
  - コンテンツパース → 100msデバウンス
  - `onChange` → 150msデバウンス
  - 重複パースのスキップ

#### 成果
- 入力時の再レンダリングを大幅削減
- 長い契約書での編集がスムーズに
- メモリ使用量の最適化

---

## 🔧 開発環境のセットアップ

### 必要な環境変数
`.env.local` に以下を設定：
```env
# Anthropic API (AI分析用)
ANTHROPIC_API_KEY=your_api_key

# モック分析を使用する場合（開発時）
USE_MOCK_AI=true

# データベース
DATABASE_URL=your_database_url

# Supabase (ファイルストレージ)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Clerk (認証)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Resend (メール通知)
RESEND_API_KEY=your_resend_key

# Stripe (決済)
STRIPE_SECRET_KEY=your_stripe_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable
```

### 開発サーバー起動
```bash
# 依存関係のインストール
npm install

# Prisma クライアント生成
npx prisma generate

# データベースマイグレーション（本番環境接続時）
npx prisma migrate deploy

# 開発サーバー起動
npm run dev
```

### ビルド
```bash
# プロダクションビルド
npm run build

# ビルド結果を実行
npm start
```

---

## 📋 今後の実装タスク（優先度順）

### 🔴 高優先度
なし（主要機能すべて完了）

### 🟡 中優先度

#### 1. E2Eテスト追加
**ツール**: Playwright または Cypress

**実装内容**:
- [ ] ユーザー登録・ログインフロー
- [ ] 契約書アップロード→分析→編集フロー
- [ ] 弁護士相談予約フロー
- [ ] レポートダウンロードフロー

#### 2. リアルタイムチャット機能
**実装内容**:
- [ ] 弁護士とのリアルタイムチャット
- [ ] ファイル共有機能
- [ ] WebSocket または Supabase Realtime 使用

#### 3. AI分析のさらなる改善
**実装内容**:
- [ ] 複数のAIモデル対応（GPT-4, Gemini等）
- [ ] カスタムプロンプトテンプレート
- [ ] 業界別の分析ルール設定

---

### 🔵 低優先度

#### 4. 多言語対応
- [ ] i18n対応（英語、中国語等）
- [ ] 契約書の言語自動検出

#### 5. ダッシュボード分析強化
- [ ] 契約書統計グラフ
- [ ] リスクトレンド分析
- [ ] チームパフォーマンス指標

#### 6. API公開
- [ ] REST API ドキュメント
- [ ] APIキー管理機能
- [ ] レート制限

---

## 🐛 既知の問題・改善点

### 1. middleware警告
**現状**: Next.js 16で`middleware.ts`が非推奨
```
The "middleware" file convention is deprecated. Please use "proxy" instead.
```
**対応**: 将来的に`proxy.ts`への移行が必要（現状動作に問題なし）

### 2. Lint警告
**現状**: 54件の警告（主に未使用インポート・変数）
**対応**: 機能に影響なし、必要に応じて順次対応

### 3. DBマイグレーション
**現状**: Lawyer関連モデルのマイグレーション未実行
**対応**: 本番環境接続時に`npx prisma migrate deploy`を実行

---

## 📚 参考資料

### 使用ライブラリ
- **フロントエンド**: Next.js 16, React 19, Material-UI 7
- **バックエンド**: Prisma, PostgreSQL, Supabase
- **AI**: Anthropic Claude API
- **認証**: Clerk
- **決済**: Stripe
- **PDF処理**: unpdf, jsPDF, Tesseract.js
- **差分比較**: diff-match-patch
- **メール**: Resend
- **テスト**: Vitest, Testing Library
- **ドラッグ&ドロップ**: @dnd-kit

### ドキュメント
- [Next.js Documentation](https://nextjs.org/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Vitest Documentation](https://vitest.dev/)
- [Resend Documentation](https://resend.com/docs)

---

## 🚀 デプロイ

### Vercel デプロイ
```bash
# プレビューデプロイ
vercel

# 本番デプロイ
vercel --prod
```

### 環境変数の設定
Vercel ダッシュボード → Settings → Environment Variables

必須:
- `DATABASE_URL`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `RESEND_API_KEY`

---

## 💡 トラブルシューティング

### ビルドエラー
```bash
# Prismaクライアントの再生成
npx prisma generate

# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install
```

### テスト失敗
```bash
# キャッシュをクリア
npm test -- --clearCache

# 特定のテストのみ実行
npm test -- textMatching
```

### 開発サーバーが起動しない
```bash
# ポート3000が使用中の場合
lsof -ti:3000 | xargs kill -9

# 別のポートで起動
PORT=3001 npm run dev
```

---

## 📞 サポート

問題が発生した場合:
1. `DEVELOPMENT_LOG.md` で最近の変更を確認
2. GitHub Issues で既知の問題を確認
3. テストを実行して問題箇所を特定: `npm test`

---

## ✅ チェックリスト（次回セッション開始時）

### 環境確認
- [ ] `npm install` で依存関係をインストール
- [ ] `.env.local` が設定されているか確認
- [ ] `npm test` でテストが通るか確認（88テスト）
- [ ] `npm run build` でビルドが成功するか確認
- [ ] `npm run dev` で開発サーバーが起動するか確認

### 次のタスク選択
- [ ] このファイルの「今後の実装タスク」セクションを確認
- [ ] 優先度に応じてタスクを選択
- [ ] TodoWriteツールでタスクを管理

### コミット前の確認
- [ ] `npm test` でテストが通ることを確認
- [ ] `npm run build` でビルドが成功することを確認
- [ ] DEVELOPMENT_LOG.md を更新
- [ ] このファイル（PROGRESS_AND_TODO.md）を更新

---

## 📈 実装済み機能一覧

| 機能 | ステータス | 備考 |
|------|-----------|------|
| AI契約書分析 | ✅ 完了 | Claude API使用 |
| ファジーマッチング | ✅ 完了 | 90%以上の精度 |
| エディタ（IME対応） | ✅ 完了 | カーソル位置復元 |
| Undo/Redo | ✅ 完了 | 履歴管理最適化 |
| PDF抽出（OCR対応） | ✅ 完了 | Tesseract.js |
| 弁護士相談機能 | ✅ 完了 | 予約システム含む |
| レポート出力 | ✅ 完了 | PDF生成 |
| バージョン比較 | ✅ 完了 | diff-match-patch |
| 通知機能 | ✅ 完了 | メール + ブラウザ |
| モバイル対応 | ✅ 完了 | レスポンシブ |
| テスト | ✅ 完了 | 88テスト |
| エディタ最適化 | ✅ 完了 | React.memo等 |

---

**Happy Coding! 🎉**
