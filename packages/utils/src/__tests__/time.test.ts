import { describe, expect, it } from 'vitest';
import { formatDate, formatTime } from '../time';

const pad = (value: number) => String(value).padStart(2, '0');
const localExpected = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
  `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;

describe('formatTime', () => {
  it('formats ISO strings using the local timezone', () => {
    const iso = '2026-06-13T03:53:47.580Z';
    expect(formatTime(iso)).toBe(localExpected(new Date(iso)));
  });

  it('treats second-level timestamps as seconds', () => {
    const seconds = Math.floor(Date.UTC(2026, 5, 13, 3, 53, 47) / 1000);
    expect(formatTime(seconds)).toBe(localExpected(new Date(seconds * 1000)));
  });

  it('treats millisecond-level timestamps as milliseconds', () => {
    const ms = Date.UTC(2026, 5, 13, 3, 53, 47);
    expect(formatTime(ms)).toBe(localExpected(new Date(ms)));
  });

  it('accepts numeric strings as timestamps', () => {
    const seconds = Math.floor(Date.UTC(2026, 5, 13, 3, 53, 47) / 1000);
    expect(formatTime(String(seconds))).toBe(formatTime(seconds));
  });

  it('returns a placeholder for empty or invalid input', () => {
    expect(formatTime('')).toBe('-');
    expect(formatTime(null)).toBe('-');
    expect(formatTime('not-a-date')).toBe('-');
  });

  it('returns the current time when called without arguments', () => {
    expect(formatTime()).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});

describe('formatDate', () => {
  it('keeps only the date portion in local time', () => {
    const iso = '2026-06-13T20:00:00Z';
    expect(formatDate(iso)).toBe(localExpected(new Date(iso)).slice(0, 10));
  });

  it('returns a placeholder for invalid input', () => {
    expect(formatDate('nope')).toBe('-');
  });
});
