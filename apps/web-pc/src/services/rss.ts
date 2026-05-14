import { http } from '@/utils';
import type {
  CreateUserRssSubscriptionPayload,
  RssReaderHistoryFetchParams,
  RssReaderHistoryPayload,
  RssReaderFetchParams,
  RssReaderRawFeed,
  UpdateUserRssSettingPayload,
  UserRssSetting,
  UserRssSubscriptionItem,
} from '@volix/types';

export function getRssFeed(params: RssReaderFetchParams) {
  return http.get<RssReaderRawFeed>('/rss/feed', {
    params,
  });
}

export function getRssFeedHistory(params: RssReaderHistoryFetchParams) {
  return http.get<RssReaderHistoryPayload>('/rss/feed-history', {
    params,
  });
}

export function getUserRssSetting() {
  return http.get<UserRssSetting>('/rss/setting');
}

export function updateUserRssSetting(data: UpdateUserRssSettingPayload) {
  return http.put<UserRssSetting>('/rss/setting', data);
}

export function getUserRssSubscriptions() {
  return http.get<UserRssSubscriptionItem[]>('/rss/subscriptions');
}

export function addUserRssSubscription(data: CreateUserRssSubscriptionPayload) {
  return http.post<UserRssSubscriptionItem>('/rss/subscriptions', data);
}

export function removeUserRssSubscription(route: string) {
  return http.delete<{ route: string }>('/rss/subscriptions', {
    params: {
      route,
    },
  });
}
