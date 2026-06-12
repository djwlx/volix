import { describe, expect, it } from 'vitest';
import {
  buildCloudSelectionEntry,
  createCloudSelectionMap,
  mergeLocalFiles,
  removeCloudSelectionEntry,
} from '../batch-selection';

const createMockFile = (name: string, size: number, type: string, lastModified: number) =>
  ({
    name,
    size,
    type,
    lastModified,
  } as File);

describe('format convert batch selection helpers', () => {
  it('merges local files without duplicating the same file signature', () => {
    const first = createMockFile('demo.mov', 10, 'video/quicktime', 1);
    const second = createMockFile('clip.mkv', 20, 'video/x-matroska', 2);
    const duplicateFirst = createMockFile('demo.mov', 10, 'video/quicktime', 1);

    const merged = mergeLocalFiles([first], [second, duplicateFirst]);

    expect(merged).toHaveLength(2);
    expect(merged.map(file => file.name)).toEqual(['demo.mov', 'clip.mkv']);
  });

  it('stores cloud selections by source path so cross-directory picks stay stable', () => {
    const first = buildCloudSelectionEntry({ path: '/movies/demo-a.mov', name: 'demo-a.mov' });
    const second = buildCloudSelectionEntry({ path: '/series/demo-b.mkv', name: 'demo-b.mkv' });
    const selection = createCloudSelectionMap([first, second]);

    expect(Object.keys(selection)).toEqual(['/movies/demo-a.mov', '/series/demo-b.mkv']);
    expect(selection['/series/demo-b.mkv']?.name).toBe('demo-b.mkv');
  });

  it('removes one cloud selection without disturbing the rest of the basket', () => {
    const first = buildCloudSelectionEntry({ path: '/movies/demo-a.mov', name: 'demo-a.mov' });
    const second = buildCloudSelectionEntry({ path: '/series/demo-b.mkv', name: 'demo-b.mkv' });

    const next = removeCloudSelectionEntry(createCloudSelectionMap([first, second]), '/movies/demo-a.mov');

    expect(Object.keys(next)).toEqual(['/series/demo-b.mkv']);
  });
});
