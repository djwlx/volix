import crypto from 'crypto';
import mime from 'mime-types';
import path from 'path';
import request from '../../../utils/request';
import { buildRssItemHtmlFileKey, writeRssItemResourceFileByKey } from './rss-feed-item-html-file.service';
import type { RssFeedItem } from '../types/rss.types';

const ATTRIBUTE_QUOTE_PATTERN = `(?:"|'|&quot;|&#34;|&apos;|&#39;)`;
const SRC_ATTR_REGEX = new RegExp(
  `\\b(src|poster|data-src)\\s*=\\s*(${ATTRIBUTE_QUOTE_PATTERN})(https?:\\/\\/[^"'<>\\s]+)\\2`,
  'gi'
);
const SRCSET_ATTR_REGEX = new RegExp(`\\bsrcset\\s*=\\s*(${ATTRIBUTE_QUOTE_PATTERN})([\\s\\S]*?)\\1`, 'gi');
const RSS_RESOURCE_REWRITE_MAX_URLS = 120;
const RETRY_LIMIT = 3;

const decodeHtmlUrl = (value: string) => String(value || '').replace(/&amp;/gi, '&');
const encodeHtmlUrl = (value: string) => String(value || '').replace(/&/g, '&amp;');

const replaceSrcsetValue = (srcset: string, resolver: (url: string) => string) => {
  return srcset
    .split(',')
    .map(item => item.trim())
    .filter(Boolean)
    .map(item => {
      const [urlPart, descriptor = ''] = item.split(/\s+/, 2);
      const resolved = resolver(urlPart || '');
      return descriptor ? `${resolved} ${descriptor}` : resolved;
    })
    .join(', ');
};

const collectHtmlResourceUrls = (html: string, itemImageUrls?: string[]) => {
  const urls = new Set<string>();
  const pushUrl = (value: string) => {
    const normalized = decodeHtmlUrl(String(value || '').trim());
    if (!/^https?:\/\//i.test(normalized)) {
      return;
    }
    urls.add(normalized);
  };

  const normalizedHtml = String(html || '');
  for (const match of normalizedHtml.matchAll(SRC_ATTR_REGEX)) {
    pushUrl(match[3] || '');
  }
  for (const match of normalizedHtml.matchAll(SRCSET_ATTR_REGEX)) {
    String(match[2] || '')
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .forEach(item => {
        const [url] = item.split(/\s+/, 1);
        pushUrl(url || '');
      });
  }

  (itemImageUrls || []).forEach(pushUrl);
  return Array.from(urls).slice(0, RSS_RESOURCE_REWRITE_MAX_URLS);
};

const rewriteHtmlWithUrlMap = (html: string, urlMap: Map<string, string>) => {
  const resolveUrl = (rawValue: string) => {
    const normalizedRaw = String(rawValue || '').trim();
    const decoded = decodeHtmlUrl(normalizedRaw);
    return urlMap.get(normalizedRaw) || urlMap.get(decoded) || normalizedRaw;
  };

  let rewritten = String(html || '').replace(SRC_ATTR_REGEX, (_full, attr: string, quote: string, url: string) => {
    const next = resolveUrl(url);
    return `${attr}=${quote}${next}${quote}`;
  });

  rewritten = rewritten.replace(SRCSET_ATTR_REGEX, (_full, quote: string, srcset: string) => {
    const nextSrcset = replaceSrcsetValue(String(srcset || ''), value => resolveUrl(value));
    return `srcset=${quote}${nextSrcset}${quote}`;
  });

  return rewritten;
};

const mapWithConcurrency = async <T, R>(list: T[], concurrency: number, worker: (item: T) => Promise<R>) => {
  const result = new Array<R>(list.length);
  let cursor = 0;
  const run = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= list.length) {
        break;
      }
      result[index] = await worker(list[index]);
    }
  };
  const workerCount = Math.max(1, Math.min(concurrency, list.length || 1));
  await Promise.all(Array.from({ length: workerCount }, () => run()));
  return result;
};

export const mapWithConcurrencyLimited = mapWithConcurrency;

const parseProxyRequestConfig = (proxyUrl: string) => {
  const raw = String(proxyUrl || '').trim();
  if (!raw) {
    return undefined;
  }
  try {
    const parsed = new URL(raw);
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
  } catch {
    return undefined;
  }
};

const requestRemoteResource = async (params: { sourceUrl: string; requestProxyUrl: string }) => {
  const requestConfig: any = {
    responseType: 'arraybuffer',
    timeout: 12000,
    maxContentLength: 50 * 1024 * 1024,
    headers: {
      Accept: '*/*',
    },
    muteErrorLog: true,
  };

  const proxyConfig = parseProxyRequestConfig(params.requestProxyUrl);
  const requestDirectly = () => request.get<ArrayBuffer | Buffer>(params.sourceUrl, requestConfig);

  if (!proxyConfig) {
    return requestDirectly();
  }

  try {
    return await requestDirectly();
  } catch {
    return request.get<ArrayBuffer | Buffer>(params.sourceUrl, {
      ...requestConfig,
      proxy: proxyConfig,
    });
  }
};

const resolveResourceFileName = (sourceUrl: string, contentType: string) => {
  let extFromUrl = '';
  try {
    const parsedExt = path.extname(new URL(sourceUrl).pathname || '').toLowerCase();
    extFromUrl = /^[.][a-z0-9]{1,8}$/i.test(parsedExt) ? parsedExt : '';
  } catch {
    extFromUrl = '';
  }
  const extFromMime = extFromUrl ? '' : `.${String(mime.extension(contentType) || 'bin')}`;
  const ext = extFromUrl || extFromMime;
  return `${crypto.createHash('sha256').update(sourceUrl).digest('hex').slice(0, 20)}${ext}`;
};

const cacheRssItemResourceFileWithRetry = async (params: {
  sourceUrl: string;
  requestProxyUrl: string;
  fileKey: string;
}) => {
  let attempt = 0;
  while (attempt < RETRY_LIMIT) {
    attempt += 1;
    try {
      const response = await requestRemoteResource({
        sourceUrl: params.sourceUrl,
        requestProxyUrl: params.requestProxyUrl,
      });
      const rawData = response.data;
      const buffer = Buffer.isBuffer(rawData) ? rawData : Buffer.from(rawData);
      if (!buffer.length) {
        throw new Error('empty-resource');
      }
      const contentType = String(response.headers['content-type'] || 'application/octet-stream')
        .split(';')[0]
        .trim();
      const fileName = resolveResourceFileName(params.sourceUrl, contentType);
      const publicUrl = await writeRssItemResourceFileByKey({
        key: params.fileKey,
        fileName,
        content: buffer,
      });
      if (!publicUrl) {
        throw new Error('resource-write-failed');
      }
      return {
        ok: true,
        replacement: publicUrl,
      } as const;
    } catch {
      // retry
    }
  }
  return {
    ok: false,
    replacement: params.sourceUrl,
  } as const;
};

export const rewriteRssItemResourcesStrict = async (
  item: RssFeedItem,
  params: { requestProxyUrl: string; userId: string; route: string; itemKey: string }
) => {
  const urls = collectHtmlResourceUrls(item.descriptionHtml, item.imageUrls);
  if (urls.length === 0) {
    return {
      item,
      resourceCount: 0,
    };
  }

  const fileKey = buildRssItemHtmlFileKey({
    userId: params.userId,
    route: params.route,
    itemKey: params.itemKey,
  });

  const mappings = await mapWithConcurrency(urls, 6, async sourceUrl => {
    const cached = await cacheRssItemResourceFileWithRetry({
      sourceUrl,
      requestProxyUrl: params.requestProxyUrl,
      fileKey,
    });
    return {
      sourceUrl,
      replacement: cached.replacement,
      cached: cached.ok,
    };
  });

  const urlMap = new Map<string, string>();
  mappings.forEach(item => {
    urlMap.set(item.sourceUrl, item.replacement);
    urlMap.set(encodeHtmlUrl(item.sourceUrl), item.replacement);
  });

  const rewrittenHtml = rewriteHtmlWithUrlMap(item.descriptionHtml, urlMap);
  const rewrittenImageUrls = (item.imageUrls || []).map(url => urlMap.get(url) || url);
  return {
    item: {
      ...item,
      descriptionHtml: rewrittenHtml,
      imageUrls: rewrittenImageUrls,
    },
    resourceCount: mappings.filter(item => item.cached).length,
  };
};
