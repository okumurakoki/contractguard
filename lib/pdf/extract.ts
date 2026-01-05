import { extractText, getDocumentProxy } from 'unpdf';

export interface ExtractedContent {
  text: string;
  numPages: number;
  info: {
    title?: string;
    author?: string;
    creationDate?: Date;
  };
}

/**
 * PDFからテキストを抽出する
 */
export async function extractTextFromPdf(buffer: Buffer): Promise<ExtractedContent> {
  try {
    const uint8Array = new Uint8Array(buffer);
    const pdf = await getDocumentProxy(uint8Array);
    const { totalPages, text } = await extractText(pdf, { mergePages: true });

    // メタ情報を取得
    const metadata = await pdf.getMetadata().catch(() => null);
    const info = metadata?.info as Record<string, unknown> | undefined;

    return {
      text: text as string,
      numPages: totalPages,
      info: {
        title: info?.Title as string | undefined,
        author: info?.Author as string | undefined,
        creationDate: info?.CreationDate
          ? new Date(info.CreationDate as string)
          : undefined,
      },
    };
  } catch (error) {
    console.error('PDF parse error:', error);
    throw new Error('PDFの解析に失敗しました');
  }
}

/**
 * テキストをHTML形式に変換（契約書構造を認識して整形）
 */
export function textToHtml(text: string): string {
  // まず契約書の構造に基づいて改行を挿入
  let processed = text;

  // 条項タイトルの前に改行を挿入（第1条、第2条など）
  processed = processed.replace(/(第[0-9０-９一二三四五六七八九十百]+条[（(][^）)]+[）)])/g, '\n\n$1\n');

  // 項番号の前に改行（1. 2. 3. など）
  processed = processed.replace(/\s+(\d+[.．]\s)/g, '\n$1');

  // (1) (2) などの前に改行
  processed = processed.replace(/\s+([（(]\d+[）)]\s)/g, '\n$1');

  // 条文内の項（2 乙は〜、3 その他〜 など）
  processed = processed.replace(/\s+(\d+\s+(?:甲|乙|前項|その他|本|当該))/g, '\n$1');

  // 契約書タイトルの後に改行
  processed = processed.replace(/(契約書)\s+/g, '$1\n\n');

  // 「甲」「乙」の署名欄
  processed = processed.replace(/\s+(甲\s*住所)/g, '\n\n$1');
  processed = processed.replace(/\s+(乙\s*住所)/g, '\n\n$1');

  // 「本契約締結の証として」の前に改行（署名欄セクションの開始）
  processed = processed.replace(/\s+(本契約締結の証として)/g, '\n\n---SIGNATURE_SECTION_START---\n\n$1');

  // 日付の前に改行（署名欄内）
  processed = processed.replace(/。\s*(令和|平成|昭和)/g, '。\n\n$1');

  // 署名欄の「甲」「乙」の前に明確な改行
  processed = processed.replace(/(\d+日)\s*(甲)/g, '$1\n\n$2');
  processed = processed.replace(/(印)\s*(乙)/g, '$1\n\n$2');

  // 署名欄の整形
  processed = processed.replace(/\s+(住所[：:])/g, '\n$1');
  processed = processed.replace(/\s+(名称[：:])/g, '\n$1');
  processed = processed.replace(/\s+(代表者[：:])/g, '\n$1');

  // 「印」を独立した行として分離
  processed = processed.replace(/(代表者[：:][^\n印]*)\s*(印)/g, '$1\n$2');
  processed = processed.replace(/([^\s\n])(印)(\s|$)/g, '$1\n$2$3');

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
