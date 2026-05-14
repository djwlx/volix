import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PATH } from '../../../utils/path';
import type { RssFeedPayload } from '../types/rss.types';

const RSS_FEED_ARCHIVE_DIR = path.join(PATH.cache, 'rss-feed-archive');
const RSS_FEED_ARCHIVE_MAX_SNAPSHOTS = 40;

export interface RssFeedArchiveSnapshot {
  contentType: string;
  xml: string;
  fetchedAt: string;
  updatedAtMs: number;
  hash: string;
}

interface RssFeedArchiveRecord {
  feedUrl: string;
  snapshots: RssFeedArchiveSnapshot[];
  updatedAtMs: number;
}

const ensureArchiveDir = async () => {
  await fs.promises.mkdir(RSS_FEED_ARCHIVE_DIR, { recursive: true });
};

const getFeedKey = (feedUrl: string) => {
  return crypto
    .createHash('sha256')
    .update(String(feedUrl || '').trim())
    .digest('hex');
};

const getArchiveFilePath = (feedUrl: string) => {
  return path.join(RSS_FEED_ARCHIVE_DIR, `${getFeedKey(feedUrl)}.json`);
};

const normalizeSnapshot = (payload: RssFeedPayload): RssFeedArchiveSnapshot | null => {
  const xml = String(payload.xml || '');
  if (!xml.trim()) {
    return null;
  }

  const contentType = String(payload.contentType || 'application/xml');
  const fetchedAt = String(payload.fetchedAt || new Date().toISOString());
  const hash = crypto.createHash('sha256').update(xml).digest('hex');

  return {
    contentType,
    xml,
    fetchedAt,
    updatedAtMs: Date.now(),
    hash,
  };
};

const readArchiveRecord = async (feedUrl: string): Promise<RssFeedArchiveRecord | null> => {
  const normalizedFeedUrl = String(feedUrl || '').trim();
  if (!normalizedFeedUrl) {
    return null;
  }

  const filePath = getArchiveFilePath(normalizedFeedUrl);
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<RssFeedArchiveRecord>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    const snapshots = Array.isArray(parsed.snapshots)
      ? parsed.snapshots
          .map(item => {
            const xml = String(item?.xml || '');
            if (!xml.trim()) {
              return null;
            }
            return {
              contentType: String(item?.contentType || 'application/xml'),
              xml,
              fetchedAt: String(item?.fetchedAt || new Date(0).toISOString()),
              updatedAtMs: Number(item?.updatedAtMs || 0),
              hash: String(item?.hash || crypto.createHash('sha256').update(xml).digest('hex')),
            };
          })
          .filter(Boolean)
      : [];

    return {
      feedUrl: normalizedFeedUrl,
      snapshots: snapshots as RssFeedArchiveSnapshot[],
      updatedAtMs: Number(parsed.updatedAtMs || 0),
    };
  } catch {
    return null;
  }
};

const writeArchiveRecord = async (record: RssFeedArchiveRecord) => {
  await ensureArchiveDir();
  const filePath = getArchiveFilePath(record.feedUrl);
  await fs.promises.writeFile(filePath, JSON.stringify(record), 'utf-8');
};

export const appendRssFeedArchiveSnapshot = async (payload: RssFeedPayload) => {
  const feedUrl = String(payload.feedUrl || '').trim();
  if (!feedUrl) {
    return;
  }

  const snapshot = normalizeSnapshot(payload);
  if (!snapshot) {
    return;
  }

  const current = (await readArchiveRecord(feedUrl)) || {
    feedUrl,
    snapshots: [],
    updatedAtMs: 0,
  };

  if (current.snapshots[0]?.hash === snapshot.hash) {
    return;
  }

  const filtered = current.snapshots.filter(item => item.hash !== snapshot.hash);
  filtered.unshift(snapshot);

  current.snapshots = filtered.slice(0, RSS_FEED_ARCHIVE_MAX_SNAPSHOTS);
  current.updatedAtMs = Date.now();
  await writeArchiveRecord(current);
};

export const getRssFeedArchiveSnapshotPage = async (params: {
  feedUrl: string;
  offset: number;
  limit: number;
}): Promise<RssFeedPayload[]> => {
  const normalizedFeedUrl = String(params.feedUrl || '').trim();
  if (!normalizedFeedUrl) {
    return [];
  }

  const offset = Math.max(0, Math.floor(Number(params.offset || 0)));
  const limit = Math.max(1, Math.floor(Number(params.limit || 1)));
  const current = await readArchiveRecord(normalizedFeedUrl);
  if (!current || current.snapshots.length === 0) {
    return [];
  }

  return current.snapshots.slice(offset, offset + limit).map(item => ({
    feedUrl: normalizedFeedUrl,
    contentType: item.contentType,
    xml: item.xml,
    fetchedAt: item.fetchedAt,
  }));
};

export const getRssFeedArchiveSnapshotCount = async (feedUrl: string): Promise<number> => {
  const current = await readArchiveRecord(feedUrl);
  return current?.snapshots.length || 0;
};
