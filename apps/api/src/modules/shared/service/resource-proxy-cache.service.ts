import crypto from 'crypto';
import fs from 'fs';
import mime from 'mime-types';
import path from 'path';
import request from '../../../utils/request';
import { PATH } from '../../../utils/path';

export type ResourceProxyScope = 'rss';

const SCOPE_DIR_MAP: Record<ResourceProxyScope, string> = {
  rss: 'rss-resource-proxy',
};

const SCOPE_PATH_MAP: Record<ResourceProxyScope, string> = {
  rss: '/api/rss/resource-cache',
};

const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;
const MIN_CACHE_SIZE_MB = 50;
const MAX_CACHE_SIZE_MB = 102400;

export type ResourceProxyCacheRecord = {
  cacheKey: string;
  sourceUrl: string;
  fileName: string;
  dataFileName?: string;
  contentType: string;
  sizeBytes: number;
  updatedAtMs: number;
};

const normalizeCacheKey = (value: string) => {
  const normalized = String(value || '')
    .trim()
    .toLowerCase();
  return /^[a-f0-9]{64}$/.test(normalized) ? normalized : '';
};

const normalizeHttpUrl = (value: string) => {
  const raw = String(value || '').trim();
  if (!raw) {
    return '';
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

const normalizeProxyRequestUrl = (value: string) => {
  return normalizeHttpUrl(value);
};

const clampCacheSizeMb = (value: number) => {
  const raw = Number(value || 0);
  if (!Number.isFinite(raw) || raw <= 0) {
    return MIN_CACHE_SIZE_MB;
  }
  return Math.min(MAX_CACHE_SIZE_MB, Math.max(MIN_CACHE_SIZE_MB, Math.round(raw)));
};

const getScopeDir = (scope: ResourceProxyScope) => {
  return path.join(PATH.cache, SCOPE_DIR_MAP[scope]);
};

const getLegacyDataPath = (scope: ResourceProxyScope, cacheKey: string) => {
  return path.join(getScopeDir(scope), `${cacheKey}.bin`);
};

const getDataPathByFileName = (scope: ResourceProxyScope, dataFileName: string) => {
  return path.join(getScopeDir(scope), dataFileName);
};

const getMetaPath = (scope: ResourceProxyScope, cacheKey: string) => {
  return path.join(getScopeDir(scope), `${cacheKey}.json`);
};

const sanitizeDataFileName = (value: string) => {
  const normalized = path.basename(String(value || '').trim()).replace(/[\\/:*?"<>|]/g, '_');
  if (!normalized) {
    return '';
  }
  if (normalized.includes('..')) {
    return '';
  }
  return normalized;
};

const buildDataFileName = (cacheKey: string, fileName: string) => {
  const safeFileName = sanitizeDataFileName(fileName);
  if (!safeFileName) {
    return `${cacheKey}.bin`;
  }
  return `${cacheKey}-${safeFileName}`;
};

const getDataPathCandidates = (scope: ResourceProxyScope, cacheKey: string, record?: ResourceProxyCacheRecord) => {
  const fileNameCandidates = new Set<string>();
  const dataFileName = sanitizeDataFileName(record?.dataFileName || '');
  if (dataFileName) {
    fileNameCandidates.add(dataFileName);
  }

  const fallbackByFileName = buildDataFileName(cacheKey, String(record?.fileName || ''));
  if (fallbackByFileName) {
    fileNameCandidates.add(fallbackByFileName);
  }

  const candidatePaths = Array.from(fileNameCandidates).map(name => getDataPathByFileName(scope, name));
  candidatePaths.push(getLegacyDataPath(scope, cacheKey));
  return Array.from(new Set(candidatePaths));
};

const resolveCachedDataPath = async (
  scope: ResourceProxyScope,
  cacheKey: string,
  record?: ResourceProxyCacheRecord
): Promise<{ filePath: string; stat: fs.Stats } | null> => {
  const candidates = getDataPathCandidates(scope, cacheKey, record);
  for (const candidate of candidates) {
    const stat = await fs.promises.stat(candidate).catch(() => null);
    if (stat?.isFile()) {
      return {
        filePath: candidate,
        stat,
      };
    }
  }
  return null;
};

const removeCachedDataAndMeta = async (
  scope: ResourceProxyScope,
  cacheKey: string,
  record?: ResourceProxyCacheRecord
) => {
  await Promise.all(
    getDataPathCandidates(scope, cacheKey, record).map(filePath =>
      fs.promises.rm(filePath, { force: true }).catch(() => undefined)
    )
  );
  await fs.promises.rm(getMetaPath(scope, cacheKey), { force: true }).catch(() => undefined);
};

const readCacheRecord = async (
  scope: ResourceProxyScope,
  cacheKey: string
): Promise<ResourceProxyCacheRecord | null> => {
  const metaPath = getMetaPath(scope, cacheKey);

  try {
    const raw = await fs.promises.readFile(metaPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<ResourceProxyCacheRecord>;
    if (!parsed || typeof parsed !== 'object') {
      return null;
    }

    return {
      cacheKey,
      sourceUrl: String(parsed.sourceUrl || ''),
      fileName: String(parsed.fileName || `${cacheKey}.bin`),
      dataFileName: sanitizeDataFileName(String(parsed.dataFileName || '')) || undefined,
      contentType: String(parsed.contentType || 'application/octet-stream'),
      sizeBytes: Number(parsed.sizeBytes || 0),
      updatedAtMs: Number(parsed.updatedAtMs || 0),
    };
  } catch {
    return null;
  }
};

const writeCacheRecord = async (scope: ResourceProxyScope, record: ResourceProxyCacheRecord) => {
  const metaPath = getMetaPath(scope, record.cacheKey);
  await fs.promises.writeFile(metaPath, JSON.stringify(record), 'utf-8');
};

const ensureScopeDir = async (scope: ResourceProxyScope) => {
  await fs.promises.mkdir(getScopeDir(scope), { recursive: true });
};

const cleanupScopeCacheByLimit = async (scope: ResourceProxyScope, maxCacheSizeMb: number) => {
  const dir = getScopeDir(scope);
  const maxBytes = clampCacheSizeMb(maxCacheSizeMb) * 1024 * 1024;
  const entries = await fs.promises.readdir(dir, { withFileTypes: true }).catch(() => [] as fs.Dirent[]);
  const metaNames = entries.filter(item => item.isFile() && item.name.endsWith('.json')).map(item => item.name);

  const records = (
    await Promise.all(
      metaNames.map(async metaName => {
        const cacheKey = normalizeCacheKey(metaName.replace(/\.json$/i, ''));
        if (!cacheKey) {
          return undefined;
        }

        const record = await readCacheRecord(scope, cacheKey);
        if (!record) {
          return undefined;
        }

        const data = await resolveCachedDataPath(scope, cacheKey, record);
        if (!data) {
          await removeCachedDataAndMeta(scope, cacheKey, record);
          return undefined;
        }

        return {
          cacheKey,
          record,
          dataPath: data.filePath,
          updatedAtMs: Number(record.updatedAtMs || data.stat.mtimeMs || 0),
          sizeBytes: Number(record.sizeBytes || data.stat.size || 0),
        };
      })
    )
  ).filter(item => Boolean(item)) as Array<{
    cacheKey: string;
    record: ResourceProxyCacheRecord;
    dataPath: string;
    updatedAtMs: number;
    sizeBytes: number;
  }>;

  let totalBytes = records.reduce((sum, item) => sum + item.sizeBytes, 0);
  if (totalBytes <= maxBytes) {
    return;
  }

  const sorted = records.sort((a, b) => a.updatedAtMs - b.updatedAtMs);
  for (const item of sorted) {
    if (totalBytes <= maxBytes) {
      break;
    }

    await fs.promises.rm(item.dataPath, { force: true }).catch(() => undefined);
    await removeCachedDataAndMeta(scope, item.cacheKey, item.record);
    totalBytes -= item.sizeBytes;
  }
};

const buildFileName = (sourceUrl: string, contentType: string, cacheKey: string, preferredFileName?: string) => {
  const safePreferred = path.basename(String(preferredFileName || '').trim()).replace(/[\\/:*?"<>|]/g, '_');
  if (safePreferred) {
    return safePreferred;
  }

  const fromUrl = path.basename(new URL(sourceUrl).pathname || '').replace(/[\\/:*?"<>|]/g, '_');
  if (fromUrl) {
    return fromUrl;
  }

  const extFromMime = mime.extension(contentType) || 'bin';
  return `${cacheKey}.${extFromMime}`;
};

const parseProxyRequestConfig = (proxyUrl: string) => {
  const normalized = normalizeProxyRequestUrl(proxyUrl);
  if (!normalized) {
    return undefined;
  }

  const parsed = new URL(normalized);
  const protocol = parsed.protocol.replace(':', '');
  const port = Number(parsed.port || (protocol === 'https' ? 443 : 80));
  if (!protocol || !parsed.hostname || !Number.isFinite(port)) {
    return undefined;
  }

  const username = decodeURIComponent(parsed.username || '');
  const password = decodeURIComponent(parsed.password || '');
  return {
    protocol,
    host: parsed.hostname,
    port,
    auth: username ? { username, password } : undefined,
  };
};

const requestRemoteResource = async (params: {
  sourceUrl: string;
  requestProxyUrl?: string;
  requestHeaders?: Record<string, string | undefined>;
  requestTimeoutMs?: number;
  silentOnError?: boolean;
}) => {
  const requestConfig = {
    responseType: 'arraybuffer',
    timeout: Number(params.requestTimeoutMs || 30000),
    maxContentLength: MAX_DOWNLOAD_BYTES,
    headers: {
      Accept: '*/*',
      ...params.requestHeaders,
    },
    muteErrorLog: Boolean(params.silentOnError),
  } as any;

  const proxyConfig = parseProxyRequestConfig(String(params.requestProxyUrl || ''));
  const requestDirectly = () => request.get<ArrayBuffer | Buffer>(params.sourceUrl, requestConfig);

  if (!proxyConfig) {
    return requestDirectly();
  }

  try {
    return await requestDirectly();
  } catch {
    // Prefer direct connection. If it fails, retry once via configured proxy.
    return request.get<ArrayBuffer | Buffer>(params.sourceUrl, {
      ...requestConfig,
      proxy: proxyConfig,
    });
  }
};

export const buildResourceProxyUrl = (params: { scope: ResourceProxyScope; cacheKey: string }) => {
  const cacheKey = normalizeCacheKey(params.cacheKey);
  if (!cacheKey) {
    return '';
  }

  const pathPrefix = SCOPE_PATH_MAP[params.scope];
  return `${pathPrefix}/${encodeURIComponent(cacheKey)}`;
};

export const cacheRemoteResource = async (params: {
  scope: ResourceProxyScope;
  sourceUrl: string;
  maxCacheSizeMb: number;
  requestProxyUrl?: string;
  preferredFileName?: string;
  requestHeaders?: Record<string, string | undefined>;
  requestTimeoutMs?: number;
  silentOnError?: boolean;
}) => {
  const normalizedSourceUrl = normalizeHttpUrl(params.sourceUrl);
  if (!normalizedSourceUrl) {
    throw new Error('resource-url-invalid');
  }

  const cacheKey = crypto.createHash('sha256').update(normalizedSourceUrl).digest('hex');

  await ensureScopeDir(params.scope);

  const existed = await readCacheRecord(params.scope, cacheKey);
  const existedData = existed ? await resolveCachedDataPath(params.scope, cacheKey, existed) : null;
  if (existed && existedData) {
    const now = Date.now();
    const resolvedDataFileName = sanitizeDataFileName(path.basename(existedData.filePath));
    const touched: ResourceProxyCacheRecord = {
      ...existed,
      dataFileName: resolvedDataFileName || existed.dataFileName,
      updatedAtMs: now,
      sizeBytes: Number(existed.sizeBytes || existedData.stat.size || 0),
    };
    await writeCacheRecord(params.scope, touched);

    return {
      ...touched,
      filePath: existedData.filePath,
    };
  }

  const response = await requestRemoteResource({
    sourceUrl: normalizedSourceUrl,
    requestProxyUrl: params.requestProxyUrl,
    requestHeaders: params.requestHeaders,
    requestTimeoutMs: params.requestTimeoutMs,
    silentOnError: params.silentOnError,
  });

  const rawData = response.data;
  const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);
  const contentType = String(response.headers['content-type'] || 'application/octet-stream')
    .split(';')[0]
    .trim();
  const fileName = buildFileName(normalizedSourceUrl, contentType, cacheKey, params.preferredFileName);
  const dataFileName = buildDataFileName(cacheKey, fileName);
  const dataPath = getDataPathByFileName(params.scope, dataFileName);

  await fs.promises.writeFile(dataPath, buffer);
  const record: ResourceProxyCacheRecord = {
    cacheKey,
    sourceUrl: normalizedSourceUrl,
    fileName,
    dataFileName,
    contentType: contentType || 'application/octet-stream',
    sizeBytes: buffer.length,
    updatedAtMs: Date.now(),
  };
  await writeCacheRecord(params.scope, record);
  await cleanupScopeCacheByLimit(params.scope, params.maxCacheSizeMb);

  return {
    ...record,
    filePath: dataPath,
  };
};

export const getCachedResourceByKey = async (params: { scope: ResourceProxyScope; cacheKey: string }) => {
  const cacheKey = normalizeCacheKey(params.cacheKey);
  if (!cacheKey) {
    return null;
  }

  const record = await readCacheRecord(params.scope, cacheKey);
  if (!record) {
    return null;
  }

  const data = await resolveCachedDataPath(params.scope, cacheKey, record);
  if (!data) {
    return null;
  }

  const touched: ResourceProxyCacheRecord = {
    ...record,
    dataFileName: sanitizeDataFileName(path.basename(data.filePath)) || record.dataFileName,
    updatedAtMs: Date.now(),
    sizeBytes: Number(record.sizeBytes || data.stat.size || 0),
  };
  await writeCacheRecord(params.scope, touched);

  return {
    ...touched,
    filePath: data.filePath,
  };
};

export const getCachedResourceBySourceUrl = async (params: { scope: ResourceProxyScope; sourceUrl: string }) => {
  const normalizedSourceUrl = normalizeHttpUrl(params.sourceUrl);
  if (!normalizedSourceUrl) {
    return null;
  }

  const cacheKey = crypto.createHash('sha256').update(normalizedSourceUrl).digest('hex');
  return getCachedResourceByKey({
    scope: params.scope,
    cacheKey,
  });
};

export const parseResourceProxyBaseUrl = (value: string) => {
  return normalizeProxyRequestUrl(value);
};

export const parseResourceCacheSizeMb = (value: number, fallback: number) => {
  const raw = Number(value);
  if (!Number.isFinite(raw)) {
    return clampCacheSizeMb(fallback);
  }
  return clampCacheSizeMb(raw);
};
