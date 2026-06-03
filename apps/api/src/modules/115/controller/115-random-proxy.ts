import { badRequest } from '../../shared/http-handler';
import request from '../../../utils/request';
import { getRandomCacheConfig } from '../service/picture/picture-cache-random-core';

export const isEnabledQueryFlag = (value: unknown) => {
  const text = String(value || '')
    .trim()
    .toLowerCase();
  return text === '1' || text === 'true' || text === 'yes' || text === 'on';
};

export const toRandomPicResponseUrl = (rawUrl: string, pc: string, preferProxy: boolean) => {
  if (!preferProxy) {
    return rawUrl;
  }
  if (rawUrl.startsWith('/api/115/pic/')) {
    return rawUrl;
  }
  return `/api/115/pic/cache/${encodeURIComponent(pc)}`;
};

const toAbsoluteRemoteUrl = (value: string) => {
  const text = String(value || '').trim();
  if (!/^https?:\/\//i.test(text)) {
    return '';
  }
  try {
    const url = new URL(text);
    const normalizedPath = String(url.pathname || '').trim();
    if (!normalizedPath || normalizedPath === '/') {
      url.pathname = '/api/115/pic';
    }
    return url.toString();
  } catch {
    return '';
  }
};

export const buildRemoteEndpointUrl = (endpoint: string, params: Record<string, string | undefined>) => {
  const url = new URL(endpoint);
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) {
      return;
    }
    url.searchParams.set(key, value);
  });
  return url.toString();
};

export const buildRemoteParentRandomEndpoint = (endpoint: string) => {
  const url = new URL(endpoint);
  if (url.pathname.endsWith('/pic/parent-random')) {
    return url.toString();
  }
  if (url.pathname.endsWith('/pic')) {
    url.pathname = `${url.pathname}/parent-random`;
  } else if (url.pathname.endsWith('/pic/')) {
    url.pathname = `${url.pathname}parent-random`;
  }
  return url.toString();
};

export const buildRemotePicPathEndpoint = (endpoint: string) => {
  const url = new URL(endpoint);
  if (url.pathname.endsWith('/pic/path')) {
    return url.toString();
  }
  if (url.pathname.endsWith('/pic')) {
    url.pathname = `${url.pathname}/path`;
  } else if (url.pathname.endsWith('/pic/')) {
    url.pathname = `${url.pathname}path`;
  }
  return url.toString();
};

export const isSelfReferencingRandomPicEndpoint = (
  ctx: {
    request?: {
      headers?: Record<string, unknown>;
    };
  },
  endpoint: string
) => {
  const host = String(ctx.request?.headers?.host || '')
    .trim()
    .toLowerCase();
  if (!host) {
    return false;
  }
  try {
    const url = new URL(endpoint);
    const endpointHost = String(url.host || '')
      .trim()
      .toLowerCase();
    const endpointPath = String(url.pathname || '').trim();
    if (!endpointHost || endpointHost !== host) {
      return false;
    }
    return endpointPath === '/api/115/pic' || endpointPath === '/api/115/pic/parent-random';
  } catch {
    return false;
  }
};

const parseRemoteRandomPicPayload = (payload: unknown) => {
  const wrapped = payload as { data?: unknown } | undefined;
  const data = wrapped && typeof wrapped === 'object' && 'data' in wrapped ? wrapped.data : payload;
  const item = (data || {}) as Record<string, unknown>;
  const url = String(item.url || '').trim();
  if (!url) {
    return null;
  }
  const fileName = String(item.fileName || '').trim() || 'unknown.jpg';
  const cid = String(item.cid || '').trim();
  const pc = String(item.pc || '').trim();
  const path = String(item.path || '').trim();
  const parentPath = String(item.parentPath || '').trim();
  const liked = Boolean(item.liked);
  const noticeText = String(item.notice || '').trim();
  return {
    url,
    fileName,
    cid,
    pc,
    path,
    parentPath,
    liked,
    notice: noticeText || undefined,
  };
};

const normalizeRemoteMetaUrl = (url: string, endpoint: string) => {
  const raw = String(url || '').trim();
  if (!raw) {
    return '';
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  try {
    return new URL(raw, endpoint).toString();
  } catch {
    return raw;
  }
};

export const parseRemotePicPathPayload = (payload: unknown) => {
  const wrapped = payload as { data?: unknown } | undefined;
  const data = wrapped && typeof wrapped === 'object' && 'data' in wrapped ? wrapped.data : payload;
  const item = (data || {}) as Record<string, unknown>;
  const parsedPc = String(item.pc || '').trim();
  if (!parsedPc) {
    return null;
  }
  return {
    pc: parsedPc,
    cid: String(item.cid || '').trim(),
    parentPath: String(item.parentPath || '').trim(),
    path: String(item.path || '').trim(),
    liked: Boolean(item.liked),
    cached: Boolean(item.cached),
  };
};

export const getConfiguredRandomPicOptions = async () => {
  const config = await getRandomCacheConfig();
  return {
    endpoint: toAbsoluteRemoteUrl(config.randomPicEndpoint || ''),
    localProxyEnabled: Boolean(config.localProxyEnabled),
    autoPlayIntervalSeconds: Number(config.autoPlayIntervalSeconds || 0),
  };
};

export const getRemoteRandomPicMeta = async (endpoint: string, userAgent: string) => {
  const result = await request.get(endpoint, {
    headers: {
      'User-Agent': userAgent,
    },
  });
  const parsed = parseRemoteRandomPicPayload(result.data);
  if (!parsed) {
    badRequest('随机图片端点返回数据无效');
    return {
      url: '',
      fileName: 'unknown.jpg',
      cid: '',
      pc: '',
      path: '',
      parentPath: '',
      liked: false,
      notice: undefined,
    };
  }
  return {
    ...parsed,
    url: normalizeRemoteMetaUrl(parsed.url, endpoint),
  };
};
