# ContractGuard 開発セッション引き継ぎ

**最終更新:** 2026-01-09
**デプロイ状態:** ✅ Production Ready

---

## 概要

ContractGuardは契約書レビューSaaSです。このセッションでは、LegalOnとの差別化戦略として「A+C戦略」を実装しました。

### 差別化戦略
- **A戦略**: PDFビュー（レビュー用）+ テキスト編集モードの切り替え
- **C戦略**: テンプレートからの契約書新規作成機能

---

## 今回実装した機能

### 1. PDFビュー / 編集モード切り替え ✅

**ファイル:** `app/(dashboard)/contracts/[id]/page.tsx`

- ヘッダーに「PDFビュー」「編集モード」トグルボタンを追加
- PDFビュー: アップロードされたPDFをiframeで表示（ツールバー非表示）
- 編集モード: リッチテキストエディタで契約内容を編集
- `viewMode` state (`'pdf' | 'edit'`) で管理

```typescript
const [viewMode, setViewMode] = React.useState<'pdf' | 'edit'>('pdf');

const handleSwitchToEdit = async () => {
  if (contract?.editedContent) {
    setEditContent(contract.editedContent);
    setViewMode('edit');
  } else {
    const success = await extractText();
    if (success) {
      setViewMode('edit');
    }
  }
};
```

### 2. テンプレートから契約書作成 ✅

**ファイル:**
- `app/(dashboard)/templates/page.tsx` - 一覧ページ
- `app/(dashboard)/templates/[id]/page.tsx` - 詳細・作成フロー
- `app/api/templates/[id]/generate/route.ts` - 生成API

**機能:**
- テンプレート一覧に「使う」ボタンを追加
- 3ステップの作成ウィザード:
  1. **取引先選択**: 登録済み取引先から選択 or 直接入力
  2. **詳細入力**: テンプレート変数の入力
  3. **確認**: 内容を確認して契約書を作成
- URLパラメータ `?use=true` で自動的にダイアログを開く
- 取引先IDを契約書にリンク

### 3. 取引先管理機能 ✅

**ファイル:**
- `app/(dashboard)/counterparties/page.tsx` - 取引先一覧・登録
- `app/api/counterparties/route.ts` - CRUD API
- `app/api/counterparties/[id]/route.ts` - 個別API

**機能:**
- 取引先の登録・編集・削除
- 会社名、略称、住所、代表者、代表者肩書を管理
- 署名欄生成や契約書作成で使用

### 4. 署名欄自動生成 ✅

**ファイル:**
- `app/api/contracts/[id]/signature/route.ts`
- `app/api/organization/route.ts`

**機能:**
- 組織情報と取引先情報から署名欄HTMLを生成
- 甲/乙の立場（`ourPosition`）に基づいて正しい順序で表示
- 設定ページで組織情報（住所、代表者等）を入力

### 5. その他の改善

- PDFビューアのツールバーを非表示に（`#toolbar=0&navpanes=0`）
- 契約書パーサーで壊れた署名欄をスキップ
- サイドバーに取引先管理を追加

---

## 変更されたファイル一覧

### 新規作成
```
app/(dashboard)/counterparties/page.tsx
app/(dashboard)/lawyer/consultation/page.tsx
app/(dashboard)/settings/notifications/page.tsx
app/api/consultations/route.ts
app/api/contracts/[id]/report/route.ts
app/api/contracts/[id]/signature/route.ts
app/api/counterparties/[id]/route.ts
app/api/counterparties/route.ts
app/api/lawyers/[id]/route.ts
app/api/lawyers/route.ts
app/api/organization/route.ts
lib/compare/diff.ts
lib/contract/parser.ts
lib/contract/types.ts
lib/notifications/browser.ts
lib/notifications/email.ts
```

### 主な修正
```
app/(dashboard)/contracts/[id]/page.tsx  # PDFビュー/編集モード切り替え
app/(dashboard)/templates/[id]/page.tsx  # 3ステップ作成フロー
app/(dashboard)/templates/page.tsx       # 「使う」ボタン追加
app/api/templates/[id]/generate/route.ts # counterpartyId対応
components/layout/DashboardLayout.tsx    # サイドバーに取引先追加
prisma/schema.prisma                     # Counterpartyモデル追加
prisma/seed.ts                           # テンプレートシード
prisma.config.ts                         # シードコマンド設定
```

---

## データベース

### Counterpartyモデル (新規)
```prisma
model Counterparty {
  id              String   @id @default(uuid())
  organizationId  String
  name            String
  shortName       String?
  address         String?
  representative  String?
  repTitle        String?
  email           String?
  phone           String?
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  contracts       Contract[]
}
```

### Organizationモデル (更新)
```prisma
// 追加フィールド
companyAddress        String?
companyRepresentative String?
companyRepTitle       String?
```

### テンプレートシード
6つのテンプレートが `prisma/seed.ts` に定義済み:
- 業務委託基本契約書
- 秘密保持契約書（NDA）
- 売買基本契約書
- SaaS利用規約
- ソフトウェア開発委託契約書
- 顧問契約書

**シード実行:** `npx prisma db seed`

---

## 残タスク

### 保留中
- [ ] PDFビューでリスク箇所をハイライト表示（PDF.js統合が必要で複雑）

### 今後の検討事項
- テンプレートのカスタマイズ機能
- ドラッグ&ドロップでの条項並び替え
- AIによるテンプレート提案
- 契約書の比較機能の強化

---

## 環境情報

### 本番URL
- **Vercel:** https://contractguard.vercel.app
- **最新デプロイ:** https://contractguard-1lwxfd9dg-kokiokumuras-projects.vercel.app

### 技術スタック
- Next.js 16.0.10
- React 19
- MUI (Material-UI)
- Prisma 7.0 + PostgreSQL (Supabase)
- Clerk (認証)
- Anthropic Claude API (AI分析)

### ローカル開発
```bash
npm run dev  # http://localhost:3000
```

注意: ローカルではDB接続エラーが出る場合あり（ネットワーク依存）

---

## 次のセッションへの提案

1. **テンプレートシードの実行** - DBにテンプレートを追加
2. **PDFハイライト機能** - react-pdf + PDF.jsで実装検討
3. **契約書作成フローのテスト** - 実際に契約書を作成して動作確認
4. **UI/UXの改善** - ユーザーフィードバックに基づく調整

---

## コマンドまとめ

```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# テンプレートシード実行
npx prisma db seed

# Prismaマイグレーション
npx prisma migrate dev

# デプロイ
vercel --prod

# Git
git add -A && git commit -m "message" && git push origin main
```
