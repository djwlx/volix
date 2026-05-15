import type { ReaderItem } from './feed-parser';

export interface AggregatedItem extends ReaderItem {
  itemKey: string;
  route: string;
  routeName: string;
  feedTitle: string;
  fetchedAt: string;
}

export const buildItemId = (item: ReaderItem): string => {
  const id = String(item.id || '').trim();
  if (id) {
    return id;
  }

  const link = String(item.link || '').trim();
  if (link) {
    return `link:${link}`;
  }

  const title = String(item.title || '').trim();
  const publishedAt = String(item.publishedAt || '').trim();
  return `fallback:${title}|${publishedAt}`;
};

export const toTimestamp = (value: string, fallback?: string): number => {
  const primary = Date.parse(String(value || ''));
  if (!Number.isNaN(primary)) {
    return primary;
  }

  const secondary = Date.parse(String(fallback || ''));
  if (!Number.isNaN(secondary)) {
    return secondary;
  }

  return 0;
};

export const normalizeText = (value: string): string => {
  return String(value || '')
    .trim()
    .toLowerCase();
};
