import fs from 'fs';
import path from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { PATH } from '../../../../utils/path';
import { resolvePublicRssItemResourcePath } from '../rss-public-resource-path.service';

const createdDirs = new Set<string>();

afterEach(async () => {
  await Promise.all(Array.from(createdDirs).map(dir => fs.promises.rm(dir, { recursive: true, force: true })));
  createdDirs.clear();
});

describe('rss public resource path', () => {
  it('finds rss item resources across user directories', async () => {
    const userDir = path.join(PATH.usersRoot, 'test-user-rss-public');
    const targetDir = path.join(
      userDir,
      'rss',
      'feed',
      '6b86b273ff34fce1-5694945e0d7339dd',
      '898b2cd01483fba867db54bf588ba02d4fe7135d0d46441429608426eea9601b'
    );
    const filePath = path.join(targetDir, 'demo.webp');
    createdDirs.add(userDir);
    await fs.promises.mkdir(targetDir, { recursive: true });
    await fs.promises.writeFile(filePath, 'demo');

    const resolved = await resolvePublicRssItemResourcePath({
      subscriptionKey: '6b86b273ff34fce1-5694945e0d7339dd',
      itemKey: '898b2cd01483fba867db54bf588ba02d4fe7135d0d46441429608426eea9601b',
      fileName: 'demo.webp',
    });

    expect(resolved?.filePath).toBe(filePath);
  });
});
