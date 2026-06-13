import { describe, expect, it } from 'vitest';
import { parseLogContent, queryEntries } from '../log-viewer.parser';

const SAMPLE = [
  '[2025-06-13T11:10:00.123] [INFO] normal - app started',
  '[2025-06-13T11:10:01.000] [ERROR] normal - boom',
  'Error: boom',
  '    at foo (bar.js:1:1)',
  '[2025-06-13T11:10:02.000] [WARN] normal - careful',
  '',
].join('\n');

describe('parseLogContent', () => {
  it('parses single-line entries with timestamp/level/category/message', () => {
    const entries = parseLogContent('[2025-06-13T11:10:00.123] [INFO] normal - hello world');
    expect(entries).toHaveLength(1);
    expect(entries[0]).toEqual({
      timestamp: '2025-06-13T11:10:00.123',
      level: 'info',
      category: 'normal',
      message: 'hello world',
    });
  });

  it('appends continuation lines (stack traces) to the previous entry', () => {
    const entries = parseLogContent(SAMPLE);
    expect(entries).toHaveLength(3);
    expect(entries[1].level).toBe('error');
    expect(entries[1].message).toBe('boom\nError: boom\n    at foo (bar.js:1:1)');
  });

  it('falls back to info for unknown levels', () => {
    const entries = parseLogContent('[2025-06-13T11:10:00.123] [MARK] normal - tagged');
    expect(entries[0].level).toBe('info');
  });
});

describe('queryEntries', () => {
  const entries = parseLogContent(SAMPLE);

  it('returns entries newest-first', () => {
    const result = queryEntries(entries, {});
    expect(result.total).toBe(3);
    expect(result.items[0].message).toBe('careful');
    expect(result.items[2].message.startsWith('app started')).toBe(true);
  });

  it('filters by level', () => {
    const result = queryEntries(entries, { levels: ['error'] });
    expect(result.total).toBe(1);
    expect(result.items[0].level).toBe('error');
  });

  it('filters by keyword case-insensitively', () => {
    const result = queryEntries(entries, { keyword: 'BOOM' });
    expect(result.total).toBe(1);
    expect(result.items[0].level).toBe('error');
  });

  it('paginates the filtered result', () => {
    const result = queryEntries(entries, { page: 2, pageSize: 2 });
    expect(result.total).toBe(3);
    expect(result.items).toHaveLength(1);
    expect(result.items[0].message.startsWith('app started')).toBe(true);
  });
});
