import { describe, expect, test } from 'bun:test';
import { dedupeEdits } from './edit-deduplication';
import type { HashlineEdit } from './types';

describe('edit-deduplication', () => {
  describe('dedupeEdits', () => {
    test('returns same edits when none are duplicates', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: 'content1' },
        { op: 'replace', pos: '2#ZB', lines: 'content2' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(2);
      expect(result.deduplicatedEdits).toBe(0);
    });

    test('removes duplicate replace edits', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: 'same' },
        { op: 'replace', pos: '1#ZB', lines: 'same' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(1);
      expect(result.deduplicatedEdits).toBe(1);
    });

    test('removes duplicate append edits', () => {
      const edits: HashlineEdit[] = [
        { op: 'append', pos: '1#ZB', lines: 'same' },
        { op: 'append', pos: '1#ZB', lines: 'same' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(1);
      expect(result.deduplicatedEdits).toBe(1);
    });

    test('removes duplicate prepend edits', () => {
      const edits: HashlineEdit[] = [
        { op: 'prepend', pos: '1#ZB', lines: 'same' },
        { op: 'prepend', pos: '1#ZB', lines: 'same' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(1);
      expect(result.deduplicatedEdits).toBe(1);
    });

    test('treats replace with different pos as unique', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: 'same' },
        { op: 'replace', pos: '2#ZB', lines: 'same' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(2);
      expect(result.deduplicatedEdits).toBe(0);
    });

    test('treats replace with different content as unique', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: 'content1' },
        { op: 'replace', pos: '1#ZB', lines: 'content2' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(2);
    });

    test('treats replace with different end as unique', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', end: '3#ZB', lines: 'x' },
        { op: 'replace', pos: '1#ZB', end: '5#ZB', lines: 'x' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(2);
    });

    test('deduplicates range replace correctly', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', end: '5#ZB', lines: 'x' },
        { op: 'replace', pos: '1#ZB', end: '5#ZB', lines: 'x' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(1);
      expect(result.deduplicatedEdits).toBe(1);
    });

    test('keeps first occurrence of duplicates', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: 'same' },
        { op: 'replace', pos: '1#ZB', lines: 'same' },
        { op: 'replace', pos: '1#ZB', lines: 'same' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(1);
      expect(result.edits[0].lines).toBe('same');
      expect(result.deduplicatedEdits).toBe(2);
    });

    test('handles empty array', () => {
      const result = dedupeEdits([]);
      expect(result.edits).toHaveLength(0);
      expect(result.deduplicatedEdits).toBe(0);
    });

    test('handles append without pos', () => {
      const edits: HashlineEdit[] = [
        { op: 'append', lines: 'same' },
        { op: 'append', lines: 'same' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(1);
    });

    test('handles prepend without pos', () => {
      const edits: HashlineEdit[] = [
        { op: 'prepend', lines: 'same' },
        { op: 'prepend', lines: 'same' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(1);
    });

    test('treats different ops as unique even with same pos', () => {
      const edits: HashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: 'x' },
        { op: 'append', pos: '1#ZB', lines: 'x' },
        { op: 'prepend', pos: '1#ZB', lines: 'x' },
      ];
      const result = dedupeEdits(edits);
      expect(result.edits).toHaveLength(3);
    });
  });
});
