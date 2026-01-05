import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  calculateSimilarity,
  containsNormalized,
  levenshteinDistance,
  findBestMatch,
  findByPrefix,
} from '../textMatching';

describe('textMatching', () => {
  describe('normalizeText', () => {
    it('should normalize spaces', () => {
      const result = normalizeText('これは　  テスト\n\nです');
      expect(result).toBe('これは テスト です');
    });

    it('should normalize full-width numbers', () => {
      const result = normalizeText('第１０条');
      expect(result).toBe('第10条');
    });

    it('should normalize full-width English letters', () => {
      const result = normalizeText('ＡＢＣ');
      expect(result).toBe('ABC');
    });

    it('should normalize full-width parentheses', () => {
      const result = normalizeText('（テスト）');
      expect(result).toBe('(テスト)');
    });

    it('should remove HTML tags', () => {
      const result = normalizeText('<p>テスト</p>');
      expect(result).toBe('テスト');
    });

    it('should handle mixed normalization', () => {
      const result = normalizeText('<p>第１０条（損害賠償）　甲は、本契約に違反した場合</p>');
      expect(result).toBe('第10条(損害賠償) 甲は、本契約に違反した場合');
    });
  });

  describe('levenshteinDistance', () => {
    it('should return 0 for identical strings', () => {
      expect(levenshteinDistance('test', 'test')).toBe(0);
    });

    it('should return correct distance for different strings', () => {
      expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    });

    it('should handle empty strings', () => {
      expect(levenshteinDistance('', 'test')).toBe(4);
      expect(levenshteinDistance('test', '')).toBe(4);
    });

    it('should handle Japanese text', () => {
      expect(levenshteinDistance('甲は', '乙は')).toBe(1);
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 100 for identical strings', () => {
      expect(calculateSimilarity('テスト', 'テスト')).toBe(100);
    });

    it('should return high similarity for strings with different whitespace', () => {
      const similarity = calculateSimilarity('甲は、本契約に違反した場合', '甲は、  本契約に  違反した場合');
      expect(similarity).toBeGreaterThan(85); // 空白の違いは許容
    });

    it('should return high similarity for similar strings', () => {
      const similarity = calculateSimilarity(
        '甲は、本契約に違反した場合、乙に生じた一切の損害を賠償するものとする。',
        '甲は、本契約に違反した場合、乙に生じた直接かつ現実の損害を賠償するものとする。'
      );
      expect(similarity).toBeGreaterThan(70);
    });

    it('should return low similarity for very different strings', () => {
      const similarity = calculateSimilarity('甲は', '本契約により生じた成果物');
      expect(similarity).toBeLessThan(30);
    });

    it('should return 0 for empty strings', () => {
      expect(calculateSimilarity('', 'test')).toBe(0);
    });
  });

  describe('containsNormalized', () => {
    it('should find substring with different whitespace', () => {
      expect(containsNormalized('甲は、  本契約に  違反した場合', '甲は、 本契約に 違反')).toBe(true);
    });

    it('should find substring with HTML tags', () => {
      expect(containsNormalized('<p>甲は、本契約に違反した場合</p>', '甲は、本契約に違反した')).toBe(true);
    });

    it('should not find non-existent substring', () => {
      expect(containsNormalized('甲は、本契約に違反した場合', '乙は')).toBe(false);
    });
  });

  describe('findBestMatch', () => {
    const htmlContent = `
      <h3>第10条（損害賠償）</h3>
      <p>甲は、本契約に違反した場合、乙に生じた一切の損害を賠償するものとする。</p>
      <h3>第11条（秘密保持）</h3>
      <p>甲及び乙は、本契約に関連して知り得た相手方の秘密情報を第三者に開示してはならない。</p>
    `;

    it('should find exact match', () => {
      const result = findBestMatch(htmlContent, '甲は、本契約に違反した場合、乙に生じた一切の損害を賠償するものとする。');
      expect(result).not.toBeNull();
      expect(result?.similarity).toBe(100);
    });

    it('should find match with whitespace differences', () => {
      const result = findBestMatch(htmlContent, '甲は、  本契約に  違反した場合、  乙に生じた一切の損害を賠償するものとする。');
      expect(result).not.toBeNull();
      expect(result?.similarity).toBeGreaterThan(90); // 空白の違いは許容
    });

    it('should find match with high similarity', () => {
      const result = findBestMatch(
        htmlContent,
        '甲は、本契約に違反した場合、乙に生じた直接かつ現実の損害を賠償するものとする。',
        70
      );
      expect(result).not.toBeNull();
      expect(result?.similarity).toBeGreaterThan(70);
    });

    it('should not find match with low similarity', () => {
      const result = findBestMatch(htmlContent, '完全に異なるテキスト内容です。', 80);
      expect(result).toBeNull();
    });

    it('should find match in h3 tag', () => {
      const result = findBestMatch(htmlContent, '第10条（損害賠償）');
      expect(result).not.toBeNull();
      expect(result?.tag).toContain('<h3>');
    });
  });

  describe('findByPrefix', () => {
    const htmlContent = `
      <p>甲は、本契約に違反した場合、乙に生じた一切の損害を賠償するものとする。</p>
      <p>乙は、本契約に基づく義務を履行しなければならない。</p>
    `;

    it('should find match by prefix', () => {
      const result = findByPrefix(htmlContent, '甲は、本契約に違反した場合、乙に生じた一切の損害を賠償するものとする。', 15);
      expect(result).not.toBeNull();
      expect(result?.similarity).toBeGreaterThan(80);
    });

    it('should not find match with different prefix', () => {
      const result = findByPrefix(htmlContent, '完全に異なるテキスト内容です。', 15);
      expect(result).toBeNull();
    });

    it('should handle short text', () => {
      const result = findByPrefix(htmlContent, '短い', 15);
      expect(result).toBeNull();
    });
  });
});
