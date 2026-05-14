import {
  buildResourceProxyUrl,
  cacheRemoteResource,
  getCachedResourceBySourceUrl,
} from '../../shared/service/resource-proxy-cache.service';

const ATTRIBUTE_QUOTE_PATTERN = `(?:"|'|&quot;|&#34;|&apos;|&#39;)`;
const SRC_ATTR_REGEX = new RegExp(
  `\\b(src|poster|data-src)\\s*=\\s*(${ATTRIBUTE_QUOTE_PATTERN})(https?:\\/\\/[^"'<>\\s]+)\\2`,
  'gi'
);
const SRCSET_ATTR_REGEX = new RegExp(`\\bsrcset\\s*=\\s*(${ATTRIBUTE_QUOTE_PATTERN})([\\s\\S]*?)\\1`, 'gi');
const MEDIA_URL_ATTR_REGEX = new RegExp(
  `<(?:media:[^>]*|enclosure[^>]*)\\burl\\s*=\\s*(${ATTRIBUTE_QUOTE_PATTERN})(https?:\\/\\/[^"'<>\\s]+)\\1`,
  'gi'
);
const RSS_RESOURCE_REWRITE_MAX_URLS = 80;
const RSS_RESOURCE_FAILURE_COOLDOWN_MS = 10 * 60 * 1000;
const rssResourceFailureCooldownMap = new Map<string, number>();
const rssResourceCacheJobMap = new Map<string, Promise<void>>();

const decodeHtmlUrl = (value: string) => {
  return String(value || '').replace(/&amp;/gi, '&');
};

const encodeHtmlUrl = (value: string) => {
  return String(value || '').replace(/&/g, '&amp;');
};

const collectResourceUrls = (xml: string) => {
  const urls = new Set<string>();
  const pushUrl = (value: string) => {
    const decoded = decodeHtmlUrl(value).trim();
    if (!decoded || !/^https?:\/\//i.test(decoded)) {
      return;
    }
    urls.add(decoded);
  };

  for (const match of xml.matchAll(SRC_ATTR_REGEX)) {
    pushUrl(match[3] || '');
  }

  for (const match of xml.matchAll(MEDIA_URL_ATTR_REGEX)) {
    pushUrl(match[2] || '');
  }

  for (const match of xml.matchAll(SRCSET_ATTR_REGEX)) {
    const srcset = String(match[2] || '');
    srcset
      .split(',')
      .map(item => item.trim())
      .filter(Boolean)
      .forEach(item => {
        const [url] = item.split(/\s+/, 1);
        pushUrl(url || '');
      });
  }

  return Array.from(urls);
};

const mapWithConcurrency = async <T, R>(list: T[], concurrency: number, handler: (item: T) => Promise<R>) => {
  const result: R[] = new Array(list.length);
  let cursor = 0;

  const worker = async () => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= list.length) {
        break;
      }
      result[index] = await handler(list[index]);
    }
  };

  const workerCount = Math.max(1, Math.min(concurrency, list.length || 1));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return result;
};

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

const ensureResourceCachedInBackground = (params: {
  sourceUrl: string;
  cacheSizeMb: number;
  requestProxyUrl: string;
}) => {
  const normalizedUrl = String(params.sourceUrl || '').trim();
  if (!normalizedUrl) {
    return;
  }

  const failedUntil = rssResourceFailureCooldownMap.get(normalizedUrl) || 0;
  if (failedUntil > Date.now()) {
    return;
  }

  if (rssResourceCacheJobMap.has(normalizedUrl)) {
    return;
  }

  const job = cacheRemoteResource({
    scope: 'rss',
    sourceUrl: normalizedUrl,
    maxCacheSizeMb: params.cacheSizeMb,
    requestProxyUrl: params.requestProxyUrl,
    requestTimeoutMs: 5000,
    silentOnError: true,
  })
    .then(() => undefined)
    .catch(() => {
      rssResourceFailureCooldownMap.set(normalizedUrl, Date.now() + RSS_RESOURCE_FAILURE_COOLDOWN_MS);
    })
    .finally(() => {
      rssResourceCacheJobMap.delete(normalizedUrl);
    });

  rssResourceCacheJobMap.set(normalizedUrl, job);
};

export const rewriteRssXmlResourceUrls = async (params: {
  xml: string;
  requestProxyUrl: string;
  cacheSizeMb: number;
}) => {
  const xml = String(params.xml || '');
  if (!xml) {
    return xml;
  }

  const urls = collectResourceUrls(xml).slice(0, RSS_RESOURCE_REWRITE_MAX_URLS);
  if (urls.length === 0) {
    return xml;
  }

  const mapped = await mapWithConcurrency(urls, 8, async url => {
    const cached = await getCachedResourceBySourceUrl({
      scope: 'rss',
      sourceUrl: url,
    });
    if (cached) {
      const proxyUrl = buildResourceProxyUrl({
        scope: 'rss',
        cacheKey: cached.cacheKey,
      });
      return {
        source: url,
        replacement: proxyUrl || url,
      };
    }

    ensureResourceCachedInBackground({
      sourceUrl: url,
      cacheSizeMb: params.cacheSizeMb,
      requestProxyUrl: params.requestProxyUrl,
    });

    return {
      source: url,
      replacement: url,
    };
  });

  const urlMap = new Map<string, string>();
  mapped.forEach(item => {
    urlMap.set(item.source, item.replacement);
    urlMap.set(encodeHtmlUrl(item.source), item.replacement);
  });

  const resolveUrl = (rawValue: string) => {
    const normalizedRaw = String(rawValue || '').trim();
    const decoded = decodeHtmlUrl(normalizedRaw);
    return urlMap.get(normalizedRaw) || urlMap.get(decoded) || normalizedRaw;
  };

  let rewritten = xml.replace(SRC_ATTR_REGEX, (_full, attr: string, quote: string, url: string) => {
    const next = resolveUrl(url);
    return `${attr}=${quote}${next}${quote}`;
  });

  rewritten = rewritten.replace(SRCSET_ATTR_REGEX, (_full, quote: string, srcset: string) => {
    const nextSrcset = replaceSrcsetValue(String(srcset || ''), value => resolveUrl(value));
    return `srcset=${quote}${nextSrcset}${quote}`;
  });

  rewritten = rewritten.replace(MEDIA_URL_ATTR_REGEX, (full, quote: string, url: string) => {
    const next = resolveUrl(url);
    return full.replace(`${quote}${url}${quote}`, `${quote}${next}${quote}`);
  });

  return rewritten;
};
