# ContractGuard 開発ログ

## プロジェクト概要
契約書AIレビューSaaSアプリケーション

- **URL**: https://contractguard.oku-ai.co.jp
- **技術スタック**: Next.js 16, TypeScript, Prisma, Supabase, Clerk, Stripe, Claude API

---

## 完了した機能

### 1. 基本機能
- [x] ユーザー認証（Clerk）
- [x] 組織・チーム管理
- [x] 契約書アップロード（PDF）
- [x] フォルダ管理
- [x] 契約書一覧・検索・フィルター

### 2. AI分析機能
- [x] Claude APIによる契約書分析
- [x] リスク検出（高・中・低）
- [x] 修正提案の生成
- [x] モック分析（API未設定時）

### 3. 契約書編集機能
- [x] PDFからテキスト抽出（`/api/contracts/[id]/extract`）
- [x] リッチテキストエディタ（contentEditable）
- [x] 条項のドラッグ＆ドロップ並び替え
- [x] 条項テンプレートから追加
- [x] AI条項並び替え提案（`/api/contracts/[id]/suggest-order`）
- [x] PDF出力（html2pdf.js）

### 4. AI提案の反映機能
- [x] 「反映する」ボタンで修正案を適用
- [x] 修正箇所の黄色ハイライト表示
- [x] 新規条項の緑ハイライト表示
- [x] 署名セクション検出（条項が署名の下に入らないよう修正）
- [x] 条番号の自動計算（最後の条項+1）
- [x] スコアの動的更新（修正するとスコアが上昇）

### 5. バージョン管理
- [x] 編集内容の保存時にバージョン作成
- [x] バージョン履歴一覧（`/api/contracts/[id]/versions`）
- [x] バージョン復元（`/api/contracts/[id]/versions/[versionId]`）

### 6. 変更追跡
- [x] 編集中（赤）→ 保存後（緑）→ 確定（通常表示）
- [x] 削除マーク（取り消し線）
- [x] 追加マーク（下線）

### 7. Stripe決済連携
- [x] チェックアウトセッション作成（`/api/billing/checkout`）
- [x] カスタマーポータル（`/api/billing/portal`）
- [x] Webhook処理（`/api/billing/webhook`）
- [x] サブスクリプション管理
- [x] プラン: スタンダード（price_1SiEurKnrmty0hAGpjwg7dgm）、プレミアム（price_1SiEzVKnrmty0hAGMf3DCvhE）

### 8. チーム招待機能
- [x] 招待メール送信（Resend）
- [x] 招待リンク（`/api/invite/[token]`）
- [x] 招待受諾（`/api/invite/[token]/accept`）

### 9. テンプレート機能
- [x] テンプレート一覧・詳細
- [x] テンプレートから契約書生成（`/api/templates/[id]/generate`）
- [x] 6件のサンプルテンプレートをシード済み

### 10. 監査ログ
- [x] `lib/audit.ts` ユーティリティ作成
- [x] アップロード・削除・分析操作の記録

### 11. セキュリティ・ミドルウェア
- [x] Clerkミドルウェアでの認証
- [x] パブリックルート設定（Webhook、招待リンク）
- [x] エラーレスポンスからスタックトレース削除

---

## 環境変数（設定済み）

```
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET

# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# Database
DATABASE_URL

# Anthropic
ANTHROPIC_API_KEY

# Stripe
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_PRICE_STANDARD=price_1SiEurKnrmty0hAGpjwg7dgm
STRIPE_PRICE_PREMIUM=price_1SiEzVKnrmty0hAGMf3DCvhE

# App
NEXT_PUBLIC_APP_URL=https://contractguard.oku-ai.co.jp

# Email
RESEND_API_KEY
```

---

## 主要ファイル構成

```
contractguard/
├── app/
│   ├── (dashboard)/
│   │   ├── contracts/[id]/page.tsx    # 契約書詳細・編集ページ
│   │   ├── contracts/page.tsx         # 契約書一覧
│   │   └── ...
│   └── api/
│       ├── contracts/[id]/
│       │   ├── route.ts               # GET/PATCH/DELETE
│       │   ├── analyze/route.ts       # AI分析
│       │   ├── extract/route.ts       # PDF→テキスト抽出
│       │   ├── suggest-order/route.ts # AI並び替え提案
│       │   └── versions/              # バージョン管理
│       ├── billing/
│       │   ├── checkout/route.ts
│       │   ├── portal/route.ts
│       │   └── webhook/route.ts
│       ├── invite/[token]/            # 招待機能
│       ├── templates/[id]/generate/   # テンプレート生成
│       └── upload/route.ts
├── components/
│   └── editor/ContractEditor.tsx      # 契約書エディタ
├── lib/
│   ├── ai/analyze.ts                  # AI分析・並び替えロジック
│   ├── pdf/extract.ts                 # PDF抽出・HTML変換
│   ├── stripe.ts                      # Stripe関連
│   ├── audit.ts                       # 監査ログ
│   └── prisma.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
└── middleware.ts                      # 認証ミドルウェア
```

---

## 今後のタスク（未実装・改善が必要）

### 高優先度
1. **AI提案の反映精度向上**
   - originalTextとの一致精度を上げる
   - PDFから抽出したテキストとAIが認識したテキストのズレ対応

2. **エディタのUX改善**
   - IME入力のさらなる改善
   - カーソル位置保持の安定化
   - Undo/Redoの動作確認

3. **テスト追加**
   - ユニットテスト
   - E2Eテスト（Playwright/Cypress）

### 中優先度
4. **PDF抽出の改善**
   - スキャンPDF対応（OCR）
   - 表形式の認識

5. **弁護士相談機能**
   - `/lawyer` ページの実装
   - 弁護士マッチング

6. **レポート機能**
   - 分析結果のPDFレポート出力
   - エクスポート機能の充実

### 低優先度
7. **比較機能**
   - `/contracts/compare` の実装
   - バージョン間の差分表示

8. **通知機能**
   - 契約書期限通知
   - チームメンバーへの通知

9. **モバイル対応**
   - レスポンシブデザインの改善

---

## 既知の問題

1. ~~条番号が正しく計算されない~~ → 修正済み
2. ~~修正箇所がわかりにくい~~ → 黄色ハイライト追加で修正済み
3. ~~条項が署名の下に入る~~ → 署名セクション検出で修正済み
4. ~~スコアが変わらない~~ → 動的計算で修正済み

---

## デプロイ方法

```bash
# ビルド確認
npm run build

# 本番デプロイ
vercel --prod
```

---

## 最新の更新（2026年1月4日）

### AI提案の反映精度向上

#### 実装内容

1. **テキストマッチングユーティリティの追加** (`lib/utils/textMatching.ts`)
   - 強力なテキスト正規化関数（空白、改行、全角半角、句読点の統一）
   - Levenshtein距離アルゴリズムによる類似度計算
   - ファジーマッチング機能（70%以上の類似度でマッチ）
   - 前方一致フォールバック検索

2. **反映ロジックの改善** (`app/(dashboard)/contracts/[id]/page.tsx`)
   - 従来の単純な文字列置換から、ファジーマッチングベースの検索に変更
   - マッチング精度：70%以上の類似度で自動検出
   - デバッグモードの追加（開発環境でマッチング情報をログ出力）
   - 段階的なフォールバック戦略：
     1. ファジーマッチング（70%類似度）
     2. 前方一致検索（15文字、80%類似度）
     3. 新規条項として追加

3. **AIプロンプトの改善** (`lib/ai/analyze.ts`)
   - `originalText` 抽出ルールの明確化
   - 条項タイトルを除外し、本文のみを抽出するよう指示
   - 改行を含めず、連続したテキストとして記載するよう指示
   - 具体的な抽出例を追加

4. **モック分析データの改善**
   - モック分析の `originalText` も本文のみに修正
   - 実際の分析結果との一貫性を確保

#### 技術的な改善点

**問題点:**
- PDFからテキスト抽出 → HTML変換 → AI分析の過程で、改行・空白・フォーマットにズレが発生
- 従来の単純な文字列一致では、AIが返す `originalText` と実際のHTML内テキストがマッチしない
- 部分一致の精度が低く（先頭10文字のみ）、誤検出が発生

**解決策:**
- 正規化関数で改行・空白・全角半角・句読点を統一
- Levenshtein距離で文字列の類似度を数値化（0-100%）
- 70%以上の類似度で「同じテキスト」と判定
- HTMLタグを考慮した検索（h3, p, li タグ内を検索）

#### 期待される効果

- AI提案の反映成功率が大幅に向上（推定: 50-60% → 90%以上）
- ユーザーが「反映する」ボタンを押したときのストレス軽減
- より正確な位置に修正案が適用される
- デバッグモードにより、問題の特定と改善が容易に

#### 今後の改善案

1. **さらなる精度向上**
   - 形態素解析を導入し、意味レベルでのマッチングを実現
   - AIに渡すテキストとHTML内テキストの完全な統一

2. **ユーザーフィードバック機能**
   - 反映に失敗した場合、ユーザーが手動で選択できるUI
   - マッチング候補を複数表示し、ユーザーが選択

3. **パフォーマンス最適化**
   - 大きな契約書でのマッチング速度改善
   - WebWorkerを使用した並列処理

---

## エディタUX改善（2026年1月4日）

### 実装内容

1. **エディタユーティリティの追加** (`lib/utils/editorUtils.ts`)
   - カーソル位置の保存・復元（相対的な文字オフセットで管理）
   - デバウンス関数（500ms）
   - スロットル関数
   - HistoryManagerクラス（履歴管理、最大50エントリ）

2. **IME入力の改善** (`components/editor/ContractEditor.tsx`)
   - カーソル位置の自動保存・復元
   - compositionEnd後にカーソル位置を正しく復元
   - IME入力中の不要な更新をブロック
   - requestAnimationFrameでDOM更新を待ってから復元

3. **カーソル位置保持の安定化**
   - 相対的な文字オフセットでカーソル位置を管理
   - コンテンツ更新後も正確な位置を復元
   - setTimeoutの代わりにrequestAnimationFrameを使用

4. **Undo/Redoの大幅改善**
   - HistoryManagerクラスで履歴を管理
   - デバウンス処理（500ms）で履歴の肥大化を防止
   - 最大50エントリの履歴保持
   - canUndo/canRedoの状態管理
   - UIボタンの有効/無効が正確に反映

#### 技術的な改善点

**改善前の問題:**
- カーソル位置が失われる（特にIME入力後）
- Undo/Redo履歴が膨大になる（すべての入力で追加）
- メモリリークの可能性
- IME入力中のちらつき

**改善後:**
- 相対的な文字オフセットでカーソル位置を正確に管理
- デバウンス処理で履歴は500ms後にのみ追加
- 最大50エントリで古い履歴を自動削除
- IME確定後にカーソル位置を復元

#### 期待される効果

- **IME入力**: 日本語入力がスムーズに（カーソルジャンプなし）
- **カーソル位置**: コンテンツ更新後も正確な位置を維持
- **Undo/Redo**:
  - メモリ使用量が大幅に削減
  - 連続した入力が1つの履歴エントリにまとまる
  - Ctrl+Z/Ctrl+Shift+Zが確実に動作
- **全体のUX**: エディタの応答性とパフォーマンスが向上

---

## テスト追加（2026年1月4日）

### 実装内容

1. **テストフレームワークのセットアップ**
   - Vitestをインストールして設定
   - Testing Library (React, Jest DOM, User Event) を追加
   - vitest.config.ts と vitest.setup.ts を作成
   - package.json にテストスクリプトを追加:
     - `npm test`: テスト実行
     - `npm test:ui`: UIモードでテスト実行
     - `npm test:coverage`: カバレッジレポート生成

2. **textMatchingユーティリティのテスト** (`lib/utils/__tests__/textMatching.test.ts`)
   - 26個のテストケース、すべて成功
   - normalizeText: 全角半角変換、空白正規化のテスト
   - levenshteinDistance: 文字列距離計算のテスト
   - calculateSimilarity: 類似度計算のテスト（日本語対応）
   - containsNormalized: 正規化後の包含判定のテスト
   - findBestMatch: ファジーマッチングのテスト
   - findByPrefix: 前方一致検索のテスト

3. **editorUtilsのテスト** (`lib/utils/__tests__/editorUtils.test.ts`)
   - 13個のテストケース、すべて成功
   - HistoryManager: Undo/Redo履歴管理のテスト
     - 履歴の追加、Undo、Redo
     - 履歴サイズ制限（最大50エントリ）
     - Undo後のpushで履歴がクリアされることを確認
   - debounce: デバウンス処理のテスト
   - throttle: スロットル処理のテスト

#### テスト結果

```
Test Files  2 passed (2)
Tests  39 passed (39)
Duration  1.19s
```

#### 期待される効果

- **品質保証**: 重要なユーティリティ関数の動作を保証
- **リグレッション防止**: 変更による既存機能の破壊を検出
- **ドキュメント**: テストが仕様書として機能
- **リファクタリング**: 安心してコードをリファクタリング可能
- **CI/CD**: 自動テストによる継続的な品質チェック

#### 今後のテスト計画

1. **AI分析APIの統合テスト**
   - モック分析の動作確認
   - 実際のAPI呼び出しテスト
   - エラーハンドリングのテスト

2. **E2Eテスト（Playwright/Cypress）**
   - ユーザーフロー全体のテスト
   - 契約書アップロード → AI分析 → 反映のフロー
   - クロスブラウザテスト

3. **コンポーネントテスト**
   - ContractEditorコンポーネント
   - リスク表示コンポーネント
   - フォームバリデーション

---

## 最終更新
2026年1月4日
