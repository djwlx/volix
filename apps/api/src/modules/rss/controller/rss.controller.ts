import {
  clearRssStorageData,
  createUserRssSubscription,
  fetchRssFeed,
  getRssStorageData,
  getRssCachedResourceData,
  getUserRssSetting,
  listUserRssSubscriptions,
  removeUserRssSubscription,
  setUserRssSubscriptionEnabled,
  updateUserRssSetting,
} from '../service/rss.service';
import fs from 'fs';
import mime from 'mime-types';
import { badRequest } from '../../shared/http-handler';
import { t } from '../../../utils/i18n';
import { readRssItemResourceFile } from '../service/rss-feed-item-html-file.service';
import type {
  ClearRssStoragePayload,
  CreateUserRssSubscriptionPayload,
  GetRssFeedParams,
  UpdateUserRssSettingPayload,
  UpdateUserRssSubscriptionEnabledPayload,
} from '../types/rss.types';

export const getRssFeed: MyMiddleware = async ctx => {
  const query = ctx.query as unknown as GetRssFeedParams;
  return fetchRssFeed(query, ctx.state.userInfo?.id);
};

export const getCurrentUserRssSetting: MyMiddleware = async ctx => {
  return getUserRssSetting(ctx.state.userInfo?.id);
};

export const updateCurrentUserRssSetting: MyMiddleware = async ctx => {
  const body = (ctx.request.body || {}) as UpdateUserRssSettingPayload;
  return updateUserRssSetting(ctx.state.userInfo?.id, body);
};

export const getCurrentUserRssSubscriptions: MyMiddleware = async ctx => {
  return listUserRssSubscriptions(ctx.state.userInfo?.id);
};

export const addCurrentUserRssSubscription: MyMiddleware = async ctx => {
  const body = (ctx.request.body || {}) as CreateUserRssSubscriptionPayload;
  return createUserRssSubscription(ctx.state.userInfo?.id, body);
};

export const removeCurrentUserRssSubscription: MyMiddleware = async ctx => {
  const route = String(ctx.query.route || '');
  return removeUserRssSubscription(ctx.state.userInfo?.id, route);
};

export const updateCurrentUserRssSubscriptionEnabled: MyMiddleware = async ctx => {
  const body = (ctx.request.body || {}) as UpdateUserRssSubscriptionEnabledPayload;
  return setUserRssSubscriptionEnabled(ctx.state.userInfo?.id, body);
};

export const getRssStorage: MyMiddleware = async ctx => {
  return getRssStorageData(ctx.state.userInfo?.id);
};

export const clearCurrentUserRssStorage: MyMiddleware = async ctx => {
  const body = (ctx.request.body || {}) as ClearRssStoragePayload;
  return clearRssStorageData(ctx.state.userInfo?.id, body);
};

export const getRssCachedResource: MyMiddleware = async ctx => {
  const cacheKey = String(ctx.params?.cacheKey || '');
  const cached = await getRssCachedResourceData(cacheKey);
  ctx.set('Content-Type', cached.contentType || 'application/octet-stream');
  ctx.set('Content-Disposition', `inline; filename="${encodeURIComponent(cached.fileName || 'resource.bin')}"`);
  ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
  ctx.body = fs.createReadStream(cached.filePath);
};

export const getRssItemResource: MyMiddleware = async ctx => {
  const subscriptionKey = String(ctx.params?.subscriptionKey || '');
  const itemKey = String(ctx.params?.itemKey || '');
  const fileName = String(ctx.params?.fileName || '');
  const resource = await readRssItemResourceFile({
    subscriptionKey,
    itemKey,
    fileName,
  });
  if (!resource) {
    badRequest(t('rssApi.resourceNotFound'));
    return;
  }
  const contentType = String(mime.lookup(resource.fileName) || 'application/octet-stream');
  ctx.set('Content-Type', contentType);
  ctx.set('Content-Disposition', `inline; filename="${encodeURIComponent(resource.fileName || 'resource.bin')}"`);
  ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
  ctx.body = fs.createReadStream(resource.filePath);
};
