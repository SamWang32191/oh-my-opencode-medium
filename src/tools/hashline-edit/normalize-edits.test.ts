import { describe, expect, test } from 'bun:test';
import {
  normalizeHashlineEdits,
  type RawHashlineEdit,
} from './normalize-edits';

describe('normalize-edits', () => {
  describe('normalizeHashlineEdits', () => {
    test('normalizes replace edit with required pos', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: 'new content' },
      ];
      const result = normalizeHashlineEdits(raw);
      expect(result).toHaveLength(1);
      expect(result[0].op).toBe('replace');
      expect(result[0].pos).toBe('1#ZB');
      expect(result[0].lines).toBe('new content');
    });

    test('normalizes replace edit with range (pos and end)', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', end: '3#ZB', lines: ['new1', 'new2'] },
      ];
      const result = normalizeHashlineEdits(raw);
      expect(result).toHaveLength(1);
      expect(result[0].op).toBe('replace');
      expect(result[0].pos).toBe('1#ZB');
      expect(result[0].end).toBe('3#ZB');
      expect(result[0].lines).toEqual(['new1', 'new2']);
    });

    test('normalizes replace with null lines for delete', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: null },
      ];
      const result = normalizeHashlineEdits(raw);
      expect(result[0].lines).toEqual([]);
    });

    test('normalizes replace with empty array lines for delete', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: [] },
      ];
      const result = normalizeHashlineEdits(raw);
      expect(result[0].lines).toEqual([]);
    });

    test('normalizes append edit with optional pos', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'append', pos: '5#ZB', lines: 'appended line' },
      ];
      const result = normalizeHashlineEdits(raw);
      expect(result).toHaveLength(1);
      expect(result[0].op).toBe('append');
      expect(result[0].pos).toBe('5#ZB');
      expect(result[0].lines).toBe('appended line');
    });

    test('normalizes append edit without pos (EOF)', () => {
      const raw: RawHashlineEdit[] = [{ op: 'append', lines: 'end of file' }];
      const result = normalizeHashlineEdits(raw);
      expect(result).toHaveLength(1);
      expect(result[0].op).toBe('append');
      expect(result[0].pos).toBeUndefined();
      expect(result[0].lines).toBe('end of file');
    });

    test('normalizes prepend edit with optional pos', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'prepend', pos: '1#ZB', lines: 'prepended line' },
      ];
      const result = normalizeHashlineEdits(raw);
      expect(result).toHaveLength(1);
      expect(result[0].op).toBe('prepend');
      expect(result[0].pos).toBe('1#ZB');
      expect(result[0].lines).toBe('prepended line');
    });

    test('normalizes prepend edit without pos (BOF)', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'prepend', lines: 'start of file' },
      ];
      const result = normalizeHashlineEdits(raw);
      expect(result).toHaveLength(1);
      expect(result[0].op).toBe('prepend');
      expect(result[0].pos).toBeUndefined();
      expect(result[0].lines).toBe('start of file');
    });

    test('handles array lines for replace', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: ['line1', 'line2', 'line3'] },
      ];
      const result = normalizeHashlineEdits(raw);
      expect(result[0].lines).toEqual(['line1', 'line2', 'line3']);
    });

    test('handles array lines for append', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'append', pos: '5#ZB', lines: ['line1', 'line2'] },
      ];
      const result = normalizeHashlineEdits(raw);
      expect(result[0].lines).toEqual(['line1', 'line2']);
    });

    test('throws on replace without pos or end', () => {
      const raw: RawHashlineEdit[] = [{ op: 'replace', lines: 'content' }];
      expect(() => normalizeHashlineEdits(raw)).toThrow();
    });

    test('throws on append without lines', () => {
      const raw: RawHashlineEdit[] = [{ op: 'append', pos: '1#ZB' }];
      expect(() => normalizeHashlineEdits(raw)).toThrow();
    });

    test('throws on prepend without lines', () => {
      const raw: RawHashlineEdit[] = [{ op: 'prepend', pos: '1#ZB' }];
      expect(() => normalizeHashlineEdits(raw)).toThrow();
    });

    test('throws on unsupported op', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'delete' as never, pos: '1#ZB', lines: 'x' },
      ];
      expect(() => normalizeHashlineEdits(raw)).toThrow();
    });

    test('normalizes multiple edits', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'replace', pos: '1#ZB', lines: 'new1' },
        { op: 'append', pos: '5#ZB', lines: 'new2' },
        { op: 'prepend', lines: 'new3' },
      ];
      const result = normalizeHashlineEdits(raw);
      expect(result).toHaveLength(3);
      expect(result[0].op).toBe('replace');
      expect(result[1].op).toBe('append');
      expect(result[2].op).toBe('prepend');
    });

    test('normalizes whitespace in pos/end', () => {
      const raw: RawHashlineEdit[] = [
        { op: 'replace', pos: '  1#ZB  ', end: '  3#ZB  ', lines: 'x' },
      ];
      const result = normalizeHashlineEdits(raw);
      expect(result[0].pos).toBe('1#ZB');
      expect(result[0].end).toBe('3#ZB');
    });
  });
});
