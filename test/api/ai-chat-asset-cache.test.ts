import fs from 'fs';
import os from 'os';
import path from 'path';
import { createHash } from 'crypto';
import type { UploadedFileMeta } from '@volix/types';
import { cacheRemoteAiImageAsset } from '../../apps/api/src/modules/ai/service/ai-chat-asset-cache.service';

const sha1 = (value: string) => createHash('sha1').update(value).digest('hex');

describe('ai chat asset cache', () => {
  test('downloads a remote image into the local file directory and reuses it later', async () => {
    const uploadDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'volix-ai-cache-'));
    const sourceUrl = 'https://example.com/demo.jpg?token=1';
    const cacheKey = sha1('/对象储存R2/img/demo.jpg|2026-04-18T00:00:00.000Z|1024');
    const savedRecords: UploadedFileMeta[] = [];

    try {
      const first = await cacheRemoteAiImageAsset(
        {
          sourceUrl,
          fileName: 'demo.jpg',
          cacheKey,
        },
        {
          uploadDir,
          fetchImpl: async () =>
            ({
              ok: true,
              status: 200,
              headers: new Headers({
                'content-type': 'image/jpeg',
              }),
              arrayBuffer: async () => Uint8Array.from([1, 2, 3, 4]).buffer,
            } as Response),
          getFileByUuid: async uuid => savedRecords.find(item => item.uuid === uuid),
          saveFileRecord: async file => {
            savedRecords.push(file);
            return file;
          },
        }
      );

      expect(first.publicPath).toBe(`/file/${encodeURIComponent(`${cacheKey}.demo.jpg`)}`);
      expect(first.cached).toBe(false);
      await expect(fs.promises.access(path.join(uploadDir, `${cacheKey}.demo.jpg`))).resolves.toBeUndefined();

      const second = await cacheRemoteAiImageAsset(
        {
          sourceUrl,
          fileName: 'demo.jpg',
          cacheKey,
        },
        {
          uploadDir,
          fetchImpl: async () => {
            throw new Error('fetch should not run when cache exists');
          },
          getFileByUuid: async uuid => savedRecords.find(item => item.uuid === uuid),
          saveFileRecord: async file => file,
        }
      );

      expect(second.cached).toBe(true);
      expect(second.publicPath).toBe(first.publicPath);
    } finally {
      await fs.promises.rm(uploadDir, { recursive: true, force: true });
    }
  });
});
