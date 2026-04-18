import { describe, expect, test } from 'vitest';
import { buildAnimeDownloadSelectionForTest } from '../../apps/api/src/modules/anime-subscription/service/anime-subscription.service';

describe('anime subscription candidate selection', () => {
  test('keeps collection candidates when episode is missing', () => {
    const result = buildAnimeDownloadSelectionForTest([
      {
        rss_guid: 'pack-1',
        rss_title: 'My Anime Complete',
        season: 1,
        episode: null,
        matchKind: 'collection',
        subtitle_language: 'zh',
        score: 10,
      },
    ]);

    expect(result.groupedKeys).toEqual(['collection:pack-1']);
  });
});
