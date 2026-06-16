import path from 'path';
import { describe, expect, it } from 'vitest';
import { getUserRssCacheDir, getUserRssFeedDir, getUserRssHistoryDir, getUserRssTaskDir } from '../../../../utils/path';
import { buildUserDirKey } from '../../../user/service/user.service';
import {
  buildRssSubscriptionStorageKey,
  getRssCacheRootDirByUserId,
  getRssFeedArchiveDirByUserId,
  getRssFeedIncrementalCacheDirByUserId,
  getRssFeedResponseCacheDirByUserId,
  getRssFeedRootDirByUserId,
  getRssSubscriptionDirPath,
  getRssTaskRootDirByUserId,
} from '../rss-storage-path.service';

describe('rss storage path helpers', () => {
  it('builds user-scoped rss roots', () => {
    const dirKey = buildUserDirKey('rss-user');

    expect(getRssFeedRootDirByUserId('rss-user')).toBe(getUserRssFeedDir(dirKey));
    expect(getRssCacheRootDirByUserId('rss-user')).toBe(getUserRssCacheDir(dirKey));
    expect(getRssTaskRootDirByUserId('rss-user')).toBe(getUserRssTaskDir(dirKey));
    expect(getRssFeedArchiveDirByUserId('rss-user')).toBe(path.join(getUserRssHistoryDir(dirKey), 'feed-archive'));
    expect(getRssFeedIncrementalCacheDirByUserId('rss-user')).toBe(
      path.join(getUserRssHistoryDir(dirKey), 'feed-incremental')
    );
    expect(getRssFeedResponseCacheDirByUserId('rss-user')).toBe(path.join(getUserRssCacheDir(dirKey), 'feed-response'));
  });

  it('builds stable subscription directories inside the user feed root', () => {
    const subscriptionKey = buildRssSubscriptionStorageKey({
      userId: 'rss-user',
      route: '/tech',
    });

    expect(getRssSubscriptionDirPath({ userId: 'rss-user', route: '/tech' })).toBe(
      path.join(getRssFeedRootDirByUserId('rss-user'), subscriptionKey)
    );
  });
});
