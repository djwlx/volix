import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { getRssFeedResponseCacheDirByUserId } from './rss-storage-path.service';

export type CachedRssFeedRecord = {
  feedUrl: string;
  contentType: string;
  xml: string;
  fetchedAt: string;
  updatedAtMs: number;
};

const ensureCacheDir = async (userId: string) => {
  await fs.promises.mkdir(getRssFeedResponseCacheDirByUserId(userId), { recursive: true });
};

const getCacheKey = (feedUrl: string) => {
  return crypto
    .createHash('sha256')
    .update(String(feedUrl || '').trim())
    .digest('hex');
};

const getCacheFilePath = (userId: string, feedUrl: string) => {
  return path.join(getRssFeedResponseCacheDirByUserId(userId), `${getCacheKey(feedUrl)}.json`);
};

export const readCachedRssFeed = async (params: {
  userId: string;
  feedUrl: string;
}): Promise<CachedRssFeedRecord | null> => {
  const normalizedFeedUrl = String(params.feedUrl || '').trim();
  if (!normalizedFeedUrl) {
    return null;
  }

  const filePath = getCacheFilePath(params.userId, normalizedFeedUrl);
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CachedRssFeedRecord>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const xml = String(parsed.xml || '');
    if (!xml.trim()) {
      return null;
    }

    return {
      feedUrl: normalizedFeedUrl,
      contentType: String(parsed.contentType || 'application/xml'),
      xml,
      fetchedAt: String(parsed.fetchedAt || new Date(0).toISOString()),
      updatedAtMs: Number(parsed.updatedAtMs || 0),
    };
  } catch {
    return null;
  }
};

export const writeCachedRssFeed = async (params: {
  userId: string;
  record: Omit<CachedRssFeedRecord, 'updatedAtMs'>;
}) => {
  const feedUrl = String(params.record.feedUrl || '').trim();
  if (!feedUrl) {
    return;
  }

  await ensureCacheDir(params.userId);

  const payload: CachedRssFeedRecord = {
    feedUrl,
    contentType: String(params.record.contentType || 'application/xml'),
    xml: String(params.record.xml || ''),
    fetchedAt: String(params.record.fetchedAt || new Date().toISOString()),
    updatedAtMs: Date.now(),
  };

  const filePath = getCacheFilePath(params.userId, feedUrl);
  await fs.promises.writeFile(filePath, JSON.stringify(payload), 'utf-8');
};

export const getRssFeedCacheAgeMs = (record: CachedRssFeedRecord | null, nowMs = Date.now()) => {
  if (!record) {
    return Number.POSITIVE_INFINITY;
  }

  const updatedAtMs = Number(record.updatedAtMs || 0);
  if (!Number.isFinite(updatedAtMs) || updatedAtMs <= 0) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.max(0, nowMs - updatedAtMs);
};
