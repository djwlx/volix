import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getLogFilePath, listLogDates, readLogEntries } from '../log-viewer.service';
import { PATH } from '../../../../utils/path';

const ROTATED_DATE = '2099-01-01';
const ROTATED_FILE = path.join(PATH.log, 'normal', `normal.${ROTATED_DATE}.log.1`);
const ROTATED_CONTENT = '[2099-01-01T08:00:00.000] [INFO] normal - rotated only entry\n';

describe('log viewer service', () => {
  beforeEach(async () => {
    await fs.promises.mkdir(path.dirname(ROTATED_FILE), { recursive: true });
    await fs.promises.writeFile(ROTATED_FILE, ROTATED_CONTENT, 'utf-8');
  });

  afterEach(async () => {
    await fs.promises.rm(ROTATED_FILE, { force: true });
  });

  it('lists dates backed only by rotated log files', async () => {
    const dates = await listLogDates('normal');
    expect(dates).toContain(ROTATED_DATE);
  });

  it('reads entries from rotated log files when the base file is absent', async () => {
    const result = await readLogEntries('normal', ROTATED_DATE, {});
    expect(result.total).toBe(1);
    expect(result.items[0]?.message).toBe('rotated only entry');
  });

  it('resolves downloads to a rotated log file when the base file is absent', () => {
    const result = getLogFilePath('normal', ROTATED_DATE);
    expect(result.filePath).toBe(ROTATED_FILE);
    expect(result.fileName).toBe(`normal.${ROTATED_DATE}.log.1`);
  });
});
