import { describe, expect, it } from 'vitest';
import { buildRouteFilterOption, normalizeText } from './aggregate-utils';

describe('rss aggregate utils', () => {
  it('builds route filter option with title label and full search text', () => {
    const option = buildRouteFilterOption({
      routeName: 'M-Team - TP',
      route:
        'https://rss.m-team.cc/api/rss/fetch?categories=429%2C430%2C426%2C432%2C433%2C412%2C413&pageSize=10&sign=53deaf7a7d327197a181bffc9289f170&t=1782302568&keys=ttitle&uid=354010',
    });

    expect(option.labelText).toBe('M-Team - TP');
    expect(option.value).toBe(
      'https://rss.m-team.cc/api/rss/fetch?categories=429%2C430%2C426%2C432%2C433%2C412%2C413&pageSize=10&sign=53deaf7a7d327197a181bffc9289f170&t=1782302568&keys=ttitle&uid=354010'
    );
    expect(option.routeText).toBe('rss.m-team.cc/api/rss/fetch');
    expect(option.searchText).toContain('M-Team - TP');
    expect(option.searchText).toContain('https://rss.m-team.cc/api/rss/fetch');
  });

  it('keeps short route filter label as title only', () => {
    const option = buildRouteFilterOption({
      routeName: 'Tech',
      route: '/zhihu/daily',
    });

    expect(option.labelText).toBe('Tech');
    expect(option.routeText).toBe('/zhihu/daily');
    expect(normalizeText(option.searchText)).toBe('tech · /zhihu/daily');
  });
});
