/**
 * 契約書テキストを構造化データに変換するパーサー
 */

import { v4 as uuidv4 } from 'uuid';
import {
  ContractStructure,
  Article,
  Paragraph,
  Item,
  SignatureSection,
  Party,
} from './types';

/**
 * テキストを構造化データに変換
 */
export function parseContractText(
  text: string,
  options: {
    sourceFileName?: string;
    extractionMethod?: 'text' | 'ocr';
    pageCount?: number;
  } = {}
): ContractStructure {
  // 前処理：空白の正規化
  const normalizedText = normalizeText(text);

  // タイトルを抽出
  const title = extractTitle(normalizedText);

  // 署名欄を分離
  const { mainContent, signatureSection } = separateSignatureSection(normalizedText);

  // 前文と条項を分離
  const { preamble, articlesText } = separatePreamble(mainContent);

  // 条項をパース
  const articles = parseArticles(articlesText);

  return {
    version: 1,
    title,
    preamble: preamble || undefined,
    articles,
    signature: signatureSection || undefined,
    metadata: {
      extractedAt: new Date().toISOString(),
      extractionMethod: options.extractionMethod || 'text',
      sourceFileName: options.sourceFileName,
      pageCount: options.pageCount,
    },
  };
}

/**
 * テキストを正規化
 */
function normalizeText(text: string): string {
  return text
    // 全角数字を半角に
    .replace(/[０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
    // 日本語間の不要なスペースを削除
    .replace(
      /([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF])[ 　]+([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FFF])/g,
      '$1$2'
    )
    // 連続する空白を1つに
    .replace(/[ 　]+/g, ' ')
    // 連続する改行を2つまでに
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * 契約書タイトルを抽出
 */
function extractTitle(text: string): string {
  // 「〇〇契約書」パターンを探す
  const titleMatch = text.match(/^(.{2,20}契約書)/m);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // 「〇〇契約」パターン
  const contractMatch = text.match(/^(.{2,20}契約)(?:\s|$)/m);
  if (contractMatch) {
    return contractMatch[1].trim();
  }

  // 最初の行をタイトルとして使用
  const firstLine = text.split('\n')[0]?.trim();
  if (firstLine && firstLine.length <= 30) {
    return firstLine;
  }

  return '契約書';
}

/**
 * 署名欄を分離
 */
function separateSignatureSection(text: string): {
  mainContent: string;
  signatureSection: SignatureSection | null;
} {
  // 署名欄の開始パターン（より確実なパターン）
  const signaturePatterns = [
    /以上[、,\s]*本契約[のに]?[（(]?成立[）)]?[のを]?証[するとし]/,
    /本契約[のに]?[（(]?成立[）)]?[のを]?証[するとし]/,
    /本契約締結の証として/,
    /以上[、,\s]*本書[を\d]+通/,
  ];

  let signatureStartIndex = -1;

  for (const pattern of signaturePatterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      signatureStartIndex = match.index;
      break;
    }
  }

  if (signatureStartIndex === -1) {
    return { mainContent: text, signatureSection: null };
  }

  const mainContent = text.substring(0, signatureStartIndex).trim();
  const signatureText = text.substring(signatureStartIndex);

  // 署名欄をパース
  const signatureSection = parseSignatureSection(signatureText);

  return { mainContent, signatureSection };
}

/**
 * 署名欄をパース（シンプルに）
 */
function parseSignatureSection(text: string): SignatureSection {
  // 最初の文（結び文）を取得
  const firstSentenceMatch = text.match(/^[^。]+。/);
  const closingText = firstSentenceMatch ? firstSentenceMatch[0] : '';

  // 日付を抽出（和暦・西暦両方対応）
  const datePatterns = [
    /(令和|平成|昭和)\s*\d+\s*年\s*\d+\s*月\s*\d+\s*日/,
    /\d{4}\s*年\s*\d{1,2}\s*月\s*\d{1,2}\s*日/,
  ];
  let date: string | undefined;
  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      date = match[0].replace(/\s+/g, '');
      break;
    }
  }

  // 甲・乙の情報を抽出（改行区切りで構造化）
  const parties: Party[] = [];
  const lines = text.split(/\n/);

  let currentParty: Party | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 甲・乙・丙の開始を検出
    if (/^甲\s*$/.test(trimmed) || /^甲[：:]/.test(trimmed)) {
      if (currentParty) parties.push(currentParty);
      currentParty = { role: '甲' };
      continue;
    }
    if (/^乙\s*$/.test(trimmed) || /^乙[：:]/.test(trimmed)) {
      if (currentParty) parties.push(currentParty);
      currentParty = { role: '乙' };
      continue;
    }
    if (/^丙\s*$/.test(trimmed) || /^丙[：:]/.test(trimmed)) {
      if (currentParty) parties.push(currentParty);
      currentParty = { role: '丙' };
      continue;
    }

    // 現在のパーティの情報を追加
    if (currentParty) {
      // 住所
      if (trimmed.includes('住所') || /^[都道府県]/.test(trimmed) || /^\d{3}-?\d{4}/.test(trimmed)) {
        currentParty.address = trimmed.replace(/^住所[：:\s]*/, '');
      }
      // 名称
      else if (trimmed.includes('名称') || trimmed.includes('株式会社') || trimmed.includes('合同会社') || trimmed.includes('有限会社')) {
        currentParty.name = trimmed.replace(/^名称[：:\s]*/, '');
      }
      // 代表者
      else if (trimmed.includes('代表') || trimmed.includes('取締役')) {
        currentParty.representative = trimmed.replace(/^代表者?[：:\s]*/, '');
      }
      // その他（住所の続きなど）
      else if (!currentParty.address && /[県市区町村丁目番号]/.test(trimmed)) {
        currentParty.address = trimmed;
      }
    }
  }

  // 最後のパーティを追加
  if (currentParty) parties.push(currentParty);

  // パーティが見つからない場合、テキスト全体から抽出を試みる
  if (parties.length === 0) {
    // 甲の情報を抽出
    const kouAddress = text.match(/甲\s*(?:住所)?[：:\s]*([^\n]*[都道府県][^\n]*)/);
    const kouName = text.match(/甲\s*(?:名称)?[：:\s]*([^\n]*(?:株式会社|合同会社|有限会社)[^\n]*)/);
    const kouRep = text.match(/甲\s*(?:代表者?)?[：:\s]*([^\n]*(?:代表取締役|取締役)[^\n]*)/);

    if (kouAddress || kouName || kouRep) {
      parties.push({
        role: '甲',
        address: kouAddress?.[1]?.trim(),
        name: kouName?.[1]?.trim(),
        representative: kouRep?.[1]?.trim(),
      });
    }

    // 乙の情報を抽出
    const otsuAddress = text.match(/乙\s*(?:住所)?[：:\s]*([^\n]*[都道府県][^\n]*)/);
    const otsuName = text.match(/乙\s*(?:名称)?[：:\s]*([^\n]*(?:株式会社|合同会社|有限会社)[^\n]*)/);
    const otsuRep = text.match(/乙\s*(?:代表者?)?[：:\s]*([^\n]*(?:代表取締役|取締役)[^\n]*)/);

    if (otsuAddress || otsuName || otsuRep) {
      parties.push({
        role: '乙',
        address: otsuAddress?.[1]?.trim(),
        name: otsuName?.[1]?.trim(),
        representative: otsuRep?.[1]?.trim(),
      });
    }
  }

  // それでも見つからない場合は最低限の情報
  if (parties.length === 0) {
    if (text.includes('甲')) parties.push({ role: '甲' });
    if (text.includes('乙')) parties.push({ role: '乙' });
  }

  return {
    closingText,
    date,
    parties,
  };
}

/**
 * 前文と条項を分離
 */
function separatePreamble(text: string): {
  preamble: string | null;
  articlesText: string;
} {
  // 第1条の位置を探す
  const firstArticleMatch = text.match(/第[1１一]条[（(]/);

  if (!firstArticleMatch || firstArticleMatch.index === undefined) {
    // 条項が見つからない場合、全てを1つの条項として扱う
    return { preamble: null, articlesText: text };
  }

  const preambleText = text.substring(0, firstArticleMatch.index).trim();
  const articlesText = text.substring(firstArticleMatch.index);

  // 前文が短すぎる場合は無視
  if (preambleText.length < 10) {
    return { preamble: null, articlesText };
  }

  // タイトル行を除去
  const preambleLines = preambleText.split('\n').filter(line => {
    const trimmed = line.trim();
    return trimmed && !trimmed.match(/契約書$/);
  });

  const preamble = preambleLines.join('\n').trim();

  return {
    preamble: preamble || null,
    articlesText,
  };
}

/**
 * 条項をパース
 */
function parseArticles(text: string): Article[] {
  const articles: Article[] = [];

  // 条項の区切りを検出（第X条）
  // 漢数字と算用数字の両方に対応
  const articlePattern = /第([0-9０-９一二三四五六七八九十百]+)条[（(]([^）)]+)[）)]/g;

  const matches = [...text.matchAll(articlePattern)];

  if (matches.length === 0) {
    // 条項が見つからない場合、全体を1つの条項として扱う
    const paragraphs = parseParagraphs(text);
    if (paragraphs.length > 0) {
      articles.push({
        id: uuidv4(),
        number: 1,
        title: '本文',
        paragraphs,
      });
    }
    return articles;
  }

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const nextMatch = matches[i + 1];

    const articleNumber = parseArticleNumber(match[1]);
    const articleTitle = match[2].trim();

    // この条項のテキスト範囲
    const startIndex = match.index! + match[0].length;
    const endIndex = nextMatch ? nextMatch.index! : text.length;
    const articleContent = text.substring(startIndex, endIndex).trim();

    // 項をパース
    const paragraphs = parseParagraphs(articleContent);

    articles.push({
      id: uuidv4(),
      number: articleNumber,
      title: articleTitle,
      paragraphs,
    });
  }

  return articles;
}

/**
 * 条項番号を数値に変換
 */
function parseArticleNumber(numStr: string): number {
  // 漢数字マップ
  const kanjiMap: Record<string, number> = {
    '一': 1, '二': 2, '三': 3, '四': 4, '五': 5,
    '六': 6, '七': 7, '八': 8, '九': 9, '十': 10,
    '百': 100,
  };

  // 算用数字の場合
  const arabicNum = parseInt(numStr.replace(/[０-９]/g, (s) =>
    String.fromCharCode(s.charCodeAt(0) - 0xfee0)
  ), 10);

  if (!isNaN(arabicNum)) {
    return arabicNum;
  }

  // 漢数字の場合
  let result = 0;
  let temp = 0;

  for (const char of numStr) {
    const val = kanjiMap[char];
    if (val === undefined) continue;

    if (val === 10) {
      result += (temp || 1) * 10;
      temp = 0;
    } else if (val === 100) {
      result += (temp || 1) * 100;
      temp = 0;
    } else {
      temp = val;
    }
  }

  return result + temp || 1;
}

/**
 * 項をパース
 */
function parseParagraphs(text: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // 項番号パターン: 1. 2. 3. または 1 甲は〜 2 乙は〜
  const paragraphPattern = /(?:^|\n)\s*(\d+)[.．\s]\s*/g;

  const lines = text.split('\n');
  let currentParagraph: { number: number | null; content: string; items: Item[] } | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // 項番号をチェック
    const paragraphMatch = trimmed.match(/^(\d+)[.．]\s*(.*)$/);
    const numberedMatch = trimmed.match(/^(\d+)\s+(甲|乙|前項|本|当該|相手方)(.*)$/);

    if (paragraphMatch) {
      // 新しい項
      if (currentParagraph) {
        paragraphs.push(createParagraph(currentParagraph));
      }
      currentParagraph = {
        number: parseInt(paragraphMatch[1], 10),
        content: paragraphMatch[2],
        items: [],
      };
    } else if (numberedMatch) {
      // 番号付き項（スペース区切り）
      if (currentParagraph) {
        paragraphs.push(createParagraph(currentParagraph));
      }
      currentParagraph = {
        number: parseInt(numberedMatch[1], 10),
        content: numberedMatch[2] + numberedMatch[3],
        items: [],
      };
    } else if (trimmed.match(/^[（(](\d+)[）)]\s*/)) {
      // 号 (1), (2), (3)...
      const itemMatch = trimmed.match(/^[（(](\d+)[）)]\s*(.*)$/);
      if (itemMatch && currentParagraph) {
        currentParagraph.items.push({
          id: uuidv4(),
          number: parseInt(itemMatch[1], 10),
          content: itemMatch[2],
        });
      } else if (itemMatch) {
        // 項がまだない場合は番号なし項として追加
        currentParagraph = {
          number: null,
          content: '',
          items: [{
            id: uuidv4(),
            number: parseInt(itemMatch[1], 10),
            content: itemMatch[2],
          }],
        };
      }
    } else {
      // 続きのテキスト
      if (currentParagraph) {
        if (currentParagraph.items.length > 0) {
          // 最後の号に追加（改行を保持）
          currentParagraph.items[currentParagraph.items.length - 1].content += '\n' + trimmed;
        } else {
          // 項の本文に追加（改行を保持）
          currentParagraph.content += (currentParagraph.content ? '\n' : '') + trimmed;
        }
      } else {
        // 最初の段落（番号なし）
        currentParagraph = {
          number: null,
          content: trimmed,
          items: [],
        };
      }
    }
  }

  // 最後の項を追加
  if (currentParagraph) {
    paragraphs.push(createParagraph(currentParagraph));
  }

  return paragraphs;
}

/**
 * Paragraph オブジェクトを作成
 */
function createParagraph(data: { number: number | null; content: string; items: Item[] }): Paragraph {
  return {
    id: uuidv4(),
    number: data.number,
    content: data.content.trim(),
    items: data.items.length > 0 ? data.items : undefined,
  };
}

// ============================================================
// 構造化データ → HTML 変換
// ============================================================

/**
 * 構造化データをHTMLに変換
 * 署名欄はPDFから正確に抽出できないため、スキップする
 * 署名欄は「署名欄を生成」ボタンで取引先情報から生成する
 */
export function structureToHtml(structure: ContractStructure): string {
  const parts: string[] = [];

  // タイトル
  parts.push(`<h1>${escapeHtml(structure.title)}</h1>`);

  // 前文（改行を<br>に変換）
  if (structure.preamble) {
    const preambleHtml = escapeHtml(structure.preamble).replace(/\n/g, '<br>\n');
    parts.push(`<p class="preamble">${preambleHtml}</p>`);
  }

  // 条項
  for (const article of structure.articles) {
    parts.push(articleToHtml(article));
  }

  // 署名欄はスキップ（PDFから正確に抽出できないため）
  // 代わりに「署名欄を生成」ボタンで取引先情報から生成する
  // 署名欄のプレースホルダーを追加
  parts.push('<div class="signature-placeholder" style="margin-top: 3em; padding: 2em; border: 2px dashed #ccc; text-align: center; color: #666;">');
  parts.push('<p>署名欄は編集モードで「署名欄を生成」ボタンをクリックして追加してください。</p>');
  parts.push('<p style="font-size: 0.9em; margin-top: 0.5em;">取引先と自社の立場を設定すると、正しい署名欄が自動生成されます。</p>');
  parts.push('</div>');

  return parts.join('\n');
}

/**
 * 条項をHTMLに変換
 */
function articleToHtml(article: Article): string {
  const parts: string[] = [];

  // 条項タイトル
  parts.push(`<h3 data-article-id="${article.id}" data-article-number="${article.number}">第${article.number}条（${escapeHtml(article.title)}）</h3>`);

  // 項
  for (const paragraph of article.paragraphs) {
    parts.push(paragraphToHtml(paragraph, article.id));
  }

  return parts.join('\n');
}

/**
 * 項をHTMLに変換
 */
function paragraphToHtml(paragraph: Paragraph, articleId: string): string {
  const parts: string[] = [];

  // 項番号がある場合
  const prefix = paragraph.number ? `${paragraph.number}. ` : '';
  const style = paragraph.number ? 'style="margin-left: 1em;"' : '';

  // 改行を<br>に変換
  const contentHtml = escapeHtml(paragraph.content).replace(/\n/g, '<br>\n');
  parts.push(`<p data-paragraph-id="${paragraph.id}" data-article-id="${articleId}" ${style}>${prefix}${contentHtml}</p>`);

  // 号
  if (paragraph.items && paragraph.items.length > 0) {
    for (const item of paragraph.items) {
      const itemContentHtml = escapeHtml(item.content).replace(/\n/g, '<br>\n');
      parts.push(`<p data-item-id="${item.id}" data-paragraph-id="${paragraph.id}" style="margin-left: 2em;">（${item.number}）${itemContentHtml}</p>`);
    }
  }

  return parts.join('\n');
}

/**
 * 署名欄をHTMLに変換
 */
function signatureToHtml(signature: SignatureSection): string {
  const parts: string[] = [];

  parts.push('<div class="signature-section" style="margin-top: 3em; border-top: 1px solid #ccc; padding-top: 2em;">');

  if (signature.closingText) {
    parts.push(`<p>${escapeHtml(signature.closingText)}</p>`);
  }

  if (signature.date) {
    parts.push(`<p style="text-align: center; margin: 2em 0;">${escapeHtml(signature.date)}</p>`);
  }

  for (const party of signature.parties) {
    parts.push(`<p style="margin-top: 1.5em; font-weight: bold;">${party.role}</p>`);
    if (party.address) {
      parts.push(`<p style="margin-left: 1em;">住所：${escapeHtml(party.address)}</p>`);
    }
    if (party.name) {
      parts.push(`<p style="margin-left: 1em;">名称：${escapeHtml(party.name)}</p>`);
    }
    if (party.representative) {
      parts.push(`<p style="margin-left: 1em;">代表者：${escapeHtml(party.representative)}</p>`);
    }
  }

  parts.push('</div>');

  return parts.join('\n');
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

// ============================================================
// 構造化データの操作
// ============================================================

/**
 * 条項を番号で検索
 */
export function findArticleByNumber(structure: ContractStructure, articleNumber: number): Article | null {
  return structure.articles.find(a => a.number === articleNumber) || null;
}

/**
 * 条項をIDで検索
 */
export function findArticleById(structure: ContractStructure, articleId: string): Article | null {
  return structure.articles.find(a => a.id === articleId) || null;
}

/**
 * 条項を更新
 */
export function updateArticle(
  structure: ContractStructure,
  articleNumber: number,
  updates: Partial<Omit<Article, 'id' | 'number'>>
): ContractStructure {
  return {
    ...structure,
    articles: structure.articles.map(article =>
      article.number === articleNumber
        ? { ...article, ...updates }
        : article
    ),
  };
}

/**
 * 条項の内容（項リスト）を完全に置換
 */
export function replaceArticleContent(
  structure: ContractStructure,
  articleNumber: number,
  newContent: string
): ContractStructure {
  const newParagraphs = parseParagraphs(newContent);

  return {
    ...structure,
    articles: structure.articles.map(article =>
      article.number === articleNumber
        ? { ...article, paragraphs: newParagraphs }
        : article
    ),
  };
}

/**
 * 項を更新
 */
export function updateParagraph(
  structure: ContractStructure,
  articleNumber: number,
  paragraphNumber: number,
  newContent: string
): ContractStructure {
  return {
    ...structure,
    articles: structure.articles.map(article => {
      if (article.number !== articleNumber) return article;

      return {
        ...article,
        paragraphs: article.paragraphs.map(paragraph =>
          paragraph.number === paragraphNumber
            ? { ...paragraph, content: newContent }
            : paragraph
        ),
      };
    }),
  };
}
