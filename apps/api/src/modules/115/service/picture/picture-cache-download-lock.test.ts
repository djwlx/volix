import { describe, expect, it } from 'vitest';
import {
  likeCacheDownloadJobMap,
  picCacheDownloadJobMap,
  randomCacheDownloadJobMap,
} from './picture-cache-random-core';

describe('picture cache download lock', () => {
  it('shares a single download job map across liked and random cache flows', () => {
    expect(likeCacheDownloadJobMap).toBe(picCacheDownloadJobMap);
    expect(randomCacheDownloadJobMap).toBe(picCacheDownloadJobMap);
  });
});
