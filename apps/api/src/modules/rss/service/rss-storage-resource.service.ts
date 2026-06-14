import { buildResourceProxyUrl, cacheRemoteResource } from '../../shared/service/resource-proxy-cache.service';
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

const cacheRssItemResourceWithRetry = async (params: {
  userId: string;
  sourceUrl: string;
  requestProxyUrl: string;
  cacheSizeMb: number;
}) => {
  let attempt = 0;
  while (attempt < RETRY_LIMIT) {
    attempt += 1;
    try {
      const cached = await cacheRemoteResource({
        scope: 'rss',
        userId: params.userId,
        sourceUrl: params.sourceUrl,
        maxCacheSizeMb: params.cacheSizeMb,
        requestProxyUrl: params.requestProxyUrl,
        requestTimeoutMs: 12000,
        silentOnError: true,
      });
      const replacement = buildResourceProxyUrl({ scope: 'rss', cacheKey: cached.cacheKey });
      if (replacement) {
        return {
          ok: true,
          replacement,
        } as const;
      }
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
  params: { requestProxyUrl: string; userId: string; cacheSizeMb: number }
) => {
  const urls = collectHtmlResourceUrls(item.descriptionHtml, item.imageUrls);
  if (urls.length === 0) {
    return {
      item,
      resourceCount: 0,
    };
  }

  const mappings = await mapWithConcurrency(urls, 6, async sourceUrl => {
    const cached = await cacheRssItemResourceWithRetry({
      userId: params.userId,
      sourceUrl,
      requestProxyUrl: params.requestProxyUrl,
      cacheSizeMb: params.cacheSizeMb,
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
