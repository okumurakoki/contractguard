import DiffMatchPatch from 'diff-match-patch';

export type DiffType = -1 | 0 | 1; // DELETE, EQUAL, INSERT
export type Diff = [DiffType, string];

/**
 * テキストを正規化（比較用）
 */
function normalizeForComparison(text: string): string {
  return text
    // 全角スペースを半角に
    .replace(/　/g, ' ')
    // 連続するスペースを1つに
    .replace(/\s+/g, ' ')
    // 前後の空白を削除
    .trim();
}

/**
 * 変更部分のみをハイライトしたHTMLを生成
 * - 削除部分: <del>タグで囲む
 * - 追加部分: <ins>タグで囲む
 * - 変更なし: そのまま出力
 */
export function applyPartialChanges(
  originalText: string,
  suggestedText: string,
  options: {
    showDeletions?: boolean;
    insertClass?: string;
    deleteClass?: string;
  } = {}
): string {
  const {
    showDeletions = true,
    insertClass = 'track-insertion track-pending',
    deleteClass = 'track-deletion',
  } = options;

  // テキストを正規化して比較
  const normalizedOriginal = normalizeForComparison(originalText);
  const normalizedSuggested = normalizeForComparison(suggestedText);

  // 差分を計算
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(normalizedOriginal, normalizedSuggested);

  // セマンティッククリーンアップ（単語レベルの差分に調整）
  dmp.diff_cleanupSemantic(diffs);

  // 効率的なクリーンアップ（小さな変更をマージ）
  dmp.diff_cleanupEfficiency(diffs);

  const parts: string[] = [];

  for (const [type, text] of diffs) {
    // HTMLエスケープ
    const escapedText = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    if (type === 0) {
      // 変更なし
      parts.push(escapedText);
    } else if (type === 1) {
      // 追加
      parts.push(`<ins class="${insertClass}" style="background-color: #dcfce7; text-decoration: none;">${escapedText}</ins>`);
    } else if (type === -1 && showDeletions) {
      // 削除
      parts.push(`<del class="${deleteClass}" style="background-color: #fee2e2; text-decoration: line-through;">${escapedText}</del>`);
    }
    // showDeletions=false の場合、削除部分は出力しない
  }

  return parts.join('');
}

/**
 * 変更があるかどうかを判定
 */
export function hasChanges(originalText: string, suggestedText: string): boolean {
  const diffs = computeDiff(originalText, suggestedText);
  return diffs.some(([type]) => type !== 0);
}

/**
 * 変更部分のみを抽出
 */
export function extractChanges(originalText: string, suggestedText: string): {
  deletions: string[];
  insertions: string[];
} {
  const diffs = computeDiff(originalText, suggestedText);
  const deletions: string[] = [];
  const insertions: string[] = [];

  for (const [type, text] of diffs) {
    if (type === -1 && text.trim()) {
      deletions.push(text);
    } else if (type === 1 && text.trim()) {
      insertions.push(text);
    }
  }

  return { deletions, insertions };
}

/**
 * 2つのテキストの差分を計算
 */
export function computeDiff(text1: string, text2: string): Diff[] {
  const dmp = new DiffMatchPatch();
  const diffs = dmp.diff_main(text1, text2);
  dmp.diff_cleanupSemantic(diffs);
  return diffs as Diff[];
}

/**
 * 差分統計を計算
 */
export function computeDiffStats(diffs: Diff[]): {
  added: number;
  removed: number;
  unchanged: number;
  changePercentage: number;
} {
  let added = 0;
  let removed = 0;
  let unchanged = 0;

  for (const [type, text] of diffs) {
    const chars = text.length;
    if (type === 1) added += chars;
    else if (type === -1) removed += chars;
    else unchanged += chars;
  }

  const total = added + removed + unchanged;
  const changePercentage = total > 0 ? ((added + removed) / total) * 100 : 0;

  return { added, removed, unchanged, changePercentage };
}

/**
 * HTMLタグを除去
 */
export function stripHtml(html: string): string {
  // サーバーサイドでも動作するように正規表現を使用
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * 差分をHTMLに変換
 */
export function diffToHtml(diffs: Diff[]): string {
  return diffs
    .map(([type, text]) => {
      const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br>');

      if (type === 1) {
        return `<ins style="background-color:#dcfce7;text-decoration:none;">${escapedText}</ins>`;
      } else if (type === -1) {
        return `<del style="background-color:#fee2e2;text-decoration:line-through;">${escapedText}</del>`;
      }
      return escapedText;
    })
    .join('');
}

/**
 * 行単位の差分を計算
 */
export function computeLineDiff(text1: string, text2: string): {
  type: 'added' | 'removed' | 'unchanged' | 'modified';
  content: string;
  oldContent?: string;
}[] {
  const lines1 = text1.split('\n');
  const lines2 = text2.split('\n');
  const result: {
    type: 'added' | 'removed' | 'unchanged' | 'modified';
    content: string;
    oldContent?: string;
  }[] = [];

  const maxLines = Math.max(lines1.length, lines2.length);

  for (let i = 0; i < maxLines; i++) {
    const line1 = lines1[i];
    const line2 = lines2[i];

    if (line1 === undefined) {
      result.push({ type: 'added', content: line2 });
    } else if (line2 === undefined) {
      result.push({ type: 'removed', content: line1 });
    } else if (line1 === line2) {
      result.push({ type: 'unchanged', content: line1 });
    } else {
      result.push({ type: 'modified', content: line2, oldContent: line1 });
    }
  }

  return result;
}

/**
 * 類似度を計算（0-100）
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const diffs = computeDiff(text1, text2);
  const stats = computeDiffStats(diffs);
  return Math.round(100 - stats.changePercentage);
}
