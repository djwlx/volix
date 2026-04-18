import type { OpenlistFsGetData, OpenlistFsObject } from '@volix/types';
import {
  pickRandomOpenlistImageForAi,
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
});
