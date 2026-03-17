import { describe, expect, test } from 'bun:test';
import {
  collectLineRefs,
  detectOverlappingRanges,
  getEditLineNumber,
} from './edit-ordering';
import type { HashlineEdit } from './types';

describe('edit-ordering', () => {
  describe('getEditLineNumber', () => {
    test('gets line number from replace edit pos', () => {
      const edit: HashlineEdit = {
        op: 'replace',
        pos: '10#ZB',
        lines: 'new content',
      };
      expect(getEditLineNumber(edit)).toBe(10);
    });

    test('gets line number from replace edit end', () => {
      const edit: HashlineEdit = {
        op: 'replace',
        pos: '5#ZB',
        end: '10#ZB',
        lines: 'new content',
      };
      // Should prefer end if available
      expect(getEditLineNumber(edit)).toBe(10);
    });

    test('gets line number from append edit with pos', () => {
      const edit: HashlineEdit = {
        op: 'append',
        pos: '15#ZB',
        lines: 'appended',
      };
      expect(getEditLineNumber(edit)).toBe(15);
    });

    test('returns negative infinity for append without pos', () => {
      const edit: HashlineEdit = {
        op: 'append',
        lines: 'appended',
      };
      expect(getEditLineNumber(edit)).toBe(Number.NEGATIVE_INFINITY);
    });

    test('gets line number from prepend edit with pos', () => {
      const edit: HashlineEdit = {
        op: 'prepend',
        pos: '3#ZB',
        lines: 'prepended',
      };
      expect(getEditLineNumber(edit)).toBe(3);
    });

    test('returns negative infinity for prepend without pos', () => {
      const edit: HashlineEdit = {
        op: 'prepend',
        lines: 'prepended',
      };
      expect(getEditLineNumber(edit)).toBe(Number.NEGATIVE_INFINITY);
    });
  });

  describe('collectLineRefs', () => {
    test('collects single pos from replace', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: 'x' },
      ];
      expect(collectLineRefs(edits)).toEqual(['1#ZB']);
    });

    test('collects pos and end from range replace', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', end: '5#ZB', lines: 'x' },
      ];
      expect(collectLineRefs(edits)).toEqual(['1#ZB', '5#ZB']);
    });

    test('collects pos from append', () => {
      const edits: HashlineEdit[] = [{ op: 'append', pos: '5#ZB', lines: 'x' }];
      expect(collectLineRefs(edits)).toEqual(['5#ZB']);
    });

    test('returns empty for append without pos', () => {
      const edits: HashlineEdit[] = [{ op: 'append', lines: 'x' }];
      expect(collectLineRefs(edits)).toEqual([]);
    });

    test('collects pos from prepend', () => {
      const edits: HashlineEdit[] = [
        { op: 'prepend', pos: '3#ZB', lines: 'x' },
      ];
      expect(collectLineRefs(edits)).toEqual(['3#ZB']);
    });

    test('returns empty for prepend without pos', () => {
      const edits: HashlineEdit[] = [{ op: 'prepend', lines: 'x' }];
      expect(collectLineRefs(edits)).toEqual([]);
    });

    test('collects from multiple edits', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', end: '3#ZB', lines: 'x' },
        { op: 'append', pos: '10#ZB', lines: 'y' },
        { op: 'prepend', lines: 'z' },
      ];
      expect(collectLineRefs(edits)).toEqual(['1#ZB', '3#ZB', '10#ZB']);
    });
  });

  describe('detectOverlappingRanges', () => {
    test('returns null for no ranges', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: 'x' },
      ];
      expect(detectOverlappingRanges(edits)).toBeNull();
    });

    test('returns null for single range', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', end: '5#ZB', lines: 'x' },
      ];
      expect(detectOverlappingRanges(edits)).toBeNull();
    });

    test('returns null for non-overlapping ranges', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', end: '3#ZB', lines: 'x' },
        { op: 'replace', pos: '5#ZB', end: '7#ZB', lines: 'y' },
      ];
      expect(detectOverlappingRanges(edits)).toBeNull();
    });

    test('detects overlapping ranges', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', end: '5#ZB', lines: 'x' },
        { op: 'replace', pos: '3#ZB', end: '7#ZB', lines: 'y' },
      ];
      const result = detectOverlappingRanges(edits);
      expect(result).not.toBeNull();
      expect(result).toContain('Overlapping');
    });

    test('detects contained range', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', end: '10#ZB', lines: 'x' },
        { op: 'replace', pos: '3#ZB', end: '7#ZB', lines: 'y' },
      ];
      const result = detectOverlappingRanges(edits);
      expect(result).not.toBeNull();
    });

    test('detects adjacent ranges as non-overlapping', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', end: '5#ZB', lines: 'x' },
        { op: 'replace', pos: '6#ZB', end: '10#ZB', lines: 'y' },
      ];
      expect(detectOverlappingRanges(edits)).toBeNull();
    });

    test('ignores non-replace edits', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', end: '5#ZB', lines: 'x' },
        { op: 'append', pos: '3#ZB', lines: 'y' },
      ];
      expect(detectOverlappingRanges(edits)).toBeNull();
    });
  });
});
