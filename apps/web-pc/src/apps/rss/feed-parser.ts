import type { RssReaderRawFeed } from '@volix/types';

export interface ReaderItem {
  id: string;
  title: string;
  link: string;
  description: string;
  descriptionHtml: string;
  imageUrls: string[];
  author: string;
  publishedAt: string;
}

export interface ReaderFeed {
  title: string;
  description: string;
  link: string;
  items: ReaderItem[];
}

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

  return new Intl.DateTimeFormat('zh-CN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(timestamp));
};

export const parseFeed = (rawFeed: RssReaderRawFeed): ReaderFeed => {
  const xml = rawFeed.xml;
  const doc = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = doc.querySelector('parsererror');
  if (parserError) {
    throw new Error('解析 RSS 失败，返回内容不是标准 XML');
  }

  const channel = doc.querySelector('rss > channel');
  if (channel) {
    const title = getTagText(channel, ['title']) || '未命名订阅';
    const description = getTagText(channel, ['description']);
    const link = getTagText(channel, ['link']);
    const items = Array.from(channel.getElementsByTagName('item'))
      .map((item, index) => {
        const itemTitle = getTagText(item, ['title']) || `未命名条目 #${index + 1}`;
        const itemLink = getTagText(item, ['link', 'guid']);
        const itemDescription = getTagText(item, ['description', 'content:encoded', 'content']);
        const sanitizedDescriptionHtml = sanitizeHtml(itemDescription);
        const itemAuthor = getTagText(item, ['author', 'dc:creator']);
        const itemPublishedAt = getTagText(item, ['pubDate', 'published', 'updated']);

        return {
          id: getTagText(item, ['guid']) || itemLink || `${itemTitle}-${index}`,
          title: itemTitle,
          link: itemLink,
          description: stripHtml(sanitizedDescriptionHtml),
          descriptionHtml: sanitizedDescriptionHtml,
          imageUrls: extractImageUrls(sanitizedDescriptionHtml),
          author: itemAuthor,
          publishedAt: itemPublishedAt,
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
    const title = getTagText(atomFeed, ['title']) || '未命名订阅';
    const description = getTagText(atomFeed, ['subtitle']);
    const link = getAtomEntryLink(atomFeed);
    const entries = Array.from(atomFeed.getElementsByTagName('entry'));

    const items = entries
      .map((entry, index) => {
        const itemTitle = getTagText(entry, ['title']) || `未命名条目 #${index + 1}`;
        const itemLink = getAtomEntryLink(entry);
        const itemDescription = getTagText(entry, ['summary', 'content']);
        const sanitizedDescriptionHtml = sanitizeHtml(itemDescription);
        const itemAuthor = getTagText(entry, ['author', 'name']);
        const itemPublishedAt = getTagText(entry, ['published', 'updated']);

        return {
          id: getTagText(entry, ['id']) || itemLink || `${itemTitle}-${index}`,
          title: itemTitle,
          link: itemLink,
          description: stripHtml(sanitizedDescriptionHtml),
          descriptionHtml: sanitizedDescriptionHtml,
          imageUrls: extractImageUrls(sanitizedDescriptionHtml),
          author: itemAuthor,
          publishedAt: itemPublishedAt,
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

  throw new Error('当前订阅既不是 RSS2.0，也不是 Atom 格式');
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
      title: '未命名订阅',
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
