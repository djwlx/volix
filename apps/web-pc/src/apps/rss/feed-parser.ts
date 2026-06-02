import type { RssReaderRawFeed } from '@volix/types';
import { translateClient } from '@/i18n';
import { getStoredLocale } from '@/i18n';

export interface ReaderItem {
  id: string;
  title: string;
  link: string;
  description: string;
  descriptionHtml: string;
  imageUrls: string[];
  author: string;
  publishedAt: string;
  guid?: string;
  category?: string[];
  updated?: string;
  enclosureUrl?: string;
  enclosureLength?: number;
  enclosureType?: string;
  comments?: number;
  upvotes?: number;
  downvotes?: number;
  media?: Record<string, unknown>;
  doi?: string;
}

export interface ReaderFeed {
  title: string;
  description: string;
  link: string;
  items: ReaderItem[];
}

const formatFeedCopy = (key: string, values?: Record<string, unknown>) => {
  return translateClient(key, values);
};

const buildItemStableKey = (item: ReaderItem): string => {
  const id = String(item.id || '').trim();
  if (id) {
    return `id:${id}`;
  }

  const link = String(item.link || '').trim();
  if (link) {
    return `link:${link}`;
  }

  const title = String(item.title || '').trim();
  const publishedAt = String(item.publishedAt || '').trim();
  return `fallback:${title}|${publishedAt}`;
};

const getDateWeight = (value: string): number => {
  const timestamp = Date.parse(String(value || ''));
  if (Number.isNaN(timestamp)) {
    return 0;
  }
  return timestamp;
};

const getTagText = (element: Element, tags: string[]): string => {
  for (const tag of tags) {
    const match = element.getElementsByTagName(tag)[0];
    const text = match?.textContent?.trim();
    if (text) {
      return text;
    }
  }
  return '';
};

const getTagTexts = (element: Element, tags: string[]): string[] => {
  const values: string[] = [];
  tags.forEach(tag => {
    const list = Array.from(element.getElementsByTagName(tag));
    list.forEach(node => {
      const text = String(node.textContent || '').trim();
      if (text) {
        values.push(text);
      }
    });
  });
  return values;
};

const parseIntSafe = (value: string): number | undefined => {
  const parsed = Number(String(value || '').trim());
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getCategories = (element: Element): string[] => {
  const categories = new Set<string>();
  getTagTexts(element, ['category']).forEach(item => categories.add(item));
  Array.from(element.getElementsByTagName('category')).forEach(item => {
    const term = String(item.getAttribute('term') || '').trim();
    if (term) {
      categories.add(term);
    }
  });
  return Array.from(categories);
};

const getRssEnclosure = (element: Element) => {
  const enclosure = element.getElementsByTagName('enclosure')[0];
  if (!enclosure) {
    return {};
  }
  return {
    enclosureUrl: String(enclosure.getAttribute('url') || '').trim() || undefined,
    enclosureLength: parseIntSafe(String(enclosure.getAttribute('length') || '')),
    enclosureType: String(enclosure.getAttribute('type') || '').trim() || undefined,
  };
};

const getAtomEntryLink = (entry: Element): string => {
  const links = Array.from(entry.getElementsByTagName('link'));
  const altLink = links.find(link => (link.getAttribute('rel') || '').toLowerCase() === 'alternate');
  if (altLink?.getAttribute('href')) {
    return String(altLink.getAttribute('href'));
  }

  const firstLink = links.find(link => link.getAttribute('href'));
  if (firstLink?.getAttribute('href')) {
    return String(firstLink.getAttribute('href'));
  }

  return '';
};

const getAtomEnclosure = (entry: Element) => {
  const links = Array.from(entry.getElementsByTagName('link'));
  const enclosure = links.find(link => String(link.getAttribute('rel') || '').toLowerCase() === 'enclosure');
  if (!enclosure) {
    return {};
  }
  return {
    enclosureUrl: String(enclosure.getAttribute('href') || '').trim() || undefined,
    enclosureLength: parseIntSafe(String(enclosure.getAttribute('length') || '')),
    enclosureType: String(enclosure.getAttribute('type') || '').trim() || undefined,
  };
};

const stripHtml = (value: string): string => {
  if (!value) {
    return '';
  }

  const doc = new DOMParser().parseFromString(value, 'text/html');
  return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
};

const extractImageUrls = (value: string): string[] => {
  if (!value) {
    return [];
  }

  const doc = new DOMParser().parseFromString(value, 'text/html');
  const images = Array.from(doc.querySelectorAll('img[src]'))
    .map(img => String(img.getAttribute('src') || '').trim())
    .filter(Boolean);

  return Array.from(new Set(images));
};

const BLOCKED_TAGS = [
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'form',
  'input',
  'button',
  'textarea',
  'select',
  'link',
  'meta',
  'base',
];

const SAFE_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const URL_ATTRS = new Set(['href', 'src', 'poster', 'xlink:href']);

const isInvalidResourceUrl = (value: string): boolean => {
  const normalized = String(value || '').trim();
  if (!normalized) {
    return true;
  }

  try {
    const parsed = new URL(normalized, 'https://rss.local');
    const tail = parsed.pathname.split('/').filter(Boolean).at(-1)?.toLowerCase() || '';
    return tail === 'undefined' || tail === 'null';
  } catch {
    return true;
  }
};

const sanitizeHtml = (value: string): string => {
  if (!value) {
    return '';
  }

  const doc = new DOMParser().parseFromString(value, 'text/html');

  BLOCKED_TAGS.forEach(tag => {
    doc.querySelectorAll(tag).forEach(node => node.remove());
  });

  const elements = Array.from(doc.body.querySelectorAll('*'));
  elements.forEach(element => {
    Array.from(element.attributes).forEach(attribute => {
      const attrName = attribute.name.toLowerCase();
      const attrValue = String(attribute.value || '').trim();

      if (attrName.startsWith('on') || attrName === 'style' || attrName === 'srcset') {
        element.removeAttribute(attribute.name);
        return;
      }

      if (!URL_ATTRS.has(attrName)) {
        return;
      }

      if (!attrValue) {
        element.removeAttribute(attribute.name);
        return;
      }

      try {
        const parsed = new URL(attrValue, 'https://rss.local');
        if (!SAFE_PROTOCOLS.has(parsed.protocol.toLowerCase())) {
          element.removeAttribute(attribute.name);
          return;
        }

        if (attrName !== 'href' && isInvalidResourceUrl(parsed.toString())) {
          element.removeAttribute(attribute.name);
        }
      } catch {
        element.removeAttribute(attribute.name);
      }
    });

    if (String(element.getAttribute('target') || '').toLowerCase() === '_blank') {
      element.setAttribute('rel', 'noopener noreferrer nofollow');
    }
  });

  return String(doc.body.innerHTML || '').trim();
};

export const formatFeedDate = (value: string): string => {
  if (!value) {
    return '';
  }

  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat(getStoredLocale(), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
};

export const parseFeed = (rawFeed: RssReaderRawFeed): ReaderFeed => {
  if (Array.isArray(rawFeed.items) && rawFeed.items.length > 0) {
    return {
      title: String(rawFeed.title || '').trim() || formatFeedCopy('rss.feed.unnamedSubscription'),
      description: String(rawFeed.description || '').trim(),
      link: String(rawFeed.link || '').trim(),
      items: rawFeed.items.map(item => {
        const normalizedHtml = sanitizeHtml(String(item.descriptionHtml || item.description || ''));
        return {
          id: String(item.id || ''),
          title:
            String(item.title || formatFeedCopy('rss.feed.unnamedItem')).trim() ||
            formatFeedCopy('rss.feed.unnamedItem'),
          link: String(item.link || ''),
          description: String(item.description || '').trim() || stripHtml(normalizedHtml),
          descriptionHtml: normalizedHtml,
          imageUrls: Array.isArray(item.imageUrls)
            ? item.imageUrls.map(url => String(url || '').trim()).filter(Boolean)
            : extractImageUrls(normalizedHtml),
          author: String(item.author || ''),
          publishedAt: String(item.publishedAt || ''),
          guid: String(item.guid || '').trim() || undefined,
          category: Array.isArray(item.category) ? item.category.map(i => String(i || '').trim()).filter(Boolean) : [],
          updated: String(item.updated || '').trim() || undefined,
          enclosureUrl: String(item.enclosureUrl || '').trim() || undefined,
          enclosureLength: Number.isFinite(Number(item.enclosureLength)) ? Number(item.enclosureLength) : undefined,
          enclosureType: String(item.enclosureType || '').trim() || undefined,
          comments: Number.isFinite(Number(item.comments)) ? Number(item.comments) : undefined,
          upvotes: Number.isFinite(Number(item.upvotes)) ? Number(item.upvotes) : undefined,
          downvotes: Number.isFinite(Number(item.downvotes)) ? Number(item.downvotes) : undefined,
          media: item.media && typeof item.media === 'object' ? item.media : undefined,
          doi: String(item.doi || '').trim() || undefined,
        };
      }),
    };
  }

  const xml = rawFeed.xml;
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error(formatFeedCopy('rss.feed.invalidXml'));
  }

  const channel = doc.querySelector('rss > channel');
  if (channel) {
    const title = getTagText(channel, ['title']) || formatFeedCopy('rss.feed.unnamedSubscription');
    const description = getTagText(channel, ['description']);
    const link = getTagText(channel, ['link']);
    const items = Array.from(channel.getElementsByTagName('item'))
      .map((item, index) => {
        const itemTitle =
          getTagText(item, ['title']) || formatFeedCopy('rss.feed.unnamedItemWithIndex', { index: index + 1 });
        const itemLink = getTagText(item, ['link', 'guid']);
        const itemDescription = getTagText(item, ['description', 'content:encoded', 'content']);
        const sanitizedDescriptionHtml = sanitizeHtml(itemDescription);
        const itemAuthor = getTagText(item, ['author', 'dc:creator']);
        const itemPublishedAt = getTagText(item, ['pubDate', 'published', 'updated']);
        const itemGuid = getTagText(item, ['guid']);
        const itemCategories = getCategories(item);
        const itemUpdated = getTagText(item, ['updated']);
        const itemComments = parseIntSafe(getTagText(item, ['slash:comments']));
        const itemDoi = getTagText(item, ['doi', 'dc:identifier']);
        const enclosure = getRssEnclosure(item);

        return {
          id: itemGuid || itemLink || `${itemTitle}-${index}`,
          title: itemTitle,
          link: itemLink,
          description: stripHtml(sanitizedDescriptionHtml),
          descriptionHtml: sanitizedDescriptionHtml,
          imageUrls: extractImageUrls(sanitizedDescriptionHtml),
          author: itemAuthor,
          publishedAt: itemPublishedAt,
          guid: itemGuid || undefined,
          category: itemCategories,
          updated: itemUpdated || undefined,
          enclosureUrl: enclosure.enclosureUrl,
          enclosureLength: enclosure.enclosureLength,
          enclosureType: enclosure.enclosureType,
          comments: itemComments,
          doi: itemDoi || undefined,
        };
      })
      .filter(item => item.title || item.link || item.description);

    return {
      title,
      description,
      link,
      items,
    };
  }

  const atomFeed = doc.querySelector('feed');
  if (atomFeed) {
    const title = getTagText(atomFeed, ['title']) || formatFeedCopy('rss.feed.unnamedSubscription');
    const description = getTagText(atomFeed, ['subtitle']);
    const link = getAtomEntryLink(atomFeed);
    const entries = Array.from(atomFeed.getElementsByTagName('entry'));

    const items = entries
      .map((entry, index) => {
        const itemTitle =
          getTagText(entry, ['title']) || formatFeedCopy('rss.feed.unnamedItemWithIndex', { index: index + 1 });
        const itemLink = getAtomEntryLink(entry);
        const itemDescription = getTagText(entry, ['summary', 'content']);
        const sanitizedDescriptionHtml = sanitizeHtml(itemDescription);
        const itemAuthor = getTagText(entry, ['author', 'name']);
        const itemPublishedAt = getTagText(entry, ['published', 'updated']);
        const itemUpdated = getTagText(entry, ['updated']);
        const itemCategories = getCategories(entry);
        const itemComments = parseIntSafe(getTagText(entry, ['comments']));
        const itemUpvotes = parseIntSafe(getTagText(entry, ['upvotes', 'activity:upvotes']));
        const itemDownvotes = parseIntSafe(getTagText(entry, ['downvotes', 'activity:downvotes']));
        const itemDoi = getTagText(entry, ['doi']);
        const enclosure = getAtomEnclosure(entry);
        const itemId = getTagText(entry, ['id']) || itemLink || `${itemTitle}-${index}`;

        return {
          id: itemId,
          title: itemTitle,
          link: itemLink,
          description: stripHtml(sanitizedDescriptionHtml),
          descriptionHtml: sanitizedDescriptionHtml,
          imageUrls: extractImageUrls(sanitizedDescriptionHtml),
          author: itemAuthor,
          publishedAt: itemPublishedAt,
          guid: itemId || undefined,
          category: itemCategories,
          updated: itemUpdated || undefined,
          enclosureUrl: enclosure.enclosureUrl,
          enclosureLength: enclosure.enclosureLength,
          enclosureType: enclosure.enclosureType,
          comments: itemComments,
          upvotes: itemUpvotes,
          downvotes: itemDownvotes,
          doi: itemDoi || undefined,
        };
      })
      .filter(item => item.title || item.link || item.description);

    return {
      title,
      description,
      link,
      items,
    };
  }

  throw new Error(formatFeedCopy('rss.feed.unsupportedFormat'));
};

export const mergeFeeds = (feeds: RssReaderRawFeed[]): ReaderFeed => {
  const parsedFeeds = feeds
    .map(feed => {
      try {
        return parseFeed(feed);
      } catch {
        return null;
      }
    })
    .filter(Boolean) as ReaderFeed[];

  if (parsedFeeds.length === 0) {
    return {
      title: formatFeedCopy('rss.feed.unnamedSubscription'),
      description: '',
      link: '',
      items: [],
    };
  }

  const itemMap = new Map<string, ReaderItem>();

  parsedFeeds.forEach(feed => {
    feed.items.forEach(item => {
      const key = buildItemStableKey(item);
      if (!itemMap.has(key)) {
        itemMap.set(key, item);
      }
    });
  });

  const mergedItems = Array.from(itemMap.values()).sort((a, b) => {
    return getDateWeight(b.publishedAt) - getDateWeight(a.publishedAt);
  });

  const primary = parsedFeeds[0];
  return {
    title: primary.title,
    description: primary.description,
    link: primary.link,
    items: mergedItems,
  };
};
