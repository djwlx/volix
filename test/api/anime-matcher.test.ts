import { describe, expect, test } from 'vitest';
import { matchAnimeRssItem } from '../../apps/api/src/modules/anime-subscription/service/anime-matcher.service';

describe('anime matcher collection support', () => {
  const context = {
    name: 'My Anime',
    aliases: ['我的番'],
    matchKeywords: [],
    useAi: false,
  };

  test('marks normal episodes as episode matches', async () => {
    const result = await matchAnimeRssItem(context, {
      title: '[Group] My Anime - 03 [1080p]',
      description: '',
    });

    expect(result.matched).toBe(true);
    expect(result.matchKind).toBe('episode');
    expect(result.episode).toBe(3);
  });

  test('marks complete packs as collection matches without forcing episode', async () => {
    const result = await matchAnimeRssItem(context, {
      title: '[Group] My Anime Season Pack Complete [1080p]',
      description: '',
    });

    expect(result.matched).toBe(true);
    expect(result.matchKind).toBe('collection');
    expect(result.episode ?? null).toBeNull();
  });

  test('does not match unrelated collection keywords', async () => {
    const result = await matchAnimeRssItem(context, {
      title: '[Group] Other Anime Complete [1080p]',
      description: '',
    });

    expect(result.matched).toBe(false);
  });
});
