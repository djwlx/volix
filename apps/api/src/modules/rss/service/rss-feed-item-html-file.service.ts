import fs from 'fs';
import path from 'path';
import {
  getRssFeedRootDirByUserId,
  getRssSubscriptionDirPath as getUserScopedRssSubscriptionDirPath,
  toRssItemSegment,
  toRssRouteSegment,
  toRssUserSegment,
} from './rss-storage-path.service';

const KEY_SEGMENT_REGEX = /^[a-f0-9]{16,64}$/i;
const SUBSCRIPTION_SEGMENT_REGEX = /^[a-f0-9]{16}-[a-f0-9]{16}$/i;
const RESOURCE_FILE_NAME_REGEX = /^[a-z0-9][a-z0-9._-]{0,127}$/i;

const normalizeText = (value: string) => String(value || '').trim();

const sanitizeKeyPart = (value: string) => {
  const normalized = normalizeText(value).toLowerCase();
  return KEY_SEGMENT_REGEX.test(normalized) ? normalized : '';
};

const toSubscriptionSegment = (userSeg: string, routeSeg: string) => `${userSeg}-${routeSeg}`;

const toItemDirPath = (key: string) => {
  const [userSegRaw, routeSegRaw, itemSegRaw] = String(key || '').split('/');
  const userSeg = sanitizeKeyPart(userSegRaw);
  const routeSeg = sanitizeKeyPart(routeSegRaw);
  const itemSeg = sanitizeKeyPart(itemSegRaw);
  if (!userSeg || !routeSeg || !itemSeg) {
    return null;
  }
  return {
    subscriptionKey: toSubscriptionSegment(userSeg, routeSeg),
    itemKey: itemSeg,
  };
};

const toItemDirPathByUserId = (userId: string, key: string) => {
  const parsed = toItemDirPath(key);
  if (!parsed) {
    return null;
  }
  return path.join(getRssFeedRootDirByUserId(userId), parsed.subscriptionKey, parsed.itemKey);
};

export const buildRssItemHtmlFileKey = (params: { userId: string; route: string; itemKey: string }) => {
  const userSeg = toRssUserSegment(params.userId);
  const routeSeg = toRssRouteSegment(params.route);
  const itemSeg = toRssItemSegment(params.itemKey);
  return `${userSeg}/${routeSeg}/${itemSeg}`;
};

export const buildRssSubscriptionStorageKey = (params: { userId: string; route: string }) => {
  return toSubscriptionSegment(toRssUserSegment(params.userId), toRssRouteSegment(params.route));
};

export const getRssSubscriptionDirPath = (params: { userId: string; route: string }) => {
  return getUserScopedRssSubscriptionDirPath(params);
};

export const writeRssItemHtmlFile = async (params: {
  userId: string;
  route: string;
  itemKey: string;
  html: string;
}) => {
  const html = String(params.html || '');
  if (!html.trim()) {
    return '';
  }
  const key = buildRssItemHtmlFileKey(params);
  const itemDirPath = toItemDirPathByUserId(params.userId, key);
  const filePath = itemDirPath ? path.join(itemDirPath, 'index.html') : null;
  if (!filePath) {
    return '';
  }
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, html, 'utf-8');
  return key;
};

export const readRssItemHtmlFileByKey = async (params: { userId: string; key: string }) => {
  const itemDirPath = toItemDirPathByUserId(params.userId, params.key);
  const filePath = itemDirPath ? path.join(itemDirPath, 'index.html') : null;
  if (!filePath) {
    return '';
  }
  try {
    return await fs.promises.readFile(filePath, 'utf-8');
  } catch {
    return '';
  }
};

export const clearRssItemHtmlFilesByRoute = async (params: { userId: string; route: string }) => {
  await fs.promises
    .rm(getUserScopedRssSubscriptionDirPath(params), { recursive: true, force: true })
    .catch(() => undefined);
};

export const clearRssItemFilesByRouteItemKeys = async (params: {
  userId: string;
  route: string;
  itemKeys: string[];
}) => {
  const itemKeys = Array.from(new Set((params.itemKeys || []).map(item => String(item || '').trim()).filter(Boolean)));
  if (itemKeys.length === 0) {
    return;
  }
  await Promise.all(
    itemKeys.map(async itemKey => {
      const key = buildRssItemHtmlFileKey({
        userId: params.userId,
        route: params.route,
        itemKey,
      });
      const itemDirPath = toItemDirPathByUserId(params.userId, key);
      if (!itemDirPath) {
        return;
      }
      await fs.promises.rm(itemDirPath, { recursive: true, force: true }).catch(() => undefined);
    })
  );
};

export const clearRssItemHtmlFilesByUser = async (userId: string) => {
  await fs.promises.rm(getRssFeedRootDirByUserId(userId), { recursive: true, force: true }).catch(() => undefined);
};

const sanitizeResourceFileName = (fileName: string) => {
  const normalized = path.basename(normalizeText(fileName).toLowerCase()).replace(/[^a-z0-9._-]/g, '-');
  if (!RESOURCE_FILE_NAME_REGEX.test(normalized)) {
    return '';
  }
  return normalized;
};

const parseSubscriptionAndItemFromKey = (key: string) => {
  const [userSegRaw, routeSegRaw, itemSegRaw] = String(key || '').split('/');
  const userSeg = sanitizeKeyPart(userSegRaw);
  const routeSeg = sanitizeKeyPart(routeSegRaw);
  const itemSeg = sanitizeKeyPart(itemSegRaw);
  if (!userSeg || !routeSeg || !itemSeg) {
    return null;
  }
  return {
    subscriptionKey: toSubscriptionSegment(userSeg, routeSeg),
    itemKey: itemSeg,
  };
};

export const buildRssItemResourcePublicUrl = (params: { key: string; fileName: string }) => {
  const parsed = parseSubscriptionAndItemFromKey(params.key);
  const normalizedFileName = sanitizeResourceFileName(params.fileName);
  if (!parsed || !normalizedFileName) {
    return '';
  }
  return `/api/rss/resource/${encodeURIComponent(parsed.subscriptionKey)}/${encodeURIComponent(
    parsed.itemKey
  )}/${encodeURIComponent(normalizedFileName)}`;
};

export const writeRssItemResourceFile = async (params: {
  userId: string;
  key: string;
  fileName: string;
  content: Buffer;
}) => {
  const itemDirPath = toItemDirPathByUserId(params.userId, params.key);
  const normalizedFileName = sanitizeResourceFileName(params.fileName);
  if (!itemDirPath || !normalizedFileName || !Buffer.isBuffer(params.content) || params.content.length === 0) {
    return '';
  }
  const filePath = path.join(itemDirPath, normalizedFileName);
  await fs.promises.mkdir(itemDirPath, { recursive: true });
  await fs.promises.writeFile(filePath, params.content);
  return buildRssItemResourcePublicUrl({
    key: params.key,
    fileName: normalizedFileName,
  });
};

export const readRssItemResourceFile = async (params: {
  userId: string;
  subscriptionKey: string;
  itemKey: string;
  fileName: string;
}) => {
  const subscriptionKey = normalizeText(params.subscriptionKey).toLowerCase();
  const itemKey = sanitizeKeyPart(params.itemKey);
  const fileName = sanitizeResourceFileName(params.fileName);
  if (!SUBSCRIPTION_SEGMENT_REGEX.test(subscriptionKey) || !itemKey || !fileName) {
    return null;
  }
  const filePath = path.join(getRssFeedRootDirByUserId(params.userId), subscriptionKey, itemKey, fileName);
  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat?.isFile()) {
    return null;
  }
  return {
    filePath,
    fileName,
  };
};
