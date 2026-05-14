import {
  createUserRssSubscription,
  fetchRssFeed,
  getRssCachedResourceData,
  getUserRssSetting,
  listUserRssSubscriptions,
  removeUserRssSubscription,
  updateUserRssSetting,
} from '../service/rss.service';
import { fetchRssFeedHistoryPage } from '../service/rss-feed-history.service';
import fs from 'fs';
import type {
  CreateUserRssSubscriptionPayload,
  GetRssFeedParams,
  GetRssFeedHistoryParams,
  UpdateUserRssSettingPayload,
} from '../types/rss.types';

export const getRssFeed: MyMiddleware = async ctx => {
  const query = ctx.query as unknown as GetRssFeedParams;
  return fetchRssFeed(query, ctx.state.userInfo?.id);
};

export const getRssFeedHistory: MyMiddleware = async ctx => {
  const query = ctx.query as unknown as GetRssFeedHistoryParams;
  return fetchRssFeedHistoryPage(query, ctx.state.userInfo?.id);
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

export const getRssCachedResource: MyMiddleware = async ctx => {
  const cacheKey = String(ctx.params?.cacheKey || '');
  const cached = await getRssCachedResourceData(cacheKey);
  ctx.set('Content-Type', cached.contentType || 'application/octet-stream');
  ctx.set('Content-Disposition', `inline; filename="${encodeURIComponent(cached.fileName || 'resource.bin')}"`);
  ctx.set('Cache-Control', 'public, max-age=31536000, immutable');
  ctx.body = fs.createReadStream(cached.filePath);
};
