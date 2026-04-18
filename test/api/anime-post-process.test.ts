import { beforeEach, describe, expect, test, vi } from 'vitest';

const { copyDownloadedAnimeToLibrary, runOpenlistAnimeLibraryOrganize } = vi.hoisted(() => ({
  copyDownloadedAnimeToLibrary: vi.fn(),
  runOpenlistAnimeLibraryOrganize: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/anime-subscription/service/anime-organizer.service', () => ({
  copyDownloadedAnimeToLibrary,
}));

vi.mock('../../apps/api/src/modules/openlist-ai-organizer/service/openlist-ai-organizer.service', () => ({
  runOpenlistAnimeLibraryOrganize,
}));

import { runAnimePostProcess } from '../../apps/api/src/modules/anime-subscription/service/anime-post-process.service';

describe('anime post process', () => {
  beforeEach(() => {
    copyDownloadedAnimeToLibrary.mockReset();
    runOpenlistAnimeLibraryOrganize.mockReset();
  });

  test('copies single episodes and then invokes AI organizer', async () => {
    copyDownloadedAnimeToLibrary.mockResolvedValue({
      copied: true,
      targetPath: '/anime/My Anime/S01/E03.mkv',
      copyMode: 'rename_to_target',
    });
    runOpenlistAnimeLibraryOrganize.mockResolvedValue({
      summary: 'ok',
      actionCount: 1,
    });

    const result = await runAnimePostProcess({
      subscription: { id: 1, name: 'My Anime', series_root_path: '/anime/My Anime' } as any,
      item: { id: 1, episode: 3 } as any,
      torrent: { name: 'My Anime - 03' } as any,
    });

    expect(copyDownloadedAnimeToLibrary).toHaveBeenCalledTimes(1);
    expect(runOpenlistAnimeLibraryOrganize).toHaveBeenCalledWith('/anime/My Anime');
    expect(result.organized).toBe(true);
    expect(result.stage).toBe('ai_organized');
  });

  test('preserves collection source names before AI organizer', async () => {
    copyDownloadedAnimeToLibrary.mockResolvedValue({
      copied: true,
      targetPath: '/anime/My Anime/My Anime Complete.mkv',
      copyMode: 'preserve_source_name',
    });
    runOpenlistAnimeLibraryOrganize.mockResolvedValue({
      summary: 'ok',
      actionCount: 2,
    });

    const result = await runAnimePostProcess({
      subscription: { id: 1, name: 'My Anime', series_root_path: '/anime/My Anime' } as any,
      item: { id: 2, episode: null } as any,
      torrent: { name: 'My Anime Complete' } as any,
    });

    expect(result.organized).toBe(true);
    expect(result.copyMode).toBe('preserve_source_name');
  });
});
