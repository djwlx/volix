import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PATH } from '../../../utils/path';

export type CachedRssFeedRecord = {
  feedUrl: string;
  contentType: string;
  xml: string;
  fetchedAt: string;
  updatedAtMs: number;
};

const RSS_FEED_CACHE_DIR = path.join(PATH.cache, 'rss-feed-response');

const ensureCacheDir = async () => {
  await fs.promises.mkdir(RSS_FEED_CACHE_DIR, { recursive: true });
};

const getCacheKey = (feedUrl: string) => {
  return crypto
    .createHash('sha256')
    .update(String(feedUrl || '').trim())
    .digest('hex');
};

const getCacheFilePath = (feedUrl: string) => {
  return path.join(RSS_FEED_CACHE_DIR, `${getCacheKey(feedUrl)}.json`);
};

export const readCachedRssFeed = async (feedUrl: string): Promise<CachedRssFeedRecord | null> => {
  const normalizedFeedUrl = String(feedUrl || '').trim();
  if (!normalizedFeedUrl) {
    return null;
  }

  const filePath = getCacheFilePath(normalizedFeedUrl);
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

export const writeCachedRssFeed = async (record: Omit<CachedRssFeedRecord, 'updatedAtMs'>) => {
  const feedUrl = String(record.feedUrl || '').trim();
  if (!feedUrl) {
    return;
  }

  await ensureCacheDir();

  const payload: CachedRssFeedRecord = {
    feedUrl,
    contentType: String(record.contentType || 'application/xml'),
    xml: String(record.xml || ''),
    fetchedAt: String(record.fetchedAt || new Date().toISOString()),
    updatedAtMs: Date.now(),
  };

  const filePath = getCacheFilePath(feedUrl);
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
