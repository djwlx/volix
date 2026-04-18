import type { OpenlistFsGetData, OpenlistFsObject } from '@volix/types';
import {
  pickRandomOpenlistImageForAi,
  pickRandomOpenlistImageWithPagedFallbackForAi,
  resolveOpenlistAiSearchRoots,
} from '../../apps/api/src/modules/openlist-ai-organizer/service/openlist-ai-organizer.service';

const createEntry = (name: string, isDir: boolean): OpenlistFsObject => ({
  name,
  is_dir: isDir,
  size: isDir ? 0 : 1,
  modified: '2026-04-18T00:00:00.000Z',
});

describe('openlist ai chat tools', () => {
  const tree = new Map<string, OpenlistFsObject[]>([
    ['/', [createEntry('X', true), createEntry('Library', true), createEntry('README.md', false)]],
    ['/X', [createEntry('album-a', true), createEntry('note.txt', false)]],
    ['/X/album-a', [createEntry('01.jpg', false), createEntry('02.txt', false)]],
    ['/Library', [createEntry('X', true)]],
    ['/Library/X', [createEntry('03.png', false)]],
  ]);

  const reader = {
    read: async (targetPath: string) => tree.get(targetPath) || [],
  };

  const getFs = async (targetPath: string): Promise<OpenlistFsGetData> => ({
    name: targetPath.split('/').pop() || '',
    size: 1,
    is_dir: false,
    modified: '2026-04-18T00:00:00.000Z',
    raw_url: `https://openlist.example${targetPath}`,
  });

  test('searches relative path globally instead of forcing a fixed mount root', async () => {
    await expect(resolveOpenlistAiSearchRoots(reader, 'X')).resolves.toEqual(['/X', '/Library/X']);
  });

  test('recursively picks an image and returns the OpenList raw_url', async () => {
    const result = await pickRandomOpenlistImageForAi({
      rawPath: 'X',
      reader,
      getFs,
      random: () => 0,
    });

    expect(result.rootPath).toBe('/X');
    expect(result.selectedPath).toBe('/X/album-a/01.jpg');
    expect(result.imageUrl).toBe('https://openlist.example/X/album-a/01.jpg');
  });

  test('uses absolute paths as-is', async () => {
    const result = await pickRandomOpenlistImageForAi({
      rawPath: '/Library/X',
      reader,
      getFs,
      random: () => 0,
    });

    expect(result.rootPath).toBe('/Library/X');
    expect(result.selectedPath).toBe('/Library/X/03.png');
  });

  test('stops after finding an image in a randomly chosen child directory', async () => {
    const reads: string[] = [];
    const localTree = new Map<string, OpenlistFsObject[]>([
      ['/X', [createEntry('alpha', true), createEntry('beta', true), createEntry('gamma', true)]],
      ['/X/alpha', [createEntry('deep', true)]],
      ['/X/alpha/deep', [createEntry('never.jpg', false)]],
      ['/X/beta', [createEntry('hit.png', false)]],
      ['/X/gamma', [createEntry('later.jpg', false)]],
    ]);

    const result = await pickRandomOpenlistImageForAi({
      rawPath: '/X',
      reader: {
        read: async targetPath => {
          reads.push(targetPath);
          return localTree.get(targetPath) || [];
        },
      },
      getFs,
      random: (() => {
        const values = [0.4, 0];
        return () => values.shift() ?? 0;
      })(),
    });

    expect(result.selectedPath).toBe('/X/beta/hit.png');
    expect(reads).toEqual(['/X', '/X/beta']);
  });

  test('backtracks to another random sibling when the first branch has no image', async () => {
    const reads: string[] = [];
    const localTree = new Map<string, OpenlistFsObject[]>([
      ['/X', [createEntry('empty', true), createEntry('target', true)]],
      ['/X/empty', [createEntry('nested', true)]],
      ['/X/empty/nested', [createEntry('note.txt', false)]],
      ['/X/target', [createEntry('found.jpg', false)]],
    ]);

    const result = await pickRandomOpenlistImageForAi({
      rawPath: '/X',
      reader: {
        read: async targetPath => {
          reads.push(targetPath);
          return localTree.get(targetPath) || [];
        },
      },
      getFs,
      random: (() => {
        const values = [0, 0, 0];
        return () => values.shift() ?? 0;
      })(),
    });

    expect(result.selectedPath).toBe('/X/target/found.jpg');
    expect(reads).toEqual(['/X', '/X/empty', '/X/empty/nested', '/X/target']);
  });

  test('retries with the second page when recursive search on the first page finds no image', async () => {
    const pageCalls: number[] = [];

    const result = await pickRandomOpenlistImageWithPagedFallbackForAi({
      rawPath: '/X',
      createReader: async maxPages => {
        pageCalls.push(maxPages);
        return {
          read: async targetPath => {
            if (targetPath !== '/X') {
              return [];
            }

            if (maxPages === 1) {
              return [createEntry('note.txt', false)];
            }

            return [createEntry('page-2-hit.jpg', false)];
          },
        };
      },
      getFs,
      random: () => 0,
      maxPageAttempts: 2,
    });

    expect(result.selectedPath).toBe('/X/page-2-hit.jpg');
    expect(pageCalls).toEqual([1, 2]);
  });
});
