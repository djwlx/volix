import type { RssFeedItem } from '../types/rss.types';

export interface ParsedRssFeed {
  title: string;
  description: string;
  link: string;
  items: RssFeedItem[];
}

const decodeHtmlEntities = (value: string): string => {
  const entityMap: Record<string, string> = {
    amp: '&',
    lt: '<',
    gt: '>',
    quot: '"',
    apos: "'",
  };

  return String(value || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, raw: string) => {
    const key = String(raw || '').toLowerCase();
    if (key.startsWith('#x')) {
      const code = Number.parseInt(key.slice(2), 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }

    if (key.startsWith('#')) {
      const code = Number.parseInt(key.slice(1), 10);
      return Number.isFinite(code) ? String.fromCodePoint(code) : full;
    }

    return entityMap[key] || full;
  });
};

const unwrapXmlValue = (value: string) => {
  const unwrappedCdata = String(value || '').replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
  return decodeHtmlEntities(unwrappedCdata).trim();
};

const stripHtml = (value: string) => {
  return unwrapXmlValue(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const sanitizeHtml = (value: string) => {
  const normalized = unwrapXmlValue(value);
  if (!normalized) {
    return '';
  }

  return normalized
    .replace(
      /<(script|style|iframe|object|embed|form|input|button|textarea|select|meta|link|base)\b[\s\S]*?<\/\1>/gi,
      ''
    )
    .replace(/\s+on[a-z]+\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+style\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/\s+srcset\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .trim();
};

const getTagText = (source: string, tagNames: string[]): string => {
  const normalizedSource = String(source || '');
  for (const tagName of tagNames) {
    const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matched = normalizedSource.match(
      new RegExp(`<${escapedTagName}\\b[^>]*>([\\s\\S]*?)<\\/${escapedTagName}>`, 'i')
    );
    const value = unwrapXmlValue(String(matched?.[1] || ''));
    if (value) {
      return value;
    }
  }
  return '';
};

const getAtomEntryLink = (source: string): string => {
  const linkTags = source.match(/<link\b[\s\S]*?>/gi) || [];

  const parseHref = (tag: string) => {
    const hrefMatched = tag.match(/\bhref\s*=\s*(["'])([\s\S]*?)\1/i);
    return String(hrefMatched?.[2] || '').trim();
  };

  const parseRel = (tag: string) => {
    const relMatched = tag.match(/\brel\s*=\s*(["'])([\s\S]*?)\1/i);
    return String(relMatched?.[2] || '')
      .trim()
      .toLowerCase();
  };

  for (const tag of linkTags) {
    const href = parseHref(tag);
    const rel = parseRel(tag);
    if (href && rel === 'alternate') {
      return href;
    }
  }

  for (const tag of linkTags) {
    const href = parseHref(tag);
    if (href) {
      return href;
    }
  }

  return getTagText(source, ['link']);
};

const extractImageUrls = (html: string): string[] => {
  const urls = new Set<string>();
  const pattern = /<img\b[^>]*\bsrc\s*=\s*(["'])(.*?)\1/gi;

  for (const match of html.matchAll(pattern)) {
    const url = String(match[2] || '').trim();
    if (!url) {
      continue;
    }

    if (!/^https?:\/\//i.test(url) && !url.startsWith('/')) {
      continue;
    }

    urls.add(url);
  }

  return Array.from(urls);
};

const toRssItem = (source: string, index: number): RssFeedItem | null => {
  const title = getTagText(source, ['title']) || `未命名条目 #${index + 1}`;
  const link = getTagText(source, ['link', 'guid']);
  const descriptionRaw = getTagText(source, ['description', 'content:encoded', 'content']);
  const descriptionHtml = sanitizeHtml(descriptionRaw);
  const description = stripHtml(descriptionHtml);
  const author = getTagText(source, ['author', 'dc:creator']);
  const publishedAt = getTagText(source, ['pubDate', 'published', 'updated']);
  const id = getTagText(source, ['guid']) || link || `${title}-${index}`;

  if (!title && !link && !description) {
    return null;
  }

  return {
    id,
    title,
    link,
    description,
    descriptionHtml,
    imageUrls: extractImageUrls(descriptionHtml),
    author,
    publishedAt,
  };
};

const toAtomItem = (source: string, index: number): RssFeedItem | null => {
  const title = getTagText(source, ['title']) || `未命名条目 #${index + 1}`;
  const link = getAtomEntryLink(source);
  const descriptionRaw = getTagText(source, ['summary', 'content']);
  const descriptionHtml = sanitizeHtml(descriptionRaw);
  const description = stripHtml(descriptionHtml);
  const author = getTagText(source, ['author', 'name']);
  const publishedAt = getTagText(source, ['published', 'updated']);
  const id = getTagText(source, ['id']) || link || `${title}-${index}`;

  if (!title && !link && !description) {
    return null;
  }

  return {
    id,
    title,
    link,
    description,
    descriptionHtml,
    imageUrls: extractImageUrls(descriptionHtml),
    author,
    publishedAt,
  };
};

export const buildRssItemStableKey = (item: RssFeedItem) => {
  const id = String(item.id || '').trim();
  if (id) {
    return `id:${id}`;
  }

  const link = String(item.link || '').trim();
  if (link) {
    return `link:${link}`;
  }

  return `fallback:${String(item.title || '').trim()}|${String(item.publishedAt || '').trim()}`;
};

export const parseRssFeedItemsFromXml = (xml: string): ParsedRssFeed => {
  const normalizedXml = String(xml || '');

  const channelMatched = normalizedXml.match(/<rss\b[\s\S]*?<channel\b[\s\S]*?>[\s\S]*?<\/channel>/i);
  if (channelMatched) {
    const channelXml = String(channelMatched[0] || '');
    const itemBlocks = channelXml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
    const items = itemBlocks.map((item, index) => toRssItem(item, index)).filter(Boolean) as RssFeedItem[];

    return {
      title: getTagText(channelXml, ['title']) || '未命名订阅',
      description: getTagText(channelXml, ['description']),
      link: getTagText(channelXml, ['link']),
      items,
    };
  }

  const feedMatched = normalizedXml.match(/<feed\b[\s\S]*?>[\s\S]*?<\/feed>/i);
  if (feedMatched) {
    const feedXml = String(feedMatched[0] || '');
    const entryBlocks = feedXml.match(/<entry\b[\s\S]*?<\/entry>/gi) || [];
    const items = entryBlocks.map((entry, index) => toAtomItem(entry, index)).filter(Boolean) as RssFeedItem[];

    return {
      title: getTagText(feedXml, ['title']) || '未命名订阅',
      description: getTagText(feedXml, ['subtitle']),
      link: getAtomEntryLink(feedXml),
      items,
    };
  }

  return {
    title: '未命名订阅',
    description: '',
    link: '',
    items: [],
  };
};
