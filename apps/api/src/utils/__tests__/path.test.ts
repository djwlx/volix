import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  PATH,
  getUserCloudUploadDir,
  getUserFormatTaskDir,
  getUserRootDir,
  getUserRssCacheDir,
  getUserUploadDir,
} from '../path';

describe('user path helpers', () => {
  const dirKey = 'abc123';

  it('builds the user root under /data/users', () => {
    expect(getUserRootDir(dirKey)).toBe(path.join(PATH.usersRoot, dirKey));
  });

  it('builds upload and format task paths', () => {
    expect(getUserUploadDir(dirKey)).toBe(path.join(PATH.usersRoot, dirKey, 'upload'));
    expect(getUserCloudUploadDir(dirKey)).toBe(path.join(PATH.usersRoot, dirKey, 'upload', 'cloud'));
    expect(getUserFormatTaskDir(dirKey, '9')).toBe(
      path.join(PATH.usersRoot, dirKey, 'upload', 'format', '.tasks', '9')
    );
  });

  it('builds rss cache paths', () => {
    expect(getUserRssCacheDir(dirKey)).toBe(path.join(PATH.usersRoot, dirKey, 'rss', 'cache'));
  });
});
