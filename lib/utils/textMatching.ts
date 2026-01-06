/**
 * テキストマッチングユーティリティ
 * AI提案のoriginalTextと実際の契約書テキストのマッチング精度を向上させる
 */

/**
 * テキストを正規化（空白、改行、全角半角、句読点の統一）
 */
export function normalizeText(text: string): string {
  return text
    // HTMLタグを除去
    .replace(/<[^>]*>/g, '')
    // 改行を空白に変換
    .replace(/[\r\n]+/g, ' ')
    // 全角スペースを半角に
    .replace(/　/g, ' ')
    // 全角数字を半角に
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    // 全角英字を半角に
    .replace(/[Ａ-Ｚａ-ｚ]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    // 全角記号を半角に（一部）
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/［/g, '[')
    .replace(/］/g, ']')
    .replace(/｛/g, '{')
    .replace(/｝/g, '}')
    .replace(/、/g, '、') // 全角のままにする（日本語文書のため）
    .replace(/。/g, '。') // 全角のままにする
    // 連続する空白を1つに
    .replace(/\s+/g, ' ')
    // 前後の空白を削除
    .trim();
}

/**
 * HTMLを含むテキストからプレーンテキストを抽出して正規化
 */
export function extractAndNormalize(html: string): string {
  // まずHTMLタグを除去
  const text = html.replace(/<[^>]*>/g, ' ');
  // 次に正規化
  return normalizeText(text);
}

/**
 * Levenshtein距離を計算（文字列の類似度を測定）
 * 戻り値: 0（完全一致）〜 max(str1.length, str2.length)（完全不一致）
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // メモリ効率化のため、1行のみを保持
  const matrix: number[] = Array(len2 + 1).fill(0).map((_, i) => i);

  for (let i = 1; i <= len1; i++) {
    let prev = i;
    for (let j = 1; j <= len2; j++) {
      const current = str1[i - 1] === str2[j - 1]
        ? matrix[j - 1]
        : Math.min(
            matrix[j - 1], // 置換
            prev,          // 挿入
            matrix[j]      // 削除
          ) + 1;
      matrix[j - 1] = prev;
      prev = current;
    }
    matrix[len2] = prev;
  }

  return matrix[len2];
}

/**
 * 2つの文字列の類似度を計算（0〜100のパーセンテージ）
 * 100 = 完全一致、0 = 完全不一致
 */
export function calculateSimilarity(str1: string, str2: string): number {
  const normalized1 = normalizeText(str1);
  const normalized2 = normalizeText(str2);

  if (normalized1 === normalized2) return 100;
  if (normalized1.length === 0 || normalized2.length === 0) return 0;

  const distance = levenshteinDistance(normalized1, normalized2);
  const maxLength = Math.max(normalized1.length, normalized2.length);
  const similarity = ((maxLength - distance) / maxLength) * 100;

  return Math.round(similarity);
}

/**
 * テキストが別のテキストに含まれているかチェック（正規化後）
 */
export function containsNormalized(haystack: string, needle: string): boolean {
  const normalizedHaystack = normalizeText(haystack);
  const normalizedNeedle = normalizeText(needle);
  return normalizedHaystack.includes(normalizedNeedle);
}

/**
 * HTMLコンテンツ内で最も類似度の高いテキストを見つける
 * @param htmlContent HTML形式のコンテンツ
 * @param targetText 検索対象のテキスト
 * @param minSimilarity 最低類似度（0-100）
 * @returns マッチしたHTMLタグとそのインデックス、類似度
 */
export interface MatchResult {
  tag: string;           // マッチしたHTMLタグ全体（例: <p>...</p>）
  tagName: string;       // タグ名（例: 'p', 'h3', 'li'）
  openTag: string;       // 開始タグ（例: '<p>'）
  innerText: string;     // タグ内のテキスト
  similarity: number;    // 類似度（0-100）
  startIndex: number;    // HTMLコンテンツ内の開始位置
  endIndex: number;      // HTMLコンテンツ内の終了位置
}

export function findBestMatch(
  htmlContent: string,
  targetText: string,
  minSimilarity: number = 70
): MatchResult | null {
  const normalizedTarget = normalizeText(targetText);
  let bestMatch: MatchResult | null = null;

  // h3, p, li タグを対象に検索
  const tagPatterns = [
    { regex: /<h3[^>]*>([^<]*(?:<[^/][^>]*>[^<]*<\/[^>]*>)*[^<]*)<\/h3>/gi, tagName: 'h3' },
    { regex: /<p[^>]*>([^<]*(?:<[^/][^>]*>[^<]*<\/[^>]*>)*[^<]*)<\/p>/gi, tagName: 'p' },
    { regex: /<li[^>]*>([^<]*(?:<[^/][^>]*>[^<]*<\/[^>]*>)*[^<]*)<\/li>/gi, tagName: 'li' },
  ];

  for (const { regex, tagName } of tagPatterns) {
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      const fullMatch = match[0];
      const innerText = match[1];
      const normalizedInner = normalizeText(innerText);

      // 開始タグを抽出（例: <p class="..."> から <p class="..."> を取得）
      const openTagMatch = fullMatch.match(new RegExp(`^<${tagName}[^>]*>`));
      const openTag = openTagMatch ? openTagMatch[0] : `<${tagName}>`;

      // 完全一致チェック
      if (normalizedInner === normalizedTarget) {
        return {
          tag: fullMatch,
          tagName,
          openTag,
          innerText,
          similarity: 100,
          startIndex: match.index,
          endIndex: match.index + fullMatch.length,
        };
      }

      // 部分一致チェック（targetがinnerに含まれる、またはその逆）
      if (normalizedInner.includes(normalizedTarget) || normalizedTarget.includes(normalizedInner)) {
        const similarity = normalizedInner.includes(normalizedTarget) ? 95 : 90;
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = {
            tag: fullMatch,
            tagName,
            openTag,
            innerText,
            similarity,
            startIndex: match.index,
            endIndex: match.index + fullMatch.length,
          };
        }
        continue;
      }

      // 類似度計算
      const similarity = calculateSimilarity(normalizedInner, normalizedTarget);

      if (similarity >= minSimilarity) {
        if (!bestMatch || similarity > bestMatch.similarity) {
          bestMatch = {
            tag: fullMatch,
            tagName,
            openTag,
            innerText,
            similarity,
            startIndex: match.index,
            endIndex: match.index + fullMatch.length,
          };
        }
      }
    }
  }

  return bestMatch;
}

/**
 * 先頭N文字でのマッチングを試みる（フォールバック用）
 */
export function findByPrefix(
  htmlContent: string,
  targetText: string,
  prefixLength: number = 15,
  minSimilarity: number = 80
): MatchResult | null {
  const prefix = normalizeText(targetText).slice(0, prefixLength);

  if (prefix.length < 5) return null; // 短すぎる場合は検索しない

  const tagPatterns = [
    { regex: /<h3[^>]*>([^<]*)<\/h3>/gi, tagName: 'h3' },
    { regex: /<p[^>]*>([^<]*)<\/p>/gi, tagName: 'p' },
    { regex: /<li[^>]*>([^<]*)<\/li>/gi, tagName: 'li' },
  ];

  let bestMatch: MatchResult | null = null;

  for (const { regex, tagName } of tagPatterns) {
    let match;
    while ((match = regex.exec(htmlContent)) !== null) {
      const fullMatch = match[0];
      const innerText = match[1];
      const normalizedInner = normalizeText(innerText);

      // 開始タグを抽出
      const openTagMatch = fullMatch.match(new RegExp(`^<${tagName}[^>]*>`));
      const openTag = openTagMatch ? openTagMatch[0] : `<${tagName}>`;

      if (normalizedInner.startsWith(prefix)) {
        const similarity = calculateSimilarity(normalizedInner, normalizeText(targetText));
        if (similarity >= minSimilarity) {
          if (!bestMatch || similarity > bestMatch.similarity) {
            bestMatch = {
              tag: fullMatch,
              tagName,
              openTag,
              innerText,
              similarity,
              startIndex: match.index,
              endIndex: match.index + fullMatch.length,
            };
          }
        }
      }
    }
  }

  return bestMatch;
}

/**
 * デバッグ用：マッチング詳細を表示
 */
export function debugMatch(original: string, target: string) {
  console.log('=== Debug Match ===');
  console.log('Original:', original);
  console.log('Target:', target);
  console.log('Normalized Original:', normalizeText(original));
  console.log('Normalized Target:', normalizeText(target));
  console.log('Similarity:', calculateSimilarity(original, target), '%');
  console.log('Contains:', containsNormalized(original, target));
}
