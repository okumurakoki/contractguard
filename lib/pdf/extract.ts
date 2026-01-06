import { extractText, getDocumentProxy } from 'unpdf';
import Tesseract from 'tesseract.js';

export interface ExtractedContent {
  text: string;
  numPages: number;
  info: {
    title?: string;
    author?: string;
    creationDate?: Date;
  };
  extractionMethod: 'text' | 'ocr';
  ocrConfidence?: number;
}

/**
 * PDFからテキストを抽出する
 * スキャンPDFの場合は自動的にOCRにフォールバック
 */
export async function extractTextFromPdf(
  buffer: Buffer,
  options: { forceOcr?: boolean; ocrLanguage?: string } = {}
): Promise<ExtractedContent> {
  const { forceOcr = false, ocrLanguage = 'jpn+eng' } = options;

  try {
    const uint8Array = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(uint8Array);
    const { totalPages, text } = await extractText(pdf, { mergePages: true });

    // メタ情報を取得
    const metadata = await pdf.getMetadata().catch(() => null);
    const info = metadata?.info as Record<string, unknown> | undefined;

    const extractedText = text as string;

    // テキスト抽出が有効かチェック（スキャンPDFの場合は無効）
    if (!forceOcr && isValidExtraction(extractedText)) {
      return {
        text: extractedText,
        numPages: totalPages,
        info: {
          title: info?.Title as string | undefined,
          author: info?.Author as string | undefined,
          creationDate: info?.CreationDate
            ? new Date(info.CreationDate as string)
            : undefined,
        },
        extractionMethod: 'text',
      };
    }

    // スキャンPDFの場合はOCRにフォールバック
    console.log('Text extraction insufficient, falling back to OCR...');
    const ocrResult = await extractTextWithOcr(buffer, ocrLanguage);

    return {
      text: ocrResult.text,
      numPages: totalPages,
      info: {
        title: info?.Title as string | undefined,
        author: info?.Author as string | undefined,
        creationDate: info?.CreationDate
          ? new Date(info.CreationDate as string)
          : undefined,
      },
      extractionMethod: 'ocr',
      ocrConfidence: ocrResult.confidence,
    };
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('PDFの解析に失敗しました');
  }
}

/**
 * OCRでPDFからテキストを抽出する
 */
async function extractTextWithOcr(
  buffer: Buffer,
  language: string = 'jpn+eng'
): Promise<{ text: string; confidence: number }> {
  try {
    // pdf-to-imgを動的インポート（ESMモジュール）
    const { pdf } = await import('pdf-to-img');

    const pages: string[] = [];
    let totalConfidence = 0;
    let pageCount = 0;

    // PDFの各ページを画像に変換してOCR
    const document = await pdf(buffer, { scale: 2.0 }); // 高解像度で変換

    for await (const image of document) {
      const result = await Tesseract.recognize(image, language, {
        logger: (m) => {
          if (m.status === 'recognizing text') {
            console.log(`OCR progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      pages.push(result.data.text);
      totalConfidence += result.data.confidence;
      pageCount++;
    }

    return {
      text: pages.join('\n\n--- ページ区切り ---\n\n'),
      confidence: pageCount > 0 ? totalConfidence / pageCount : 0,
    };
  } catch (error) {
    console.error('OCR error:', error);
    throw new Error('OCRによるテキスト抽出に失敗しました');
  }
}

/**
 * テキストをHTML形式に変換（契約書構造を認識して整形）
 * 注意: enhancedTextProcessingで処理済みのテキストを受け取ることを想定
 */
export function textToHtml(text: string): string {
  // 署名欄セクションのマーカーを挿入
  let processed = text;

  // 「本契約締結の証として」の前に署名欄マーカーを挿入
  if (!processed.includes('---SIGNATURE_SECTION_START---')) {
    processed = processed.replace(/(本契約締結の証として)/g, '\n---SIGNATURE_SECTION_START---\n$1');
  }

  // HTMLエスケープ
  const escaped = processed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 改行をHTMLに変換
  const lines = escaped.split('\n');
  const htmlLines: string[] = [];

  let inSignatureSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '') {
      continue;
    }

    // 署名欄セクションの開始マーカー
    if (trimmed === '---SIGNATURE_SECTION_START---') {
      inSignatureSection = true;
      htmlLines.push('<div class="signature-section" style="margin-top: 3em; border-top: 1px solid #ccc; padding-top: 2em;">');
      continue;
    }

    // 契約書タイトル（短い「〇〇契約書」）
    if (/^[^\s]{2,10}契約書$/.test(trimmed)) {
      htmlLines.push(`<h1>${trimmed}</h1>`);
      continue;
    }

    // 条タイトル
    if (/^第[0-9０-９一二三四五六七八九十百]+条[（(]/.test(trimmed)) {
      htmlLines.push(`<h3>${trimmed}</h3>`);
      continue;
    }

    // 番号付き項目（1. 2. 3.）
    if (/^[0-9０-９]+[.．]\s/.test(trimmed)) {
      htmlLines.push(`<p style="margin-left: 2em; text-indent: -1em;">${trimmed}</p>`);
      continue;
    }

    // (1) (2) などの項目
    if (/^[（(][0-9０-９]+[）)]/.test(trimmed)) {
      htmlLines.push(`<p style="margin-left: 2em; text-indent: -1.5em;">${trimmed}</p>`);
      continue;
    }

    // 署名欄の甲・乙
    if (/^甲\s*$/.test(trimmed) || /^乙\s*$/.test(trimmed)) {
      htmlLines.push(`<p style="margin-top: 1.5em; font-weight: bold;">${trimmed}</p>`);
      continue;
    }

    // 住所・名称・代表者
    if (/^(住所|名称|代表者)[：:]/.test(trimmed)) {
      htmlLines.push(`<p style="margin-left: 1em;">${trimmed}</p>`);
      continue;
    }

    // 「印」を独立した右寄せ要素として表示
    if (/^印\s*$/.test(trimmed)) {
      htmlLines.push(`<p style="text-align: right; margin-right: 2em; font-weight: bold;">${trimmed}</p>`);
      continue;
    }

    // 日付
    if (/^(令和|平成|昭和)[0-9０-９]+年/.test(trimmed)) {
      htmlLines.push(`<p style="text-align: center; margin: 2em 0;">${trimmed}</p>`);
      continue;
    }

    // 通常の段落
    htmlLines.push(`<p>${trimmed}</p>`);
  }

  // 署名欄セクションが開いていれば閉じる
  if (inSignatureSection) {
    htmlLines.push('</div>');
  }

  return htmlLines.join('\n');
}

/**
 * 抽出したテキストが有効かどうかを判定
 * スキャンPDFの場合、テキストが抽出できないことがある
 */
export function isValidExtraction(text: string): boolean {
  // 最低100文字以上、日本語または英語の文字が含まれている
  if (text.length < 100) return false;

  // 日本語文字（ひらがな、カタカナ、漢字）が含まれているか
  const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF]/.test(text);
  // 英語の単語が含まれているか
  const hasEnglish = /[a-zA-Z]{3,}/.test(text);

  return hasJapanese || hasEnglish;
}

/**
 * 表形式のテキストを検出してHTMLテーブルに変換
 */
export function detectAndConvertTables(text: string): string {
  // 表の検出パターン
  // 1. タブ区切りの行が連続する場合
  // 2. |で区切られた行が連続する場合
  // 3. 複数のスペースで区切られた整列されたデータ

  const lines = text.split('\n');
  const result: string[] = [];
  let tableBuffer: string[][] = [];
  let inTable = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const tableRow = parseTableRow(line);

    if (tableRow && tableRow.length >= 2) {
      // テーブル行として認識
      if (!inTable) {
        inTable = true;
        tableBuffer = [];
      }
      tableBuffer.push(tableRow);
    } else {
      // テーブル行ではない
      if (inTable && tableBuffer.length >= 2) {
        // 蓄積したテーブルをHTMLに変換
        result.push(convertTableToHtml(tableBuffer));
      } else if (tableBuffer.length === 1) {
        // 1行だけならテーブルとして扱わない
        result.push(tableBuffer[0].join(' '));
      }
      tableBuffer = [];
      inTable = false;
      result.push(line);
    }
  }

  // 最後にテーブルが残っている場合
  if (inTable && tableBuffer.length >= 2) {
    result.push(convertTableToHtml(tableBuffer));
  } else if (tableBuffer.length === 1) {
    result.push(tableBuffer[0].join(' '));
  }

  return result.join('\n');
}

/**
 * 行をテーブル行としてパースする
 */
function parseTableRow(line: string): string[] | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  // パイプ区切り（| cell | cell |）
  if (trimmed.includes('|')) {
    const cells = trimmed
      .split('|')
      .map((c) => c.trim())
      .filter((c) => c !== '');
    if (cells.length >= 2) return cells;
  }

  // タブ区切り
  if (trimmed.includes('\t')) {
    const cells = trimmed
      .split('\t')
      .map((c) => c.trim())
      .filter((c) => c !== '');
    if (cells.length >= 2) return cells;
  }

  // 複数スペース区切り（3つ以上のスペース）
  const spaceSplit = trimmed.split(/\s{3,}/);
  if (spaceSplit.length >= 2) {
    return spaceSplit.map((c) => c.trim()).filter((c) => c !== '');
  }

  return null;
}

/**
 * テーブルデータをHTMLテーブルに変換
 */
function convertTableToHtml(rows: string[][]): string {
  if (rows.length === 0) return '';

  // 最大列数を取得
  const maxCols = Math.max(...rows.map((r) => r.length));

  // 各行の列数を統一
  const normalizedRows = rows.map((row) => {
    const newRow = [...row];
    while (newRow.length < maxCols) {
      newRow.push('');
    }
    return newRow;
  });

  // HTMLテーブルを生成
  const tableHtml = [
    '<table style="border-collapse: collapse; width: 100%; margin: 1em 0;">',
  ];

  // 最初の行をヘッダーとして扱う（オプション）
  const hasHeader = isLikelyHeader(normalizedRows[0]);

  normalizedRows.forEach((row, index) => {
    const isHeader = hasHeader && index === 0;
    const tag = isHeader ? 'th' : 'td';
    const style = isHeader
      ? 'style="border: 1px solid #ddd; padding: 8px; background-color: #f5f5f5; font-weight: bold;"'
      : 'style="border: 1px solid #ddd; padding: 8px;"';

    tableHtml.push('  <tr>');
    row.forEach((cell) => {
      tableHtml.push(`    <${tag} ${style}>${escapeHtml(cell)}</${tag}>`);
    });
    tableHtml.push('  </tr>');
  });

  tableHtml.push('</table>');

  return tableHtml.join('\n');
}

/**
 * 行がヘッダー行かどうかを判定
 */
function isLikelyHeader(row: string[]): boolean {
  // 一般的なヘッダーキーワード
  const headerKeywords = [
    '項目',
    '名称',
    '内容',
    '金額',
    '数量',
    '単価',
    '備考',
    '日付',
    '担当',
    'No',
    'ID',
    '番号',
    '種別',
    '区分',
  ];

  return row.some((cell) =>
    headerKeywords.some((keyword) => cell.includes(keyword))
  );
}

/**
 * HTMLエスケープ
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * ヘッダー・フッターを除外する
 */
export function removeHeadersAndFooters(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];

  // ページ番号パターン
  const pageNumberPatterns = [
    /^[\s]*[-－ー―]?\s*\d+\s*[-－ー―]?[\s]*$/, // - 1 - 形式
    /^[\s]*\d+\s*\/\s*\d+[\s]*$/, // 1/10 形式
    /^[\s]*Page\s*\d+[\s]*$/i, // Page 1 形式
    /^[\s]*第?\s*\d+\s*ページ[\s]*$/, // 第1ページ 形式
  ];

  // ヘッダー/フッターによくあるパターン
  const headerFooterPatterns = [
    /^[\s]*©.*$/i, // コピーライト
    /^[\s]*confidential[\s]*$/i, // 機密表示
    /^[\s]*秘密[\s]*$/,
    /^[\s]*社外秘[\s]*$/,
    /^[\s]*取扱注意[\s]*$/,
  ];

  for (const line of lines) {
    const trimmed = line.trim();

    // ページ番号をスキップ
    if (pageNumberPatterns.some((p) => p.test(trimmed))) {
      continue;
    }

    // ヘッダー/フッターパターンをスキップ
    if (headerFooterPatterns.some((p) => p.test(trimmed))) {
      continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * 段組みレイアウトを検出して単一カラムに変換
 */
export function normalizeColumnLayout(text: string): string {
  // 段組みの検出は複雑なため、基本的なヒューリスティックを使用
  // 短い行が交互に現れる場合は段組みの可能性がある

  const lines = text.split('\n');
  const avgLength =
    lines.reduce((sum, l) => sum + l.length, 0) / lines.length || 50;

  // 短い行（平均の半分以下）が連続する場合は段組みの可能性
  let shortLineCount = 0;
  let totalLines = 0;

  for (const line of lines) {
    if (line.trim()) {
      totalLines++;
      if (line.length < avgLength * 0.5) {
        shortLineCount++;
      }
    }
  }

  // 短い行が全体の40%以上なら段組みの可能性
  const isLikelyMultiColumn =
    totalLines > 10 && shortLineCount / totalLines > 0.4;

  if (!isLikelyMultiColumn) {
    return text;
  }

  // 段組みの場合、短い行を結合
  const result: string[] = [];
  let buffer = '';

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed) {
      if (buffer) {
        result.push(buffer);
        buffer = '';
      }
      result.push('');
      continue;
    }

    // 文の終わりかどうかをチェック
    const endsWithPunctuation = /[。．.!！?？]$/.test(trimmed);

    if (buffer) {
      buffer += ' ' + trimmed;
    } else {
      buffer = trimmed;
    }

    if (endsWithPunctuation || line.length > avgLength * 0.8) {
      result.push(buffer);
      buffer = '';
    }
  }

  if (buffer) {
    result.push(buffer);
  }

  return result.join('\n');
}

/**
 * 不要なスペースを正規化
 * - 行末の半角スペースを削除
 * - 行頭の半角スペースを削除（継続行の結合用）
 * - 複数の半角スペースを1つに統一
 * - 全角スペースと半角スペースの混在を整理
 */
export function normalizeSpaces(text: string): string {
  let processed = text;

  // 行末の半角スペースを削除
  processed = processed.replace(/[ \t]+$/gm, '');

  // 行頭の半角スペースを削除（ただしインデントは保持）
  processed = processed.replace(/^[ \t]+/gm, (match) => {
    // 2スペース以上のインデントは全角スペース1つに変換
    if (match.length >= 2) {
      return '　';
    }
    return '';
  });

  // 日本語文字間の不要なスペースを削除
  // 例: "条 件" → "条件", "情 報" → "情報"
  processed = processed.replace(
    /([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF])[ 　]+([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF])/g,
    '$1$2'
  );

  // 句読点前後の不要なスペースを削除
  processed = processed.replace(/[ 　]+([、。，．])/g, '$1');
  processed = processed.replace(/([、。，．])[ 　]+/g, '$1');

  // 括弧前後の不要なスペースを削除（日本語括弧）
  processed = processed.replace(/[ 　]+([（）「」『』【】])/g, '$1');
  processed = processed.replace(/([（）「」『』【】])[ 　]+/g, '$1');

  // 複数の半角スペースを1つに（ただし全角スペースは保持）
  processed = processed.replace(/  +/g, ' ');

  return processed;
}

/**
 * 契約書の段落構造を検出して改行を適切に挿入
 */
export function detectParagraphStructure(text: string): string {
  let processed = text;

  // 条項番号パターン（第1条、第2条など）の前に2行改行
  processed = processed.replace(
    /([。」』\n])[ 　]*(第[0-9０-９一二三四五六七八九十百]+条)/g,
    '$1\n\n$2'
  );

  // 項番号パターン（1. 2. など）の前に改行
  processed = processed.replace(
    /([。」』])[ 　]*(\d+[.．][ 　]*[^\d])/g,
    '$1\n$2'
  );

  // 号番号パターン（(1) (2) など）の前に改行
  processed = processed.replace(
    /([。」』])[ 　]*([（(][0-9０-９]+[）)])/g,
    '$1\n$2'
  );

  // ただし、文中の括弧数字は改行しない（前が句点でない場合）
  // 上の処理で改行された後、不要な改行を除去
  processed = processed.replace(
    /([^。」』\n])\n([（(][0-9０-９]+[）)])/g,
    '$1$2'
  );

  return processed;
}

/**
 * 継続行を結合（PDFで改行された長い文を復元）
 */
export function joinContinuationLines(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let buffer = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      // 空行は段落の区切り
      if (buffer) {
        result.push(buffer);
        buffer = '';
      }
      result.push('');
      continue;
    }

    // テーブル行（|区切り、タブ区切り）は結合しない
    const isTableLine = line.includes('|') || line.includes('\t') || /\s{3,}/.test(line);
    if (isTableLine) {
      if (buffer) {
        result.push(buffer);
        buffer = '';
      }
      result.push(line);
      continue;
    }

    // 条項タイトル、番号付き項目は新しい段落として開始
    const isNewParagraph =
      /^第[0-9０-９一二三四五六七八九十百]+条/.test(line) ||
      /^[0-9０-９]+[.．]/.test(line) ||
      /^[（(][0-9０-９]+[）)]/.test(line) ||
      /^[一二三四五六七八九十][、.]/.test(line);

    if (isNewParagraph) {
      if (buffer) {
        result.push(buffer);
      }
      buffer = line;
      continue;
    }

    // 前の行が句点・括弧で終わっていれば新しい文
    if (buffer && /[。」』]$/.test(buffer)) {
      result.push(buffer);
      buffer = line;
      continue;
    }

    // 継続行として結合
    if (buffer) {
      buffer += line;
    } else {
      buffer = line;
    }
  }

  if (buffer) {
    result.push(buffer);
  }

  return result.join('\n');
}

/**
 * 高度なテキスト抽出（すべての改善を適用）
 */
export function enhancedTextProcessing(text: string): string {
  let processed = text;

  // 1. ヘッダー・フッターを除外
  processed = removeHeadersAndFooters(processed);

  // 2. スペースを正規化（日本語文字間の不要スペース削除）
  processed = normalizeSpaces(processed);

  // 3. 継続行を結合（PDFで分割された文を復元）
  processed = joinContinuationLines(processed);

  // 4. 段落構造を検出して改行を挿入
  processed = detectParagraphStructure(processed);

  // 5. 段組みレイアウトを正規化
  processed = normalizeColumnLayout(processed);

  // 6. 表形式を検出して変換
  processed = detectAndConvertTables(processed);

  // 7. 最終的なスペース正規化
  processed = normalizeSpaces(processed);

  return processed;
}
