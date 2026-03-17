import { describe, expect, test } from 'bun:test';
import {
  computeLegacyLineHash,
  computeLineHash,
  formatHashLine,
  formatHashLines,
} from './hash-computation';

describe('hash-computation', () => {
  describe('computeLineHash', () => {
    test('computes hash for a line', () => {
      const hash = computeLineHash(1, 'hello world');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(2);
      // Hash should use only valid nibble chars
      expect(hash).toMatch(/^[ZPMQVRWSNKTXJBYH]{2}$/);
    });

    test('same content produces same hash', () => {
      const hash1 = computeLineHash(1, 'hello');
      const hash2 = computeLineHash(1, 'hello');
      expect(hash1).toBe(hash2);
    });

    test('different content produces different hash', () => {
      const hash1 = computeLineHash(1, 'hello');
      const hash2 = computeLineHash(1, 'world');
      expect(hash1).not.toBe(hash2);
    });

    test('empty line produces consistent hash', () => {
      const hash = computeLineHash(1, '');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(2);
    });

    test('line number may affect hash for empty content', () => {
      const hash1 = computeLineHash(1, '');
      const hash2 = computeLineHash(2, '');
      // Different line numbers may produce same or different hashes depending on hash distribution
      expect(typeof hash1).toBe('string');
      expect(typeof hash2).toBe('string');
    });

    test('line number does not affect hash for non-empty content', () => {
      const hash1 = computeLineHash(1, 'hello');
      const hash2 = computeLineHash(2, 'hello');
      expect(hash1).toBe(hash2);
    });
  });

  describe('computeLegacyLineHash', () => {
    test('computes legacy hash for a line', () => {
      const hash = computeLegacyLineHash(1, 'hello world');
      expect(typeof hash).toBe('string');
      expect(hash.length).toBe(2);
    });

    test('legacy hash differs from modern hash for whitespace-heavy content', () => {
      const modern = computeLineHash(1, '  hello  ');
      const legacy = computeLegacyLineHash(1, '  hello  ');
      expect(modern).not.toBe(legacy);
    });
  });

  describe('formatHashLine', () => {
    test('formats line with hash prefix', () => {
      const result = formatHashLine(42, 'const x = 1;');
      expect(result).toMatch(/^42#[ZPMQVRWSNKTXJBYH]{2}\|/);
      expect(result).toContain('const x = 1;');
    });

    test('format includes line number, hash, and content', () => {
      const result = formatHashLine(1, 'test');
      expect(result).toMatch(/^1#[ZPMQVRWSNKTXJBYH]{2}\|test$/);
    });

    test('strips trailing carriage return', () => {
      const result = formatHashLine(1, 'test\r');
      // Hash for "test" should be valid and content should be trimmed
      expect(result).toMatch(/^1#[ZPMQVRWSNKTXJBYH]{2}\|test$/);
    });
  });

  describe('formatHashLines', () => {
    test('formats multiple lines', () => {
      const content = 'line1\nline2\nline3';
      const result = formatHashLines(content);
      const lines = result.split('\n');
      expect(lines).toHaveLength(3);
      expect(lines[0]).toMatch(/^1#[ZPMQVRWSNKTXJBYH]{2}\|line1$/);
      expect(lines[1]).toMatch(/^2#[ZPMQVRWSNKTXJBYH]{2}\|line2$/);
      expect(lines[2]).toMatch(/^3#[ZPMQVRWSNKTXJBYH]{2}\|line3$/);
    });

    test('handles empty content', () => {
      expect(formatHashLines('')).toBe('');
    });

    test('handles single line', () => {
      const result = formatHashLines('single');
      expect(result).toMatch(/^1#[ZPMQVRWSNKTXJBYH]{2}\|single$/);
    });
  });
});
