import crypto from 'crypto';
import fs from 'fs';
import mime from 'mime-types';
import path from 'path';
import { getUserRssFeedDir } from '../../../utils/path';
import { registerOrGetFileByPath, removeFilesByPathPrefix } from '../../file/service/file-registry.service';
import { fetchRemoteResource, normalizeHttpUrl } from '../../shared/service/remote-resource-fetch.service';
import {
  buildRssSubscriptionStorageKey,
  getRssDirKey,
  getRssFeedRootDirByUserId,
  toRssItemSegment,
} from './rss-storage-path.service';

const RESOURCES_DIR_NAME = 'resources';
const MAX_FILE_NAME_LENGTH = 100;

const DIR_KEY_REGEX = /^[a-z0-9_-]+$/;
const SUBSCRIPTION_KEY_REGEX = /^[a-f0-9]{16}-[a-f0-9]{16}$/;
const ITEM_SEG_REGEX = /^[a-f0-9]{64}$/;
const RESOURCE_EXT_REGEX = /^[a-z0-9]{1,8}$/;
const FILE_NAME_REGEX = /^[A-Za-z0-9_][A-Za-z0-9._-]*$/;

const digest = (value: string) => crypto.createHash('sha256').update(value).digest('hex');

const toResourceHash = (normalizedUrl: string) => digest(normalizedUrl).slice(0, 40);

const sanitizeExt = (value: string) => {
  const normalized = String(value || '')
    .replace(/^\./, '')
    .trim()
    .toLowerCase();
  return RESOURCE_EXT_REGEX.test(normalized) ? normalized : '';
};

const resolveResourceExt = (sourceUrl: string, contentType: string) => {
  const fromUrl = sanitizeExt(path.extname(new URL(sourceUrl).pathname || ''));
  if (fromUrl) {
    return fromUrl;
  }
  return sanitizeExt(mime.extension(contentType) || '') || 'bin';
};

const sanitizeFileName = (value: string) => {
  return path
    .basename(String(value || ''))
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/^\.+/, '')
    .slice(0, MAX_FILE_NAME_LENGTH);
};

const buildStoredFileName = (sourceUrl: string, contentType: string) => {
  const base = sanitizeFileName(path.basename(new URL(sourceUrl).pathname || ''));
  if (base) {
    return path.extname(base) ? base : `${base}.${resolveResourceExt(sourceUrl, contentType)}`;
  }
  return `${toResourceHash(sourceUrl)}.${resolveResourceExt(sourceUrl, contentType)}`;
};

const getItemResourcesDir = (params: { userId: string; route: string; itemKey: string }) => {
  return path.join(
    getRssFeedRootDirByUserId(params.userId),
    buildRssSubscriptionStorageKey({ userId: params.userId, route: params.route }),
    toRssItemSegment(params.itemKey),
    RESOURCES_DIR_NAME
  );
};

const fileExists = async (filePath: string) => {
  const stat = await fs.promises.stat(filePath).catch(() => null);
  return Boolean(stat?.isFile());
};

export const downloadRssItemResource = async (params: {
  userId: string;
  route: string;
  itemKey: string;
  sourceUrl: string;
  requestProxyUrl?: string;
  requestTimeoutMs?: number;
}) => {
  const normalizedUrl = normalizeHttpUrl(params.sourceUrl);
  if (!normalizedUrl) {
    return { ok: false, url: params.sourceUrl } as const;
  }

  const resourcesDir = getItemResourcesDir(params);
  const dirKey = getRssDirKey(params.userId);

  const registerResource = async (fileName: string) => {
    const { url } = await registerOrGetFileByPath({
      userId: params.userId,
      absolutePath: path.join(resourcesDir, fileName),
      originalName: fileName,
      dirKey,
      module: 'rss',
      metadata: { route: params.route, itemKey: params.itemKey, sourceUrl: normalizedUrl },
    });
    return url;
  };

  const urlBaseName = sanitizeFileName(path.basename(new URL(normalizedUrl).pathname || ''));
  if (urlBaseName && path.extname(urlBaseName) && (await fileExists(path.join(resourcesDir, urlBaseName)))) {
    return { ok: true, url: await registerResource(urlBaseName) } as const;
  }

  const fetched = await fetchRemoteResource({
    sourceUrl: normalizedUrl,
    requestProxyUrl: params.requestProxyUrl,
    requestTimeoutMs: params.requestTimeoutMs,
    silentOnError: true,
  });

  const fileName = buildStoredFileName(normalizedUrl, fetched.contentType);
  await fs.promises.mkdir(resourcesDir, { recursive: true });
  await fs.promises.writeFile(path.join(resourcesDir, fileName), fetched.buffer);

  return { ok: true, url: await registerResource(fileName) } as const;
};

export const readRssItemResourceFileByLocator = async (params: {
  dirKey: string;
  subscriptionKey: string;
  itemSeg: string;
  resourceId: string;
}) => {
  const dirKey = String(params.dirKey || '')
    .trim()
    .toLowerCase();
  const subscriptionKey = String(params.subscriptionKey || '')
    .trim()
    .toLowerCase();
  const itemSeg = String(params.itemSeg || '')
    .trim()
    .toLowerCase();
  const fileName = String(params.resourceId || '').trim();

  if (
    !DIR_KEY_REGEX.test(dirKey) ||
    !SUBSCRIPTION_KEY_REGEX.test(subscriptionKey) ||
    !ITEM_SEG_REGEX.test(itemSeg) ||
    !FILE_NAME_REGEX.test(fileName) ||
    fileName.includes('..')
  ) {
    return null;
  }

  let feedRoot = '';
  try {
    feedRoot = getUserRssFeedDir(dirKey);
  } catch {
    return null;
  }

  const filePath = path.join(feedRoot, subscriptionKey, itemSeg, RESOURCES_DIR_NAME, fileName);
  if (!(await fileExists(filePath))) {
    return null;
  }

  return {
    filePath,
    contentType: mime.lookup(fileName) || 'application/octet-stream',
    fileName,
  };
};

export const clearRssItemResourcesInFeedDir = async (feedRootDir: string) => {
  await removeFilesByPathPrefix(feedRootDir);
  const subscriptions = await fs.promises.readdir(feedRootDir, { withFileTypes: true }).catch(() => [] as fs.Dirent[]);
  await Promise.all(
    subscriptions
      .filter(entry => entry.isDirectory())
      .map(async subscription => {
        const subscriptionDir = path.join(feedRootDir, subscription.name);
        const items = await fs.promises
          .readdir(subscriptionDir, { withFileTypes: true })
          .catch(() => [] as fs.Dirent[]);
        await Promise.all(
          items
            .filter(entry => entry.isDirectory())
            .map(item =>
              fs.promises
                .rm(path.join(subscriptionDir, item.name, RESOURCES_DIR_NAME), { recursive: true, force: true })
                .catch(() => undefined)
            )
        );
      })
  );
};
