import { describe, it, expect } from 'vitest';
import {
  computeDiff,
  computeDiffStats,
  stripHtml,
  diffToHtml,
  computeLineDiff,
  calculateSimilarity,
} from '../diff';

describe('diff utilities', () => {
  describe('computeDiff', () => {
    it('同一テキストは変更なしを返す', () => {
      const diffs = computeDiff('hello', 'hello');
      expect(diffs).toHaveLength(1);
      expect(diffs[0]).toEqual([0, 'hello']);
    });

    it('追加を検出する', () => {
      const diffs = computeDiff('hello', 'hello world');
      expect(diffs.some(([type]) => type === 1)).toBe(true);
    });

    it('削除を検出する', () => {
      const diffs = computeDiff('hello world', 'hello');
      expect(diffs.some(([type]) => type === -1)).toBe(true);
    });

    it('変更を検出する', () => {
      const diffs = computeDiff('hello', 'hallo');
      expect(diffs.length).toBeGreaterThan(1);
    });
  });

  describe('computeDiffStats', () => {
    it('変更なしの場合は全てunchanged', () => {
      const diffs = computeDiff('hello', 'hello');
      const stats = computeDiffStats(diffs);
      expect(stats.added).toBe(0);
      expect(stats.removed).toBe(0);
      expect(stats.unchanged).toBe(5);
      expect(stats.changePercentage).toBe(0);
    });

    it('追加のみの場合', () => {
      const diffs = computeDiff('', 'hello');
      const stats = computeDiffStats(diffs);
      expect(stats.added).toBe(5);
      expect(stats.removed).toBe(0);
      expect(stats.changePercentage).toBe(100);
    });

    it('削除のみの場合', () => {
      const diffs = computeDiff('hello', '');
      const stats = computeDiffStats(diffs);
      expect(stats.added).toBe(0);
      expect(stats.removed).toBe(5);
      expect(stats.changePercentage).toBe(100);
    });

    it('部分変更の場合', () => {
      const diffs = computeDiff('hello world', 'hello there');
      const stats = computeDiffStats(diffs);
      expect(stats.added).toBeGreaterThan(0);
      expect(stats.removed).toBeGreaterThan(0);
      expect(stats.unchanged).toBeGreaterThan(0);
    });
  });

  describe('stripHtml', () => {
    it('HTMLタグを除去する', () => {
      const html = '<p>Hello <strong>World</strong></p>';
      expect(stripHtml(html)).toBe('Hello World');
    });

    it('エンティティをデコードする', () => {
      const html = '&lt;script&gt;alert(&quot;test&quot;)&lt;/script&gt;';
      expect(stripHtml(html)).toBe('<script>alert("test")</script>');
    });

    it('nbsp をスペースに変換する', () => {
      const html = 'Hello&nbsp;World';
      expect(stripHtml(html)).toBe('Hello World');
    });

    it('複雑なHTMLを処理する', () => {
      const html = '<div class="test"><p>Line 1</p><p>Line 2</p></div>';
      expect(stripHtml(html)).toBe('Line 1Line 2');
    });
  });

  describe('diffToHtml', () => {
    it('追加をinsタグで囲む', () => {
      const diffs = computeDiff('', 'added');
      const html = diffToHtml(diffs);
      expect(html).toContain('<ins');
      expect(html).toContain('added');
      expect(html).toContain('</ins>');
    });

    it('削除をdelタグで囲む', () => {
      const diffs = computeDiff('removed', '');
      const html = diffToHtml(diffs);
      expect(html).toContain('<del');
      expect(html).toContain('removed');
      expect(html).toContain('</del>');
    });

    it('変更なしはそのまま出力', () => {
      const diffs = computeDiff('unchanged', 'unchanged');
      const html = diffToHtml(diffs);
      expect(html).not.toContain('<ins');
      expect(html).not.toContain('<del');
      expect(html).toBe('unchanged');
    });

    it('特殊文字をエスケープする', () => {
      const diffs = computeDiff('', '<script>');
      const html = diffToHtml(diffs);
      expect(html).toContain('&lt;script&gt;');
      expect(html).not.toContain('<script>');
    });
  });

  describe('computeLineDiff', () => {
    it('同一行はunchangedを返す', () => {
      const result = computeLineDiff('line1\nline2', 'line1\nline2');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ type: 'unchanged', content: 'line1' });
      expect(result[1]).toEqual({ type: 'unchanged', content: 'line2' });
    });

    it('追加行を検出する', () => {
      const result = computeLineDiff('line1', 'line1\nline2');
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ type: 'added', content: 'line2' });
    });

    it('削除行を検出する', () => {
      const result = computeLineDiff('line1\nline2', 'line1');
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ type: 'removed', content: 'line2' });
    });

    it('変更行を検出する', () => {
      const result = computeLineDiff('line1\nold', 'line1\nnew');
      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ type: 'modified', content: 'new', oldContent: 'old' });
    });
  });

  describe('calculateSimilarity', () => {
    it('同一テキストは100%', () => {
      expect(calculateSimilarity('hello', 'hello')).toBe(100);
    });

    it('完全に異なるテキストは0%', () => {
      expect(calculateSimilarity('abc', 'xyz')).toBe(0);
    });

    it('部分的に一致するテキストは中間値', () => {
      const similarity = calculateSimilarity('hello world', 'hello there');
      expect(similarity).toBeGreaterThan(0);
      expect(similarity).toBeLessThan(100);
    });

    it('空文字列同士は100%', () => {
      expect(calculateSimilarity('', '')).toBe(100);
    });
  });
});
