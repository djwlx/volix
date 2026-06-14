import crypto from 'crypto';
import path from 'path';
import { getUserRssCacheDir, getUserRssFeedDir, getUserRssHistoryDir, getUserRssTaskDir } from '../../../utils/path';
import { buildUserDirKey } from '../../user/service/user.service';

const normalizeText = (value: string) => String(value || '').trim();

const digest = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

export const toRssUserSegment = (userId: string) => digest(normalizeText(userId)).slice(0, 16);

export const toRssRouteSegment = (route: string) => digest(normalizeText(route)).slice(0, 16);

export const toRssItemSegment = (itemKey: string) => digest(normalizeText(itemKey));

export const buildRssSubscriptionStorageKey = (params: { userId: string; route: string }) => {
  return `${toRssUserSegment(params.userId)}-${toRssRouteSegment(params.route)}`;
};

export const getRssDirKey = (userId: string) => buildUserDirKey(normalizeText(userId) || 'public');

export const getRssFeedRootDirByUserId = (userId: string) => getUserRssFeedDir(getRssDirKey(userId));

export const getRssHistoryRootDirByUserId = (userId: string) => getUserRssHistoryDir(getRssDirKey(userId));

export const getRssCacheRootDirByUserId = (userId: string) => getUserRssCacheDir(getRssDirKey(userId));

export const getRssTaskRootDirByUserId = (userId: string) => getUserRssTaskDir(getRssDirKey(userId));

export const getRssSubscriptionDirPath = (params: { userId: string; route: string }) => {
  return path.join(getRssFeedRootDirByUserId(params.userId), buildRssSubscriptionStorageKey(params));
};

export const getRssFeedResponseCacheDirByUserId = (userId: string) => {
  return path.join(getRssCacheRootDirByUserId(userId), 'feed-response');
};

export const getRssResourceProxyCacheDirByUserId = (userId: string) => {
  return path.join(getRssCacheRootDirByUserId(userId), 'resource-proxy');
};

export const getRssFeedArchiveDirByUserId = (userId: string) => {
  return path.join(getRssHistoryRootDirByUserId(userId), 'feed-archive');
};

export const getRssFeedIncrementalCacheDirByUserId = (userId: string) => {
  return path.join(getRssHistoryRootDirByUserId(userId), 'feed-incremental');
};
