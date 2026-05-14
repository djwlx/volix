import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from '../apps/api/src/utils/request';
import { PATH } from '../apps/api/src/utils/path';
import {
  cacheRemoteResource,
  getCachedResourceByKey,
} from '../apps/api/src/modules/shared/service/resource-proxy-cache.service';

const makeTempCacheRoot = () => fs.mkdtempSync(path.join(os.tmpdir(), 'volix-rss-cache-'));

describe('resource-proxy-cache service', () => {
  let tempCacheRoot = '';

  beforeEach(() => {
    tempCacheRoot = makeTempCacheRoot();
    vi.spyOn(PATH, 'cache', 'get').mockReturnValue(tempCacheRoot);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    if (tempCacheRoot) {
      await fs.promises.rm(tempCacheRoot, { recursive: true, force: true });
    }
  });

  it('stores downloaded resource as original raw format instead of .bin', async () => {
    vi.spyOn(request, 'get').mockResolvedValue({
      data: Buffer.from('jpeg-binary'),
      headers: {
        'content-type': 'image/jpeg',
      },
    } as any);

    const sourceUrl = 'https://cdn.example.com/path/photo.jpg';
    const cached = await cacheRemoteResource({
      scope: 'rss',
      sourceUrl,
      maxCacheSizeMb: 128,
    });

    expect(path.extname(cached.filePath)).toBe('.jpg');
    expect(cached.filePath.endsWith('.bin')).toBe(false);
    expect(cached.fileName).toBe('photo.jpg');
    expect(await fs.promises.readFile(cached.filePath, 'utf-8')).toBe('jpeg-binary');
  });

  it('keeps compatibility with existing legacy .bin cache files', async () => {
    const sourceUrl = 'https://cdn.example.com/legacy.png';
    const cacheKey = crypto.createHash('sha256').update(sourceUrl).digest('hex');
    const scopeDir = path.join(tempCacheRoot, 'rss-resource-proxy');
    const legacyDataPath = path.join(scopeDir, `${cacheKey}.bin`);
    const metaPath = path.join(scopeDir, `${cacheKey}.json`);

    await fs.promises.mkdir(scopeDir, { recursive: true });
    await fs.promises.writeFile(legacyDataPath, Buffer.from('legacy-bytes'));
    await fs.promises.writeFile(
      metaPath,
      JSON.stringify({
        cacheKey,
        sourceUrl,
        fileName: 'legacy.png',
        contentType: 'image/png',
        sizeBytes: 12,
        updatedAtMs: Date.now(),
      }),
      'utf-8'
    );

    const cached = await getCachedResourceByKey({
      scope: 'rss',
      cacheKey,
    });

    expect(cached).not.toBeNull();
    expect(cached!.filePath).toBe(legacyDataPath);
    expect(await fs.promises.readFile(cached!.filePath, 'utf-8')).toBe('legacy-bytes');
  });
});
