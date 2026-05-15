import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PATH } from '../../../utils/path';

export const RSS_FEED_ROOT_DIR = path.join(PATH.cache, 'rss-feed');
const RSS_FEED_LEGACY_ITEM_HTML_DIR = path.join(PATH.cache, 'rss-feed-item-html');
const KEY_SEGMENT_REGEX = /^[a-f0-9]{16,64}$/i;
const SUBSCRIPTION_SEGMENT_REGEX = /^[a-f0-9]{16}-[a-f0-9]{16}$/i;
const RESOURCE_FILE_NAME_REGEX = /^[a-z0-9][a-z0-9._-]{0,127}$/i;

const normalizeText = (value: string) => String(value || '').trim();

const digest = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const toUserSegment = (userId: string) => digest(normalizeText(userId)).slice(0, 16);
const toRouteSegment = (route: string) => digest(normalizeText(route)).slice(0, 16);
const toItemSegment = (itemKey: string) => digest(normalizeText(itemKey));

const sanitizeKeyPart = (value: string) => {
  const normalized = normalizeText(value).toLowerCase();
  return KEY_SEGMENT_REGEX.test(normalized) ? normalized : '';
};

const toSubscriptionSegment = (userSeg: string, routeSeg: string) => `${userSeg}-${routeSeg}`;
const toSubscriptionDirPath = (userId: string, route: string) =>
  path.join(RSS_FEED_ROOT_DIR, toSubscriptionSegment(toUserSegment(userId), toRouteSegment(route)));

const toItemDirPath = (key: string) => {
  const [userSegRaw, routeSegRaw, itemSegRaw] = String(key || '').split('/');
  const userSeg = sanitizeKeyPart(userSegRaw);
  const routeSeg = sanitizeKeyPart(routeSegRaw);
  const itemSeg = sanitizeKeyPart(itemSegRaw);
  if (!userSeg || !routeSeg || !itemSeg) {
    return null;
  }
  return path.join(RSS_FEED_ROOT_DIR, toSubscriptionSegment(userSeg, routeSeg), itemSeg);
};

const toFilePathFromKey = (key: string) => {
  const itemDirPath = toItemDirPath(key);
  if (!itemDirPath) {
    return null;
  }
  return path.join(itemDirPath, 'index.html');
};

const toLegacyFilePathFromKey = (key: string) => {
  const [userSegRaw, routeSegRaw, itemSegRaw] = String(key || '').split('/');
  const userSeg = sanitizeKeyPart(userSegRaw);
  const routeSeg = sanitizeKeyPart(routeSegRaw);
  const itemSeg = sanitizeKeyPart(itemSegRaw);
  if (!userSeg || !routeSeg || !itemSeg) {
    return null;
  }
  return path.join(RSS_FEED_LEGACY_ITEM_HTML_DIR, userSeg, routeSeg, `${itemSeg}.html`);
};

export const buildRssItemHtmlFileKey = (params: { userId: string; route: string; itemKey: string }) => {
  const userSeg = toUserSegment(params.userId);
  const routeSeg = toRouteSegment(params.route);
  const itemSeg = toItemSegment(params.itemKey);
  return `${userSeg}/${routeSeg}/${itemSeg}`;
};

export const buildRssSubscriptionStorageKey = (params: { userId: string; route: string }) => {
  return toSubscriptionSegment(toUserSegment(params.userId), toRouteSegment(params.route));
};

export const getRssSubscriptionDirPath = (params: { userId: string; route: string }) => {
  return toSubscriptionDirPath(params.userId, params.route);
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
  const filePath = toFilePathFromKey(key);
  if (!filePath) {
    return '';
  }
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  await fs.promises.writeFile(filePath, html, 'utf-8');
  return key;
};

export const readRssItemHtmlFileByKey = async (key: string) => {
  const filePath = toFilePathFromKey(key);
  if (filePath) {
    try {
      return await fs.promises.readFile(filePath, 'utf-8');
    } catch {
      // Try legacy path below.
    }
  }
  const legacyPath = toLegacyFilePathFromKey(key);
  if (!legacyPath) {
    return '';
  }
  try {
    return await fs.promises.readFile(legacyPath, 'utf-8');
  } catch {
    return '';
  }
};

export const clearRssItemHtmlFilesByRoute = async (params: { userId: string; route: string }) => {
  const userSeg = toUserSegment(params.userId);
  const routeSeg = toRouteSegment(params.route);
  const subscriptionSeg = toSubscriptionSegment(userSeg, routeSeg);
  await fs.promises
    .rm(path.join(RSS_FEED_ROOT_DIR, subscriptionSeg), { recursive: true, force: true })
    .catch(() => undefined);
  await fs.promises
    .rm(path.join(RSS_FEED_LEGACY_ITEM_HTML_DIR, userSeg, routeSeg), { recursive: true, force: true })
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
      const itemDirPath = toItemDirPath(key);
      if (!itemDirPath) {
        return;
      }
      await fs.promises.rm(itemDirPath, { recursive: true, force: true }).catch(() => undefined);
    })
  );
};

export const clearRssItemHtmlFilesByUser = async (userId: string) => {
  const userSeg = toUserSegment(userId);
  const entries = await fs.promises.readdir(RSS_FEED_ROOT_DIR).catch(() => []);
  const targets = entries.filter(item => item.startsWith(`${userSeg}-`));
  await Promise.all(
    targets.map(item =>
      fs.promises.rm(path.join(RSS_FEED_ROOT_DIR, item), { recursive: true, force: true }).catch(() => undefined)
    )
  );
  await fs.promises
    .rm(path.join(RSS_FEED_LEGACY_ITEM_HTML_DIR, userSeg), { recursive: true, force: true })
    .catch(() => undefined);
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

export const writeRssItemResourceFileByKey = async (params: { key: string; fileName: string; content: Buffer }) => {
  const itemDirPath = toItemDirPath(params.key);
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
  const filePath = path.join(RSS_FEED_ROOT_DIR, subscriptionKey, itemKey, fileName);
  const stat = await fs.promises.stat(filePath).catch(() => null);
  if (!stat?.isFile()) {
    return null;
  }
  return {
    filePath,
    fileName,
  };
};
