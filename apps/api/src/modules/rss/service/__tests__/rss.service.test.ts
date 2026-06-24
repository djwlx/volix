import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { UserRssSubscriptionStateRow } from '../rss-feed-db.service';

const requestGet = vi.fn();
const queryUser = vi.fn();
const updateUser = vi.fn();
const listUserRssSubscriptionStates = vi.fn();
const upsertUserRssSubscriptionState = vi.fn();
const isUserRssSubscriptionEnabled = vi.fn();
const hasPendingRssFeedTask = vi.fn();
const getProcessedRssFeedPayload = vi.fn();
const enqueueRssFeedProcessingTask = vi.fn();
const startRssPendingQueue = vi.fn();
const emitRssStorageChanged = vi.fn();

vi.mock('../../../../utils/request', () => ({
  default: {
    get: requestGet,
  },
}));

vi.mock('../../../user/service/user.service', () => ({
  queryUser,
  updateUser,
}));

vi.mock('../rss-feed-db.service', () => ({
  listUserRssSubscriptionStates,
  upsertUserRssSubscriptionState,
  isUserRssSubscriptionEnabled,
  listAllRssSubscriptionStates: vi.fn(),
  removeUserRssSubscriptionState: vi.fn(),
  updateUserRssSubscriptionEnabled: vi.fn(),
}));

vi.mock('../rss-storage.service', () => ({
  clearRssStorage: vi.fn(),
  clearRssSubscriptionStorage: vi.fn(),
  enqueueRssFeedProcessingTask,
  getProcessedRssFeedPayload,
  hasPendingRssFeedTask,
  getRssPendingFeedPlaceholder: vi.fn((feedUrl: string) => ({
    feedUrl,
    contentType: 'application/rss+xml',
    fetchedAt: new Date(0).toISOString(),
    xml: '',
    items: [],
  })),
  getRssStorageStatus: vi.fn(),
  startRssPendingQueue,
}));

vi.mock('../rss-realtime.service', () => ({
  emitRssStorageChanged,
}));

const buildSubscriptionRow = (route: string, feedUrl: string): UserRssSubscriptionStateRow => ({
  id: 1,
  userId: 'user-1',
  route,
  name: route,
  feedUrl,
  enabled: true,
  createdAt: '',
  updatedAt: '',
});

describe('rss service source resolution', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryUser.mockResolvedValue({
      dataValues: {
        rss_config: JSON.stringify({
          host: 'https://rsshub.example.com',
          resourceProxyBaseUrl: '',
          refreshIntervalMinutes: 5,
          resourceDownloadMaxRetry: 10,
        }),
      },
    });
    listUserRssSubscriptionStates.mockResolvedValue([]);
    upsertUserRssSubscriptionState.mockResolvedValue(undefined);
    isUserRssSubscriptionEnabled.mockResolvedValue(true);
    hasPendingRssFeedTask.mockResolvedValue(false);
    getProcessedRssFeedPayload.mockResolvedValue(null);
    enqueueRssFeedProcessingTask.mockResolvedValue(undefined);
    startRssPendingQueue.mockReturnValue(undefined);
    requestGet.mockResolvedValue({
      data: '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Test</title></channel></rss>',
      headers: {
        'content-type': 'application/rss+xml',
      },
    });
  });

  it('uses the absolute route as feed source when creating a subscription', async () => {
    const route = 'https://example.com/feed.xml';
    listUserRssSubscriptionStates.mockResolvedValueOnce([]).mockResolvedValueOnce([buildSubscriptionRow(route, route)]);
    const { createUserRssSubscription } = await import('../rss.service');

    const result = await createUserRssSubscription('user-1', {
      route,
      name: 'Example Feed',
    });

    expect(result.route).toBe(route);
    expect(upsertUserRssSubscriptionState).toHaveBeenCalledWith({
      userId: 'user-1',
      route,
      name: 'Example Feed',
      feedUrl: route,
    });
  });

  it('fetches an absolute route directly instead of prefixing the RSSHub host', async () => {
    const route = 'https://example.com/feed.xml';
    const { fetchRssFeed } = await import('../rss.service');

    await fetchRssFeed({ route, force: true }, 'user-1');

    expect(requestGet).toHaveBeenCalledWith(
      route,
      expect.objectContaining({
        responseType: 'text',
      })
    );
  });

  it('keeps using the configured RSSHub host for relative routes', async () => {
    const { fetchRssFeed } = await import('../rss.service');

    await fetchRssFeed({ route: '/zhihu/daily', force: true }, 'user-1');

    expect(requestGet).toHaveBeenCalledWith(
      'https://rsshub.example.com/zhihu/daily',
      expect.objectContaining({
        responseType: 'text',
      })
    );
  });
});
