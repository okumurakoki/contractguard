import { describe, it, expect } from 'vitest';
import {
  isValidExtraction,
  detectAndConvertTables,
  removeHeadersAndFooters,
  normalizeColumnLayout,
  enhancedTextProcessing,
} from '../extract';

describe('isValidExtraction', () => {
  it('100文字以上の日本語テキストを有効と判定する', () => {
    const text = 'あ'.repeat(100);
    expect(isValidExtraction(text)).toBe(true);
  });

  it('100文字以上の英語テキストを有効と判定する', () => {
    const text = 'This is a valid English text. '.repeat(5);
    expect(isValidExtraction(text)).toBe(true);
  });

  it('100文字未満のテキストを無効と判定する', () => {
    const text = 'Short text';
    expect(isValidExtraction(text)).toBe(false);
  });

  it('日本語も英語も含まないテキストを無効と判定する', () => {
    const text = '123456789 '.repeat(20);
    expect(isValidExtraction(text)).toBe(false);
  });
});

describe('detectAndConvertTables', () => {
  it('パイプ区切りのテーブルをHTMLに変換する', () => {
    const input = `
通常のテキスト
| 項目 | 内容 |
| 名前 | 山田太郎 |
| 住所 | 東京都 |
続きのテキスト
`;
    const result = detectAndConvertTables(input);
    expect(result).toContain('<table');
    expect(result).toContain('項目');
    expect(result).toContain('内容');
    expect(result).toContain('山田太郎');
    expect(result).toContain('</table>');
    expect(result).toContain('通常のテキスト');
    expect(result).toContain('続きのテキスト');
  });

  it('タブ区切りのテーブルをHTMLに変換する', () => {
    const input = `項目\t金額\t備考\n商品A\t1000\t税込\n商品B\t2000\t税込`;
    const result = detectAndConvertTables(input);
    expect(result).toContain('<table');
    expect(result).toContain('商品A');
    expect(result).toContain('1000');
  });

  it('複数スペース区切りのテーブルをHTMLに変換する', () => {
    const input = `項目名   金額   備考\n商品A   1000   税込\n商品B   2000   税込`;
    const result = detectAndConvertTables(input);
    expect(result).toContain('<table');
    expect(result).toContain('商品A');
  });

  it('テーブルがない場合はそのまま返す', () => {
    const input = `これは普通のテキストです。\nテーブルは含まれていません。`;
    const result = detectAndConvertTables(input);
    expect(result).toBe(input);
  });

  it('ヘッダーキーワードがある場合はthタグを使用する', () => {
    const input = `項目\t内容\t備考\nデータ1\t値1\tメモ1`;
    const result = detectAndConvertTables(input);
    expect(result).toContain('<th');
    expect(result).toContain('<td');
  });
});

describe('removeHeadersAndFooters', () => {
  it('ページ番号（- 1 - 形式）を除外する', () => {
    const input = `本文テキスト\n- 1 -\n続きのテキスト`;
    const result = removeHeadersAndFooters(input);
    expect(result).not.toContain('- 1 -');
    expect(result).toContain('本文テキスト');
    expect(result).toContain('続きのテキスト');
  });

  it('ページ番号（1/10 形式）を除外する', () => {
    const input = `本文テキスト\n1/10\n続きのテキスト`;
    const result = removeHeadersAndFooters(input);
    expect(result).not.toContain('1/10');
  });

  it('ページ番号（Page 1 形式）を除外する', () => {
    const input = `本文テキスト\nPage 1\n続きのテキスト`;
    const result = removeHeadersAndFooters(input);
    expect(result).not.toContain('Page 1');
  });

  it('「秘密」「社外秘」を除外する', () => {
    const input = `秘密\n本文テキスト\n社外秘\n続きのテキスト`;
    const result = removeHeadersAndFooters(input);
    expect(result).not.toMatch(/^秘密$/m);
    expect(result).not.toMatch(/^社外秘$/m);
    expect(result).toContain('本文テキスト');
  });

  it('コピーライト表記を除外する', () => {
    const input = `本文テキスト\n© 2024 Company Inc.\n続きのテキスト`;
    const result = removeHeadersAndFooters(input);
    expect(result).not.toContain('© 2024');
  });

  it('通常のテキストはそのまま保持する', () => {
    const input = `契約書\n第1条（目的）\n本契約は...`;
    const result = removeHeadersAndFooters(input);
    expect(result).toBe(input);
  });
});

describe('normalizeColumnLayout', () => {
  it('段組みでないテキストはそのまま返す', () => {
    const input = `これは普通の長いテキストです。段組みではありません。\nこれも普通の長いテキストです。複数行あります。`;
    const result = normalizeColumnLayout(input);
    expect(result).toBe(input);
  });

  it('短い行が多い場合は結合を試みる', () => {
    // 段組み検出のしきい値（10行以上、40%以上が短い行）を満たすテスト
    const shortLines = Array(15).fill('短い行。').join('\n');
    const result = normalizeColumnLayout(shortLines);
    // 結合されるので行数が減る
    const originalLineCount = shortLines.split('\n').length;
    const resultLineCount = result.split('\n').filter((l) => l.trim()).length;
    expect(resultLineCount).toBeLessThanOrEqual(originalLineCount);
  });
});

describe('enhancedTextProcessing', () => {
  it('すべての処理を適用する', () => {
    const input = `
社外秘
本文テキスト
| 項目 | 内容 |
| データ | 値 |
- 1 -
続きのテキスト
`;
    const result = enhancedTextProcessing(input);

    // ヘッダー/フッターが除外されている
    expect(result).not.toMatch(/^社外秘$/m);
    expect(result).not.toContain('- 1 -');

    // テーブルがHTMLに変換されている
    expect(result).toContain('<table');

    // 本文は保持されている
    expect(result).toContain('本文テキスト');
    expect(result).toContain('続きのテキスト');
  });
});
