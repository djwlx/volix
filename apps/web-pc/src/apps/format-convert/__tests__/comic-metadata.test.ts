import { describe, expect, it } from 'vitest';
import { hydrateComicMetadataDraft } from '../comic-metadata';

describe('comic metadata draft', () => {
  it('merges analyzed ComicInfo into the default draft', () => {
    const draft = hydrateComicMetadataDraft({
      archiveFormat: 'zip',
      fileExtension: '.cbz',
      expectedExtension: '.cbz',
      extensionMatches: true,
      hasComicInfo: true,
      entriesCount: 10,
      imageCount: 8,
      pageCount: 8,
      comicInfo: {
        title: 'Batman',
        writer: 'Jeph Loeb',
        genres: ['Mystery'],
      },
    });

    expect(draft.metadata.title).toBe('Batman');
    expect(draft.metadata.writer).toBe('Jeph Loeb');
    expect(draft.metadata.genres).toEqual(['Mystery']);
    expect(draft.metadata.tags).toEqual([]);
    expect(draft.metadata.manga).toBe('Unknown');
  });
});
