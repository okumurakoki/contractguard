/**
 * 契約書の構造化データ型定義
 * 契約書をJSON形式で保存し、確実な編集・AI連携を実現
 */

/**
 * 契約書全体の構造
 */
export interface ContractStructure {
  /** バージョン（将来の互換性のため） */
  version: 1;

  /** 契約書タイトル（例: 機密保持契約書） */
  title: string;

  /** 前文（「甲と乙は以下の通り契約を締結する」など） */
  preamble?: string;

  /** 条項リスト */
  articles: Article[];

  /** 署名欄 */
  signature?: SignatureSection;

  /** メタデータ */
  metadata: {
    /** 抽出日時 */
    extractedAt: string;
    /** 抽出方法 */
    extractionMethod: 'text' | 'ocr';
    /** 元のファイル名 */
    sourceFileName?: string;
    /** ページ数 */
    pageCount?: number;
  };
}

/**
 * 条項（第X条）
 */
export interface Article {
  /** 一意識別子（UUID） */
  id: string;

  /** 条項番号（1, 2, 3...） */
  number: number;

  /** 条項タイトル（「秘密保持」「損害賠償」など） */
  title: string;

  /** 項リスト */
  paragraphs: Paragraph[];
}

/**
 * 項（1. 2. 3. または番号なしの段落）
 */
export interface Paragraph {
  /** 一意識別子（UUID） */
  id: string;

  /** 項番号（1, 2, 3... または null で番号なし） */
  number: number | null;

  /** 本文 */
  content: string;

  /** 号リスト（(1), (2)... がある場合） */
  items?: Item[];
}

/**
 * 号（(1), (2), (3)...）
 */
export interface Item {
  /** 一意識別子（UUID） */
  id: string;

  /** 号番号 */
  number: number;

  /** 本文 */
  content: string;
}

/**
 * 署名欄
 */
export interface SignatureSection {
  /** 契約締結の文言（「本契約締結の証として...」） */
  closingText?: string;

  /** 日付 */
  date?: string;

  /** 当事者情報 */
  parties: Party[];
}

/**
 * 当事者情報
 */
export interface Party {
  /** 役割（甲、乙、丙） */
  role: '甲' | '乙' | '丙' | string;

  /** 住所 */
  address?: string;

  /** 名称（会社名） */
  name?: string;

  /** 代表者 */
  representative?: string;
}

// ============================================================
// AI提案用の型
// ============================================================

/**
 * AI分析結果のリスク項目（構造化データ対応版）
 */
export interface StructuredRiskItem {
  /** リスクの種類 */
  riskType: string;

  /** リスクレベル */
  riskLevel: 'high' | 'medium' | 'low';

  /** 対象の条項番号 */
  articleNumber: number;

  /** 対象の項番号（オプション） */
  paragraphNumber?: number;

  /** 対象の号番号（オプション） */
  itemNumber?: number;

  /** 問題の説明 */
  reason: string;

  /** 法的根拠 */
  legalBasis?: string;

  /** 修正案（条項/項/号 全体の新しいテキスト） */
  suggestedContent: string;
}

/**
 * AI分析結果全体
 */
export interface StructuredAnalysisResult {
  /** リスクレベル */
  riskLevel: 'high' | 'medium' | 'low';

  /** 総合スコア（0-100） */
  overallScore: number;

  /** リスク項目リスト */
  risks: StructuredRiskItem[];

  /** チェックリスト結果 */
  checklist?: ChecklistItem[];
}

/**
 * チェックリスト項目
 */
export interface ChecklistItem {
  /** 項目名 */
  label: string;

  /** チェック状態 */
  status: 'present' | 'missing' | 'warning';

  /** 関連する条項番号 */
  articleNumber?: number;

  /** コメント */
  comment?: string;
}

// ============================================================
// ユーティリティ型
// ============================================================

/**
 * 条項の変更操作
 */
export type ArticleOperation =
  | { type: 'update'; articleNumber: number; newContent: Partial<Article> }
  | { type: 'delete'; articleNumber: number }
  | { type: 'insert'; afterArticleNumber: number; article: Omit<Article, 'id'> };

/**
 * 項の変更操作
 */
export type ParagraphOperation =
  | { type: 'update'; articleNumber: number; paragraphNumber: number; newContent: string }
  | { type: 'delete'; articleNumber: number; paragraphNumber: number }
  | { type: 'insert'; articleNumber: number; afterParagraphNumber: number; content: string };
