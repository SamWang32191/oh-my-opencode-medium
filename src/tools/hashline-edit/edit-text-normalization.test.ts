import { describe, expect, test } from 'bun:test';
import { stripLinePrefixes, toNewLines } from './edit-text-normalization';

describe('edit-text-normalization', () => {
  describe('stripLinePrefixes', () => {
    test('returns empty array for empty input', () => {
      expect(stripLinePrefixes([])).toEqual([]);
    });

    test('returns original lines when no prefixes detected', () => {
      const lines = ['hello world', 'second line'];
      expect(stripLinePrefixes(lines)).toEqual(lines);
    });

    test('strips hashline prefixes when majority have them', () => {
      const lines = [
        '5#ZB|content one',
        '10#PM|content two',
        '15#QR|content three',
      ];
      const result = stripLinePrefixes(lines);
      expect(result).toEqual(['content one', 'content two', 'content three']);
    });

    test('strips hashline prefixes with >>> marker at 50% threshold', () => {
      const lines = ['>>> 5#ZB|changed content', 'normal line'];
      // At exactly 50% (1 of 2), threshold is met (>=) so it strips
      const result = stripLinePrefixes(lines);
      expect(result).toEqual(['changed content', 'normal line']);
    });

    test('does not strip when below 50% threshold', () => {
      const lines = ['>>> 5#ZB|changed', 'line 2', 'line 3'];
      // 1 of 3 lines has prefix = 33% < 50%, so no stripping
      expect(stripLinePrefixes(lines)).toEqual(lines);
    });

    test('strips hashline prefixes with >> marker', () => {
      const lines = ['>> 5#ZB|changed', '>> 6#PM|also changed'];
      const result = stripLinePrefixes(lines);
      expect(result).toEqual(['changed', 'also changed']);
    });

    test('strips diff plus prefixes when majority have them', () => {
      const lines = ['+added line 1', '+added line 2', '+added line 3'];
      const result = stripLinePrefixes(lines);
      expect(result).toEqual(['added line 1', 'added line 2', 'added line 3']);
    });

    test('prefers hashline over diff plus when both present equally', () => {
      // With hashline having 2/4 and plus having 2/4, hashline takes precedence
      const lines = ['1#ZB|hash1', '1#PM|hash2', '+plus1', '+plus2'];
      const result = stripLinePrefixes(lines);
      // When hashline threshold met first, it wins
      expect(result).toEqual(['hash1', 'hash2', '+plus1', '+plus2']);
    });

    test('handles mixed content without stripping', () => {
      const lines = ['plain text', '+one added', 'another plain'];
      // Only 1/3 has plus prefix, not majority
      expect(stripLinePrefixes(lines)).toEqual(lines);
    });

    test('handles whitespace variations in hashline', () => {
      const lines = ['  5 # ZB|spaced', '10#PM|normal'];
      const result = stripLinePrefixes(lines);
      expect(result).toEqual(['spaced', 'normal']);
    });

    test('preserves empty lines', () => {
      const lines = ['1#ZB|content', '', '2#PM|more'];
      const result = stripLinePrefixes(lines);
      expect(result).toEqual(['content', '', 'more']);
    });
  });

  describe('toNewLines', () => {
    test('accepts array input', () => {
      expect(toNewLines(['a', 'b'])).toEqual(['a', 'b']);
    });

    test('splits string input by newlines', () => {
      expect(toNewLines('line1\nline2')).toEqual(['line1', 'line2']);
    });

    test('handles empty string', () => {
      expect(toNewLines('')).toEqual(['']);
    });

    test('processes string with prefixes', () => {
      const result = toNewLines('>>> 5#ZB|changed\nplain');
      expect(result[0]).toBe('changed');
      expect(result[1]).toBe('plain');
    });
  });
});
