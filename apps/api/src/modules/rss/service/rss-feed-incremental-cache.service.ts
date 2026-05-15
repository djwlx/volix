import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PATH } from '../../../utils/path';
import type { RssFeedItem, RssFeedPayload } from '../types/rss.types';
import { buildRssItemStableKey, parseRssFeedItemsFromXml } from './rss-feed-item-parser.service';
interface RssFeedIncrementalState {
  feedUrl: string;
  contentType: string;
  fetchedAt: string;
  updatedAtMs: number;
  title: string;
  description: string;
  link: string;
  totalItems: number;
  sourceXmlHash: string;
}
interface StoredRssItemRecord {
  key: string;
  seenAt: string;
  updatedAtMs: number;
  item: RssFeedItem;
}
interface RssFeedLatestRecord {
  feedUrl: string;
  contentType: string;
  fetchedAt: string;
  xml: string;
  updatedAtMs: number;
}
interface KeyShardManifest {
  segments: number;
  lastSegmentCount: number;
}
export interface RssFeedIncrementalCacheMergeResult {
  inserted: number;
  updated: number;
  total: number;
}
const RSS_FEED_INCREMENTAL_CACHE_DIR = path.join(PATH.cache, 'rss-feed-incremental');
const KEY_SHARD_COUNT = 32;
const KEY_SEGMENT_SIZE = 5000;
const getFeedKey = (feedUrl: string) => {
  return crypto
    .createHash('sha256')
    .update(String(feedUrl || '').trim())
    .digest('hex');
};
export const getIncrementalCacheFolderPath = (feedUrl: string) => {
  return path.join(RSS_FEED_INCREMENTAL_CACHE_DIR, getFeedKey(feedUrl));
};
const getStateFilePath = (feedUrl: string) => path.join(getIncrementalCacheFolderPath(feedUrl), 'state.json');
const getLatestFilePath = (feedUrl: string) => path.join(getIncrementalCacheFolderPath(feedUrl), 'latest.json');
const getArticlesDirPath = (feedUrl: string) => path.join(getIncrementalCacheFolderPath(feedUrl), 'articles');
const getKeyIndexDirPath = (feedUrl: string) => path.join(getIncrementalCacheFolderPath(feedUrl), 'key-index');
const getKeyShardName = (key: string) => {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const shardIndex = Number.parseInt(hash.slice(0, 2), 16) % KEY_SHARD_COUNT;
  return `s${shardIndex.toString(16).padStart(2, '0')}`;
};
const getKeyShardDirPath = (feedUrl: string, shardName: string) => {
  return path.join(getKeyIndexDirPath(feedUrl), shardName);
};
const getKeyShardManifestPath = (feedUrl: string, shardName: string) => {
  return path.join(getKeyShardDirPath(feedUrl, shardName), 'manifest.json');
};
const getKeyShardSegmentPath = (feedUrl: string, shardName: string, segmentIndex: number) => {
  return path.join(getKeyShardDirPath(feedUrl, shardName), `${String(segmentIndex).padStart(4, '0')}.jsonl`);
};
const getArticleDayFilePath = (feedUrl: string, dateValue: Date) => {
  const yyyy = String(dateValue.getUTCFullYear());
  const mm = String(dateValue.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dateValue.getUTCDate()).padStart(2, '0');
  return path.join(getArticlesDirPath(feedUrl), yyyy, mm, `${dd}.jsonl`);
};
const safeDateFromIso = (value: string) => {
  const timestamp = Date.parse(String(value || ''));
  if (Number.isNaN(timestamp)) {
    return new Date();
  }
  return new Date(timestamp);
};
const safeJsonParse = <T>(value: string, fallback: T): T => {
  try {
    const parsed = JSON.parse(value) as T;
    return parsed;
  } catch {
    return fallback;
  }
};
const ensureDir = async (dirPath: string) => {
  await fs.promises.mkdir(dirPath, { recursive: true });
};
const readState = async (feedUrl: string): Promise<RssFeedIncrementalState | null> => {
  const filePath = getStateFilePath(feedUrl);
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = safeJsonParse<Partial<RssFeedIncrementalState>>(raw, {});
    const normalizedFeedUrl = String(parsed.feedUrl || '').trim();
    if (!normalizedFeedUrl) {
      return null;
    }
    return {
      feedUrl: normalizedFeedUrl,
      contentType: String(parsed.contentType || 'application/xml'),
      fetchedAt: String(parsed.fetchedAt || new Date(0).toISOString()),
      updatedAtMs: Number(parsed.updatedAtMs || 0),
      title: String(parsed.title || ''),
      description: String(parsed.description || ''),
      link: String(parsed.link || ''),
      totalItems: Math.max(0, Math.floor(Number(parsed.totalItems || 0))),
      sourceXmlHash: String(parsed.sourceXmlHash || ''),
    };
  } catch {
    return null;
  }
};
const writeState = async (feedUrl: string, state: RssFeedIncrementalState) => {
  await ensureDir(getIncrementalCacheFolderPath(feedUrl));
  await fs.promises.writeFile(getStateFilePath(feedUrl), JSON.stringify(state), 'utf-8');
};
const readLatest = async (feedUrl: string): Promise<RssFeedLatestRecord | null> => {
  const filePath = getLatestFilePath(feedUrl);
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = safeJsonParse<Partial<RssFeedLatestRecord>>(raw, {});
    const feed = String(parsed.feedUrl || '').trim();
    const xml = String(parsed.xml || '');
    if (!feed || !xml.trim()) {
      return null;
    }
    return {
      feedUrl: feed,
      contentType: String(parsed.contentType || 'application/xml'),
      fetchedAt: String(parsed.fetchedAt || new Date(0).toISOString()),
      xml,
      updatedAtMs: Number(parsed.updatedAtMs || 0),
    };
  } catch {
    return null;
  }
};
const writeLatest = async (record: RssFeedLatestRecord) => {
  await ensureDir(getIncrementalCacheFolderPath(record.feedUrl));
  await fs.promises.writeFile(getLatestFilePath(record.feedUrl), JSON.stringify(record), 'utf-8');
};
const readKeyShardManifest = async (feedUrl: string, shardName: string): Promise<KeyShardManifest> => {
  const filePath = getKeyShardManifestPath(feedUrl, shardName);
  try {
    const raw = await fs.promises.readFile(filePath, 'utf-8');
    const parsed = safeJsonParse<Partial<KeyShardManifest>>(raw, {});
    const segments = Math.max(1, Math.floor(Number(parsed.segments || 1)));
    const lastSegmentCount = Math.max(0, Math.floor(Number(parsed.lastSegmentCount || 0)));
    return { segments, lastSegmentCount };
  } catch {
    return {
      segments: 1,
      lastSegmentCount: 0,
    };
  }
};
const writeKeyShardManifest = async (feedUrl: string, shardName: string, manifest: KeyShardManifest) => {
  const shardDir = getKeyShardDirPath(feedUrl, shardName);
  await ensureDir(shardDir);
  const payload: KeyShardManifest = {
    segments: Math.max(1, Math.floor(manifest.segments || 1)),
    lastSegmentCount: Math.max(0, Math.floor(manifest.lastSegmentCount || 0)),
  };
  await fs.promises.writeFile(getKeyShardManifestPath(feedUrl, shardName), JSON.stringify(payload), 'utf-8');
};
const readKeyShardSet = async (feedUrl: string, shardName: string): Promise<Set<string>> => {
  const manifest = await readKeyShardManifest(feedUrl, shardName);
  const result = new Set<string>();
  for (let index = 0; index < manifest.segments; index += 1) {
    const filePath = getKeyShardSegmentPath(feedUrl, shardName, index);
    try {
      const raw = await fs.promises.readFile(filePath, 'utf-8');
      raw
        .split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .forEach(line => {
          result.add(line);
        });
    } catch {
      continue;
    }
  }
  return result;
};
const appendKeyShardValues = async (feedUrl: string, shardName: string, keys: string[]) => {
  if (keys.length === 0) {
    return;
  }
  const shardDir = getKeyShardDirPath(feedUrl, shardName);
  await ensureDir(shardDir);
  let manifest = await readKeyShardManifest(feedUrl, shardName);
  let currentSegmentIndex = manifest.segments - 1;
  let currentSegmentCount = manifest.lastSegmentCount;
  let currentSegmentPath = getKeyShardSegmentPath(feedUrl, shardName, currentSegmentIndex);
  const writes: Array<{ segmentPath: string; content: string }> = [];
  let buffer: string[] = [];
  const flushBuffer = () => {
    if (buffer.length === 0) {
      return;
    }
    writes.push({
      segmentPath: currentSegmentPath,
      content: `${buffer.join('\n')}\n`,
    });
    buffer = [];
  };
  for (const key of keys) {
    if (!key) {
      continue;
    }
    if (currentSegmentCount >= KEY_SEGMENT_SIZE) {
      flushBuffer();
      manifest = {
        segments: manifest.segments + 1,
        lastSegmentCount: 0,
      };
      currentSegmentIndex = manifest.segments - 1;
      currentSegmentCount = 0;
      currentSegmentPath = getKeyShardSegmentPath(feedUrl, shardName, currentSegmentIndex);
    }
    buffer.push(key);
    currentSegmentCount += 1;
    manifest.lastSegmentCount = currentSegmentCount;
  }
  flushBuffer();
  await Promise.all(writes.map(write => fs.promises.appendFile(write.segmentPath, write.content, 'utf-8')));
  await writeKeyShardManifest(feedUrl, shardName, manifest);
};
const appendArticleRecords = async (feedUrl: string, fetchedAt: string, records: StoredRssItemRecord[]) => {
  if (records.length === 0) {
    return;
  }
  const targetDate = safeDateFromIso(fetchedAt);
  const filePath = getArticleDayFilePath(feedUrl, targetDate);
  await ensureDir(path.dirname(filePath));
  const content = `${records.map(item => JSON.stringify(item)).join('\n')}\n`;
  await fs.promises.appendFile(filePath, content, 'utf-8');
};
const walkArticleFiles = async (rootDir: string): Promise<string[]> => {
  const files: string[] = [];
  const walk = async (targetDir: string) => {
    let entries: fs.Dirent[];
    try {
      entries = await fs.promises.readdir(targetDir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const absPath = path.join(targetDir, entry.name);
      if (entry.isDirectory()) {
        await walk(absPath);
        continue;
      }
      if (!entry.isFile() || !entry.name.endsWith('.jsonl')) {
        continue;
      }
      files.push(absPath);
    }
  };
  await walk(rootDir);
  return files.sort((a, b) => b.localeCompare(a));
};
const parseStoredItemLine = (line: string): StoredRssItemRecord | null => {
  const parsed = safeJsonParse<Partial<StoredRssItemRecord>>(line, {});
  const key = String(parsed.key || '').trim();
  if (!key) {
    return null;
  }
  const item = parsed.item as Partial<RssFeedItem> | undefined;
  if (!item || typeof item !== 'object') {
    return null;
  }
  return {
    key,
    seenAt: String(parsed.seenAt || new Date(0).toISOString()),
    updatedAtMs: Number(parsed.updatedAtMs || 0),
    item: {
      id: String(item.id || ''),
      title: String(item.title || ''),
      link: String(item.link || ''),
      description: String(item.description || ''),
      descriptionHtml: String(item.descriptionHtml || ''),
      imageUrls: Array.isArray(item.imageUrls)
        ? item.imageUrls.map(url => String(url || '').trim()).filter(Boolean)
        : [],
      author: String(item.author || ''),
      publishedAt: String(item.publishedAt || ''),
    },
  };
};
const getItemTimestamp = (item: RssFeedItem, seenAt: string) => {
  const primary = Date.parse(String(item.publishedAt || ''));
  if (!Number.isNaN(primary)) {
    return primary;
  }
  const fallback = Date.parse(String(seenAt || ''));
  if (!Number.isNaN(fallback)) {
    return fallback;
  }
  return 0;
};
const readCachedItems = async (feedUrl: string): Promise<RssFeedItem[]> => {
  const articleFiles = await walkArticleFiles(getArticlesDirPath(feedUrl));
  if (articleFiles.length === 0) {
    return [];
  }
  const keyMap = new Map<string, { item: RssFeedItem; seenAt: string }>();
  for (const filePath of articleFiles) {
    let raw = '';
    try {
      raw = await fs.promises.readFile(filePath, 'utf-8');
    } catch {
      continue;
    }
    const lines = raw
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index];
      const record = parseStoredItemLine(line);
      if (!record) {
        continue;
      }
      if (!keyMap.has(record.key)) {
        keyMap.set(record.key, {
          item: record.item,
          seenAt: record.seenAt,
        });
      }
    }
  }
  return Array.from(keyMap.values())
    .sort((a, b) => getItemTimestamp(b.item, b.seenAt) - getItemTimestamp(a.item, a.seenAt))
    .map(entry => entry.item);
};
const getSourceXmlHash = (xml: string) => {
  return crypto
    .createHash('sha256')
    .update(String(xml || ''))
    .digest('hex');
};
const loadExistingKeySets = async (feedUrl: string, shardNames: string[]) => {
  const uniqueShardNames = Array.from(new Set(shardNames));
  const map = new Map<string, Set<string>>();
  await Promise.all(
    uniqueShardNames.map(async shardName => {
      const keySet = await readKeyShardSet(feedUrl, shardName);
      map.set(shardName, keySet);
    })
  );
  return map;
};
export const mergeRssFeedIncrementalCache = async (
  payload: RssFeedPayload
): Promise<RssFeedIncrementalCacheMergeResult> => {
  const feedUrl = String(payload.feedUrl || '').trim();
  if (!feedUrl) {
    return {
      inserted: 0,
      updated: 0,
      total: 0,
    };
  }
  const parsed = parseRssFeedItemsFromXml(payload.xml);
  const records = parsed.items.map(item => {
    return {
      key: buildRssItemStableKey(item),
      seenAt: String(payload.fetchedAt || new Date().toISOString()),
      updatedAtMs: Date.now(),
      item,
    } as StoredRssItemRecord;
  });
  const shardNames = records.map(record => getKeyShardName(record.key));
  const shardKeySetMap = await loadExistingKeySets(feedUrl, shardNames);
  let inserted = 0;
  let updated = 0;
  const newKeysByShard = new Map<string, string[]>();
  records.forEach(record => {
    const shardName = getKeyShardName(record.key);
    const keySet = shardKeySetMap.get(shardName) || new Set<string>();
    if (keySet.has(record.key)) {
      updated += 1;
      return;
    }
    inserted += 1;
    keySet.add(record.key);
    shardKeySetMap.set(shardName, keySet);
    const current = newKeysByShard.get(shardName) || [];
    current.push(record.key);
    newKeysByShard.set(shardName, current);
  });
  await appendArticleRecords(feedUrl, payload.fetchedAt, records);
  await Promise.all(
    Array.from(newKeysByShard.entries()).map(([shardName, keys]) => {
      return appendKeyShardValues(feedUrl, shardName, keys);
    })
  );
  const sourceXmlHash = getSourceXmlHash(payload.xml);
  const currentState = await readState(feedUrl);
  const total = Math.max(0, Number(currentState?.totalItems || 0)) + inserted;
  await writeState(feedUrl, {
    feedUrl,
    contentType: String(payload.contentType || 'application/xml'),
    fetchedAt: String(payload.fetchedAt || new Date().toISOString()),
    updatedAtMs: Date.now(),
    title: parsed.title,
    description: parsed.description,
    link: parsed.link,
    totalItems: total,
    sourceXmlHash,
  });
  await writeLatest({
    feedUrl,
    contentType: String(payload.contentType || 'application/xml'),
    fetchedAt: String(payload.fetchedAt || new Date().toISOString()),
    xml: String(payload.xml || ''),
    updatedAtMs: Date.now(),
  });
  return {
    inserted,
    updated,
    total,
  };
};
export const readRssFeedIncrementalCache = async (feedUrl: string): Promise<RssFeedPayload | null> => {
  const normalizedFeedUrl = String(feedUrl || '').trim();
  if (!normalizedFeedUrl) {
    return null;
  }
  const [state, latest, items] = await Promise.all([
    readState(normalizedFeedUrl),
    readLatest(normalizedFeedUrl),
    readCachedItems(normalizedFeedUrl),
  ]);
  if (!state && !latest) {
    return null;
  }
  return {
    feedUrl: normalizedFeedUrl,
    contentType: String(state?.contentType || latest?.contentType || 'application/xml'),
    xml: String(latest?.xml || ''),
    fetchedAt: String(state?.fetchedAt || latest?.fetchedAt || new Date(0).toISOString()),
    title: String(state?.title || ''),
    description: String(state?.description || ''),
    link: String(state?.link || ''),
    items,
  };
};
