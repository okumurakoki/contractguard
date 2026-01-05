# ContractGuard クイックスタート

次回のセッションを素早く開始するためのガイドです。

## 🚀 即座に開発を始める

### 1. 環境確認（30秒）

```bash
# ディレクトリ移動
cd /Users/kohki_okumura/contractguard

# 依存関係の確認（必要に応じてインストール）
npm install

# テストを実行して動作確認
npm test

# ビルドが通るか確認
npm run build
```

### 2. 開発サーバー起動

```bash
# 開発サーバー起動
npm run dev

# ブラウザで確認
# http://localhost:3000
```

---

## 📋 よく使うコマンド

### 開発
```bash
# 開発サーバー起動
npm run dev

# ビルド
npm run build

# プロダクションモード起動
npm start
```

### テスト
```bash
# 全テスト実行
npm test

# テストをウォッチモードで実行
npm test -- --watch

# UIモードでテスト実行
npm test:ui

# カバレッジレポート生成
npm test:coverage

# 特定のテストのみ実行
npm test textMatching
npm test editorUtils
```

### データベース
```bash
# Prismaクライアント生成
npx prisma generate

# データベーススキーマを同期
npx prisma db push

# Prisma Studio起動（データベースGUI）
npx prisma studio

# マイグレーション作成
npx prisma migrate dev --name your_migration_name
```

### その他
```bash
# Lintチェック
npm run lint

# 型チェック
npx tsc --noEmit

# キャッシュクリア
rm -rf .next node_modules package-lock.json
npm install
```

---

## 📁 重要なファイル

### ドキュメント
- `README.md` - プロジェクト概要
- `PROGRESS_AND_TODO.md` - **今後のタスクと詳細な実装ガイド**
- `DEVELOPMENT_LOG.md` - 開発履歴
- `QUICK_START.md` - このファイル

### 設定ファイル
- `.env.local` - 環境変数（要設定）
- `vitest.config.ts` - テスト設定
- `prisma/schema.prisma` - データベーススキーマ
- `next.config.mjs` - Next.js設定

### 今セッションで実装したファイル
```
lib/utils/textMatching.ts              # テキストマッチングユーティリティ
lib/utils/editorUtils.ts               # エディタUX改善ユーティリティ
lib/utils/__tests__/textMatching.test.ts   # テスト (26件)
lib/utils/__tests__/editorUtils.test.ts    # テスト (13件)
```

---

## 🎯 次のタスクの選び方

### ステップ1: `PROGRESS_AND_TODO.md` を開く

```bash
# VS Codeで開く
code PROGRESS_AND_TODO.md

# catで確認
cat PROGRESS_AND_TODO.md
```

### ステップ2: 「今後の実装タスク」セクションを確認

優先度順にタスクが記載されています：
- 🔴 高優先度（残り）: なし（すべて完了）
- 🟡 中優先度: PDF抽出の改善、弁護士相談機能、レポート機能
- 🔵 低優先度: 比較機能、通知機能、モバイル対応

### ステップ3: タスクを選択して実装開始

各タスクには以下が含まれています：
- 実装すべきファイル名
- 実装内容の詳細
- コード例
- データベーススキーマ変更（必要な場合）

---

## 🐛 トラブルシューティング

### ビルドエラー
```bash
# Prismaクライアントの再生成
npx prisma generate

# node_modulesを再インストール
rm -rf node_modules package-lock.json
npm install

# Next.jsキャッシュをクリア
rm -rf .next
npm run build
```

### テスト失敗
```bash
# キャッシュをクリア
npm test -- --clearCache

# 詳細なエラーメッセージを表示
npm test -- --reporter=verbose

# 特定のテストのみ実行してデバッグ
npm test -- textMatching --reporter=verbose
```

### 開発サーバーが起動しない
```bash
# ポート3000が使用中の場合
lsof -ti:3000 | xargs kill -9

# 別のポートで起動
PORT=3001 npm run dev
```

### データベース接続エラー
```bash
# .env.localを確認
cat .env.local | grep DATABASE_URL

# Prismaの接続テスト
npx prisma db pull

# データベースをリセット（開発環境のみ！）
npx prisma migrate reset
```

---

## ✅ セッション開始時のチェックリスト

```bash
# 1. ディレクトリ確認
pwd
# /Users/kohki_okumura/contractguard であることを確認

# 2. Gitの状態確認（オプション）
git status
git log --oneline -5

# 3. 環境変数の確認
cat .env.local | head -5

# 4. テスト実行
npm test

# 5. 開発サーバー起動
npm run dev
```

すべてが正常に動作したら、`PROGRESS_AND_TODO.md` で次のタスクを確認して実装開始！

---

## 💡 よくある質問

### Q: どのファイルから編集を始めればいい？

A: `PROGRESS_AND_TODO.md` の「今後の実装タスク」セクションを見てください。各タスクに推奨ファイル名が記載されています。

### Q: テストはいつ書くべき？

A: 新しいユーティリティ関数やロジックを追加したタイミングで書いてください。ファイル構造：
```
lib/utils/yourUtil.ts           # 実装
lib/utils/__tests__/yourUtil.test.ts  # テスト
```

### Q: AI分析をテストしたい

A: `.env.local` で以下を設定：
```env
# 本物のAI分析を使う
ANTHROPIC_API_KEY=your_api_key
USE_MOCK_AI=false

# モック分析を使う（APIキー不要、開発時推奨）
USE_MOCK_AI=true
```

### Q: ビルドは通るけど開発サーバーでエラーが出る

A: 以下を試してください：
```bash
# キャッシュをすべてクリア
rm -rf .next node_modules package-lock.json
npm install
npx prisma generate
npm run dev
```

---

## 📞 困ったときは

1. **まず確認**: `DEVELOPMENT_LOG.md` で最近の変更を確認
2. **次に確認**: `PROGRESS_AND_TODO.md` のトラブルシューティングセクション
3. **テスト実行**: `npm test` でどこが壊れているか特定
4. **ビルド確認**: `npm run build` でビルドエラーを確認

---

**Happy Coding! 🚀**

次回セッションでお会いしましょう！
