import path from 'path';
import { describe, expect, it } from 'vitest';
import { createDateFileAppender } from '../logger';

describe('createDateFileAppender', () => {
  it('keeps date-based rotation without size-based backup suffixes', () => {
    const appender = createDateFileAppender(path.join('/tmp', 'normal'));

    expect(appender.type).toBe('dateFile');
    expect(appender.pattern).toBe('yyyy-MM-dd.log');
    expect(appender.alwaysIncludePattern).toBe(true);
    expect(appender).not.toHaveProperty('maxLogSize');
    expect(appender).not.toHaveProperty('numBackups');
  });
});
