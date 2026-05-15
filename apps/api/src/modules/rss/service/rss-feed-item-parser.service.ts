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

const getTagTexts = (source: string, tagNames: string[]): string[] => {
  const normalizedSource = String(source || '');
  const values: string[] = [];
  for (const tagName of tagNames) {
    const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matchedList = normalizedSource.matchAll(
      new RegExp(`<${escapedTagName}\\b[^>]*>([\\s\\S]*?)<\\/${escapedTagName}>`, 'gi')
    );
    for (const matched of matchedList) {
      const value = unwrapXmlValue(String(matched?.[1] || ''));
      if (value) {
        values.push(value);
      }
    }
  }
  return values;
};

const parseTagAttributes = (tagText: string): Record<string, string> => {
  const attrs: Record<string, string> = {};
  const normalized = String(tagText || '');
  const attrMatched = normalized.matchAll(/([a-zA-Z_:][\w:.-]*)\s*=\s*(["'])([\s\S]*?)\2/g);
  for (const item of attrMatched) {
    const key = String(item[1] || '').trim();
    const value = unwrapXmlValue(String(item[3] || '')).trim();
    if (key && value) {
      attrs[key] = value;
    }
  }
  return attrs;
};

const getFirstTagAttributes = (source: string, tagNames: string[]): Record<string, string> => {
  const normalizedSource = String(source || '');
  for (const tagName of tagNames) {
    const escapedTagName = tagName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const matched = normalizedSource.match(new RegExp(`<${escapedTagName}\\b([\\s\\S]*?)\\/?>`, 'i'));
    if (!matched) {
      continue;
    }
    const attrs = parseTagAttributes(String(matched[0] || ''));
    if (Object.keys(attrs).length > 0) {
      return attrs;
    }
  }
  return {};
};

const normalizeInt = (value: string): number | undefined => {
  const parsed = Number(String(value || '').trim());
  if (!Number.isFinite(parsed)) {
    return undefined;
  }
  const normalized = Math.max(0, Math.round(parsed));
  return normalized;
};

const normalizeDoi = (value: string): string => {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  return /^10\.\S+\/\S+$/i.test(text) ? text : '';
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

const getAtomEnclosure = (
  source: string
): {
  enclosureUrl?: string;
  enclosureLength?: number;
  enclosureType?: string;
} => {
  const linkTags = source.match(/<link\b[\s\S]*?>/gi) || [];
  for (const tagText of linkTags) {
    const attrs = parseTagAttributes(tagText);
    if (String(attrs.rel || '').toLowerCase() !== 'enclosure') {
      continue;
    }
    return {
      enclosureUrl: attrs.href || undefined,
      enclosureLength: normalizeInt(attrs.length || ''),
      enclosureType: attrs.type || undefined,
    };
  }
  return {};
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

const getCategories = (source: string): string[] => {
  const categories = new Set<string>();
  getTagTexts(source, ['category']).forEach(item => {
    const normalized = item.trim();
    if (normalized) {
      categories.add(normalized);
    }
  });
  const categoryTags = source.match(/<category\b[\s\S]*?\/?>/gi) || [];
  categoryTags.forEach(tagText => {
    const attrs = parseTagAttributes(tagText);
    const term = String(attrs.term || '').trim();
    if (term) {
      categories.add(term);
    }
  });
  return Array.from(categories);
};

const getEnclosure = (
  source: string
): {
  enclosureUrl?: string;
  enclosureLength?: number;
  enclosureType?: string;
} => {
  const attrs = getFirstTagAttributes(source, ['enclosure']);
  return {
    enclosureUrl: attrs.url || undefined,
    enclosureLength: normalizeInt(attrs.length || ''),
    enclosureType: attrs.type || undefined,
  };
};

const getMedia = (source: string): Record<string, unknown> | undefined => {
  const mediaContent = getFirstTagAttributes(source, ['media:content']);
  const mediaThumbnail = getFirstTagAttributes(source, ['media:thumbnail']);
  const payload: Record<string, unknown> = {};
  if (Object.keys(mediaContent).length > 0) {
    payload.content = mediaContent;
  }
  if (Object.keys(mediaThumbnail).length > 0) {
    payload.thumbnail = mediaThumbnail;
  }
  return Object.keys(payload).length > 0 ? payload : undefined;
};

const toRssItem = (source: string, index: number): RssFeedItem | null => {
  const title = getTagText(source, ['title']) || `未命名条目 #${index + 1}`;
  const link = getTagText(source, ['link', 'guid']);
  const descriptionRaw = getTagText(source, ['description', 'content:encoded', 'content']);
  const descriptionHtml = sanitizeHtml(descriptionRaw);
  const description = stripHtml(descriptionHtml);
  const author = getTagText(source, ['author', 'dc:creator']);
  const publishedAt = getTagText(source, ['pubDate', 'published', 'updated']);
  const guid = getTagText(source, ['guid']);
  const category = getCategories(source);
  const updated = getTagText(source, ['updated']);
  const enclosure = getEnclosure(source);
  const comments = normalizeInt(getTagText(source, ['slash:comments']));
  const upvotes = normalizeInt(getTagText(source, ['upvotes', 'activity:upvotes']));
  const downvotes = normalizeInt(getTagText(source, ['downvotes', 'activity:downvotes']));
  const doi = normalizeDoi(getTagText(source, ['doi', 'dc:identifier']));
  const media = getMedia(source);
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
    guid: guid || undefined,
    category,
    updated: updated || undefined,
    enclosureUrl: enclosure.enclosureUrl,
    enclosureLength: enclosure.enclosureLength,
    enclosureType: enclosure.enclosureType,
    comments,
    upvotes,
    downvotes,
    media,
    doi: doi || undefined,
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
  const updated = getTagText(source, ['updated']);
  const category = getCategories(source);
  const enclosure = getAtomEnclosure(source);
  const comments = normalizeInt(getTagText(source, ['comments']));
  const upvotes = normalizeInt(getTagText(source, ['upvotes', 'activity:upvotes']));
  const downvotes = normalizeInt(getTagText(source, ['downvotes', 'activity:downvotes']));
  const doi = normalizeDoi(getTagText(source, ['doi']));
  const media = getMedia(source);
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
    guid: id || undefined,
    category,
    updated: updated || undefined,
    enclosureUrl: enclosure.enclosureUrl,
    enclosureLength: enclosure.enclosureLength,
    enclosureType: enclosure.enclosureType,
    comments,
    upvotes,
    downvotes,
    media,
    doi: doi || undefined,
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
