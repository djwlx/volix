import fs from 'fs';
import path from 'path';
import { getRssSubscriptionDirPath } from './rss-feed-item-html-file.service';

export interface RssFeedSubscriptionMeta {
  lastUpdatedAt: string;
  lastFetchedAt: string;
  lastNewCount: number;
}

const META_FILE_NAME = '.subscription-meta.json';

const normalizeText = (value: string) => String(value || '').trim();

const toMetaFilePath = (params: { userId: string; route: string }) => {
  return path.join(getRssSubscriptionDirPath(params), META_FILE_NAME);
};

const normalizeDate = (value: string) => {
  const text = normalizeText(value);
  if (!text) {
    return '';
  }
  const timestamp = Date.parse(text);
  if (Number.isNaN(timestamp)) {
    return '';
  }
  return new Date(timestamp).toISOString();
};

const normalizeCount = (value: unknown) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.floor(numeric));
};

export const writeRssFeedSubscriptionMeta = async (
  params: { userId: string; route: string },
  meta: RssFeedSubscriptionMeta
) => {
  const filePath = toMetaFilePath(params);
  await fs.promises.mkdir(path.dirname(filePath), { recursive: true });
  const payload: RssFeedSubscriptionMeta = {
    lastUpdatedAt: normalizeDate(meta.lastUpdatedAt),
    lastFetchedAt: normalizeDate(meta.lastFetchedAt),
    lastNewCount: normalizeCount(meta.lastNewCount),
  };
  await fs.promises.writeFile(filePath, JSON.stringify(payload), 'utf-8');
};

export const readRssFeedSubscriptionMeta = async (params: {
  userId: string;
  route: string;
}): Promise<RssFeedSubscriptionMeta | null> => {
  try {
    const raw = await fs.promises.readFile(toMetaFilePath(params), 'utf-8');
    const parsed = JSON.parse(raw) as Partial<RssFeedSubscriptionMeta>;
    const lastUpdatedAt = normalizeDate(String(parsed.lastUpdatedAt || ''));
    const lastFetchedAt = normalizeDate(String(parsed.lastFetchedAt || ''));
    const lastNewCount = normalizeCount(parsed.lastNewCount);
    if (!lastUpdatedAt) {
      return null;
    }
    return {
      lastUpdatedAt,
      lastFetchedAt,
      lastNewCount,
    };
  } catch {
    return null;
  }
};
