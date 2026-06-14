import path from 'path';
import { describe, expect, it } from 'vitest';
import { getUser115FormatDir, getUser115OriginalDir } from '../../../../../utils/path';
import { runWithRequestContext } from '../../../../../utils/request-context';
import { buildUserDirKey } from '../../../../user/service/user.service';
import { get115FormatCacheDir, get115OriginalCacheDir, get115RandomMetaFilePath } from '../picture-cache-path';

describe('picture cache path', () => {
  it('builds user-scoped 115 cache directories from the acting user id', async () => {
    await runWithRequestContext({ actingUserId: 'user-115' }, async () => {
      const dirKey = buildUserDirKey('user-115');
      expect(get115OriginalCacheDir()).toBe(getUser115OriginalDir(dirKey));
      expect(get115FormatCacheDir()).toBe(getUser115FormatDir(dirKey));
      expect(get115RandomMetaFilePath()).toBe(path.join(getUser115OriginalDir(dirKey), 'meta.random-picture.json'));
    });
  });
});
