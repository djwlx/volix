import path from 'path';
import { describe, expect, it } from 'vitest';
import {
  PATH,
  getUserCloudUploadDir,
  getUserFormatResultDir,
  getUserFormatTaskDir,
  getUserManualUploadDir,
} from '../../../../utils/path';
import {
  getFormatConvertCloudSourcePath,
  getFormatConvertManualSourcePath,
  getFormatConvertResultPath,
  getFormatConvertWorkspaceDir,
} from '../format-convert-workspace.service';

describe('format convert workspace paths', () => {
  const dirKey = 'userdir123';

  it('stores local upload sources under user manual upload', () => {
    const filePath = getFormatConvertManualSourcePath(dirKey, 'demo.mp4', 'fixed-id');

    expect(filePath).toBe(path.join(getUserManualUploadDir(dirKey), 'fixed-id-demo.mp4'));
  });

  it('stores cloud sources under user cloud upload', () => {
    const filePath = getFormatConvertCloudSourcePath(dirKey, 'movie.mkv', 'cloud-id');

    expect(filePath).toBe(path.join(getUserCloudUploadDir(dirKey), 'cloud-id-movie.mkv'));
  });

  it('stores task intermediates under hidden format tasks', () => {
    expect(getFormatConvertWorkspaceDir(dirKey, '12')).toBe(getUserFormatTaskDir(dirKey, '12'));
  });

  it('stores final results under format results', () => {
    expect(getFormatConvertResultPath(dirKey, '12', 'done.mp4')).toBe(
      path.join(getUserFormatResultDir(dirKey, '12'), 'done.mp4')
    );
  });
});
