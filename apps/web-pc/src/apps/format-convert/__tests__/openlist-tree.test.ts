import { describe, expect, it } from 'vitest';
import { toOpenlistTreeNodes } from '../openlist-tree';

describe('openlist tree helpers', () => {
  it('suppresses default leaf icons in file mode while keeping directories', () => {
    const nodes = toOpenlistTreeNodes(
      [
        { name: 'folder', path: '/folder', isDir: true, size: 0 },
        { name: 'video.mp4', path: '/folder/video.mp4', isDir: false, size: 1024 },
      ],
      'file'
    );

    expect(nodes[0]).not.toHaveProperty('icon');
    expect(nodes[1]?.icon).toEqual([]);
  });
});
