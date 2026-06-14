import { describe, expect, it } from 'vitest';
import { getBootstrapPathList } from '../dependencies';
import { PATH } from '../path';

describe('bootstrap path list', () => {
  it('creates only system-level directories up front', () => {
    expect(getBootstrapPathList()).toEqual([
      { filePath: PATH.data, type: 'dir' },
      { filePath: PATH.log, type: 'dir' },
      { filePath: PATH.usersRoot, type: 'dir' },
    ]);
  });
});
