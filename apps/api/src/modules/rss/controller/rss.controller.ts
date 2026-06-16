import {
  clearRssStorageData,
  createUserRssSubscription,
  fetchRssFeed,
  getRssStorageData,
  getUserRssSetting,
  listUserRssSubscriptions,
  removeUserRssSubscription,
  setUserRssSubscriptionEnabled,
  updateUserRssSetting,
} from '../service/rss.service';
import { readRssItemResourceFileByLocator } from '../service/rss-item-resource.service';
import fs from 'fs';
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

export const getRssItemResourceFile: MyMiddleware = async ctx => {
  const resource = await readRssItemResourceFileByLocator({
    dirKey: String(ctx.params?.dirKey || ''),
    subscriptionKey: String(ctx.params?.subscriptionKey || ''),
    itemSeg: String(ctx.params?.itemSeg || ''),
    resourceId: String(ctx.params?.resourceId || ''),
  });
  if (!resource) {
    ctx.status = 404;
    return;
  }
  ctx.set('Content-Type', resource.contentType || 'application/octet-stream');
  ctx.set('Content-Disposition', `inline; filename="${encodeURIComponent(resource.fileName || 'resource.bin')}"`);
  ctx.set('Cache-Control', 'private, max-age=31536000, immutable');
  ctx.body = fs.createReadStream(resource.filePath);
};
