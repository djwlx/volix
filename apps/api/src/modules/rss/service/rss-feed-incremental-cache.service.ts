import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import type { RssFeedItem, RssFeedPayload } from '../types/rss.types';
import { buildRssItemStableKey, parseRssFeedItemsFromXml } from './rss-feed-item-parser.service';
import { getRssFeedIncrementalCacheDirByUserId } from './rss-storage-path.service';
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
const KEY_SHARD_COUNT = 32;
const KEY_SEGMENT_SIZE = 5000;
const getFeedKey = (feedUrl: string) => {
  return crypto
    .createHash('sha256')
    .update(String(feedUrl || '').trim())
    .digest('hex');
};
export const getIncrementalCacheFolderPath = (userId: string, feedUrl: string) => {
  return path.join(getRssFeedIncrementalCacheDirByUserId(userId), getFeedKey(feedUrl));
};
const getStateFilePath = (userId: string, feedUrl: string) =>
  path.join(getIncrementalCacheFolderPath(userId, feedUrl), 'state.json');
const getLatestFilePath = (userId: string, feedUrl: string) =>
  path.join(getIncrementalCacheFolderPath(userId, feedUrl), 'latest.json');
const getArticlesDirPath = (userId: string, feedUrl: string) =>
  path.join(getIncrementalCacheFolderPath(userId, feedUrl), 'articles');
const getKeyIndexDirPath = (userId: string, feedUrl: string) =>
  path.join(getIncrementalCacheFolderPath(userId, feedUrl), 'key-index');
const getKeyShardName = (key: string) => {
  const hash = crypto.createHash('sha256').update(key).digest('hex');
  const shardIndex = Number.parseInt(hash.slice(0, 2), 16) % KEY_SHARD_COUNT;
  return `s${shardIndex.toString(16).padStart(2, '0')}`;
};
const getKeyShardDirPath = (userId: string, feedUrl: string, shardName: string) => {
  return path.join(getKeyIndexDirPath(userId, feedUrl), shardName);
};
const getKeyShardManifestPath = (userId: string, feedUrl: string, shardName: string) => {
  return path.join(getKeyShardDirPath(userId, feedUrl, shardName), 'manifest.json');
};
const getKeyShardSegmentPath = (userId: string, feedUrl: string, shardName: string, segmentIndex: number) => {
  return path.join(getKeyShardDirPath(userId, feedUrl, shardName), `${String(segmentIndex).padStart(4, '0')}.jsonl`);
};
const getArticleDayFilePath = (userId: string, feedUrl: string, dateValue: Date) => {
  const yyyy = String(dateValue.getUTCFullYear());
  const mm = String(dateValue.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(dateValue.getUTCDate()).padStart(2, '0');
  return path.join(getArticlesDirPath(userId, feedUrl), yyyy, mm, `${dd}.jsonl`);
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
const readState = async (userId: string, feedUrl: string): Promise<RssFeedIncrementalState | null> => {
  const filePath = getStateFilePath(userId, feedUrl);
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
const writeState = async (userId: string, feedUrl: string, state: RssFeedIncrementalState) => {
  await ensureDir(getIncrementalCacheFolderPath(userId, feedUrl));
  await fs.promises.writeFile(getStateFilePath(userId, feedUrl), JSON.stringify(state), 'utf-8');
};
const readLatest = async (userId: string, feedUrl: string): Promise<RssFeedLatestRecord | null> => {
  const filePath = getLatestFilePath(userId, feedUrl);
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
const writeLatest = async (userId: string, record: RssFeedLatestRecord) => {
  await ensureDir(getIncrementalCacheFolderPath(userId, record.feedUrl));
  await fs.promises.writeFile(getLatestFilePath(userId, record.feedUrl), JSON.stringify(record), 'utf-8');
};
const readKeyShardManifest = async (userId: string, feedUrl: string, shardName: string): Promise<KeyShardManifest> => {
  const filePath = getKeyShardManifestPath(userId, feedUrl, shardName);
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
const writeKeyShardManifest = async (
  userId: string,
  feedUrl: string,
  shardName: string,
  manifest: KeyShardManifest
) => {
  const shardDir = getKeyShardDirPath(userId, feedUrl, shardName);
  await ensureDir(shardDir);
  const payload: KeyShardManifest = {
    segments: Math.max(1, Math.floor(manifest.segments || 1)),
    lastSegmentCount: Math.max(0, Math.floor(manifest.lastSegmentCount || 0)),
  };
  await fs.promises.writeFile(getKeyShardManifestPath(userId, feedUrl, shardName), JSON.stringify(payload), 'utf-8');
};
const readKeyShardSet = async (userId: string, feedUrl: string, shardName: string): Promise<Set<string>> => {
  const manifest = await readKeyShardManifest(userId, feedUrl, shardName);
  const result = new Set<string>();
  for (let index = 0; index < manifest.segments; index += 1) {
    const filePath = getKeyShardSegmentPath(userId, feedUrl, shardName, index);
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
const appendKeyShardValues = async (userId: string, feedUrl: string, shardName: string, keys: string[]) => {
  if (keys.length === 0) {
    return;
  }
  const shardDir = getKeyShardDirPath(userId, feedUrl, shardName);
  await ensureDir(shardDir);
  let manifest = await readKeyShardManifest(userId, feedUrl, shardName);
  let currentSegmentIndex = manifest.segments - 1;
  let currentSegmentCount = manifest.lastSegmentCount;
  let currentSegmentPath = getKeyShardSegmentPath(userId, feedUrl, shardName, currentSegmentIndex);
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
      currentSegmentPath = getKeyShardSegmentPath(userId, feedUrl, shardName, currentSegmentIndex);
    }
    buffer.push(key);
    currentSegmentCount += 1;
    manifest.lastSegmentCount = currentSegmentCount;
  }
  flushBuffer();
  await Promise.all(writes.map(write => fs.promises.appendFile(write.segmentPath, write.content, 'utf-8')));
  await writeKeyShardManifest(userId, feedUrl, shardName, manifest);
};
const appendArticleRecords = async (
  userId: string,
  feedUrl: string,
  fetchedAt: string,
  records: StoredRssItemRecord[]
) => {
  if (records.length === 0) {
    return;
  }
  const targetDate = safeDateFromIso(fetchedAt);
  const filePath = getArticleDayFilePath(userId, feedUrl, targetDate);
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
const readCachedItems = async (userId: string, feedUrl: string): Promise<RssFeedItem[]> => {
  const articleFiles = await walkArticleFiles(getArticlesDirPath(userId, feedUrl));
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
const loadExistingKeySets = async (userId: string, feedUrl: string, shardNames: string[]) => {
  const uniqueShardNames = Array.from(new Set(shardNames));
  const map = new Map<string, Set<string>>();
  await Promise.all(
    uniqueShardNames.map(async shardName => {
      const keySet = await readKeyShardSet(userId, feedUrl, shardName);
      map.set(shardName, keySet);
    })
  );
  return map;
};
export const mergeRssFeedIncrementalCache = async (params: {
  userId: string;
  payload: RssFeedPayload;
}): Promise<RssFeedIncrementalCacheMergeResult> => {
  const feedUrl = String(params.payload.feedUrl || '').trim();
  if (!feedUrl) {
    return {
      inserted: 0,
      updated: 0,
      total: 0,
    };
  }
  const parsed = parseRssFeedItemsFromXml(params.payload.xml);
  const records = parsed.items.map(item => {
    return {
      key: buildRssItemStableKey(item),
      seenAt: String(params.payload.fetchedAt || new Date().toISOString()),
      updatedAtMs: Date.now(),
      item,
    } as StoredRssItemRecord;
  });
  const shardNames = records.map(record => getKeyShardName(record.key));
  const shardKeySetMap = await loadExistingKeySets(params.userId, feedUrl, shardNames);
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
  await appendArticleRecords(params.userId, feedUrl, params.payload.fetchedAt, records);
  await Promise.all(
    Array.from(newKeysByShard.entries()).map(([shardName, keys]) => {
      return appendKeyShardValues(params.userId, feedUrl, shardName, keys);
    })
  );
  const sourceXmlHash = getSourceXmlHash(params.payload.xml);
  const currentState = await readState(params.userId, feedUrl);
  const total = Math.max(0, Number(currentState?.totalItems || 0)) + inserted;
  await writeState(params.userId, feedUrl, {
    feedUrl,
    contentType: String(params.payload.contentType || 'application/xml'),
    fetchedAt: String(params.payload.fetchedAt || new Date().toISOString()),
    updatedAtMs: Date.now(),
    title: parsed.title,
    description: parsed.description,
    link: parsed.link,
    totalItems: total,
    sourceXmlHash,
  });
  await writeLatest(params.userId, {
    feedUrl,
    contentType: String(params.payload.contentType || 'application/xml'),
    fetchedAt: String(params.payload.fetchedAt || new Date().toISOString()),
    xml: String(params.payload.xml || ''),
    updatedAtMs: Date.now(),
  });
  return {
    inserted,
    updated,
    total,
  };
};
export const readRssFeedIncrementalCache = async (params: {
  userId: string;
  feedUrl: string;
}): Promise<RssFeedPayload | null> => {
  const normalizedFeedUrl = String(params.feedUrl || '').trim();
  if (!normalizedFeedUrl) {
    return null;
  }
  const [state, latest, items] = await Promise.all([
    readState(params.userId, normalizedFeedUrl),
    readLatest(params.userId, normalizedFeedUrl),
    readCachedItems(params.userId, normalizedFeedUrl),
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
