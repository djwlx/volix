import request from '../../../utils/request';

const MAX_DOWNLOAD_BYTES = 50 * 1024 * 1024;
const MIN_CACHE_SIZE_MB = 0;
const MAX_CACHE_SIZE_MB = 102400;

export const normalizeHttpUrl = (value: string) => {
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

export const parseResourceProxyBaseUrl = (value: string) => {
  return normalizeHttpUrl(value);
};

const clampCacheSizeMb = (value: number) => {
  const raw = Number(value || 0);
  if (!Number.isFinite(raw)) {
    return MIN_CACHE_SIZE_MB;
  }
  return Math.min(MAX_CACHE_SIZE_MB, Math.max(MIN_CACHE_SIZE_MB, Math.round(raw)));
};

export const parseResourceCacheSizeMb = (value: number, fallback: number) => {
  const raw = Number(value);
  if (!Number.isFinite(raw)) {
    return clampCacheSizeMb(fallback);
  }
  return clampCacheSizeMb(raw);
};

const parseProxyRequestConfig = (proxyUrl: string) => {
  const normalized = normalizeHttpUrl(proxyUrl);
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

export const fetchRemoteResource = async (params: {
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

  const response = proxyConfig
    ? await requestDirectly().catch(() =>
        request.get<ArrayBuffer | Buffer>(params.sourceUrl, { ...requestConfig, proxy: proxyConfig })
      )
    : await requestDirectly();

  const rawData = response.data;
  const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);
  const contentType = String(response.headers['content-type'] || 'application/octet-stream')
    .split(';')[0]
    .trim();

  return {
    buffer,
    contentType: contentType || 'application/octet-stream',
  };
};
