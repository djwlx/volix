import crypto from 'crypto';
import type { RssFeedItem } from '../types/rss.types';
import { readRssItemHtmlFileByKey } from './rss-feed-item-html-file.service';

type RssFeedItemPersistInput = RssFeedItem & {
  resourceCount?: number;
  itemId?: string;
  resourcesLocalized?: boolean;
};

const safeJsonParse = <T>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeInt = (value: unknown): number | undefined => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const buildItemSourceHash = (item: RssFeedItem, resourceCount: number) => {
  return crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        id: item.id,
        title: item.title,
        link: item.link,
        description: item.description,
        descriptionHtml: item.descriptionHtml,
        imageUrls: item.imageUrls,
        author: item.author,
        publishedAt: item.publishedAt,
        guid: item.guid,
        category: item.category,
        updated: item.updated,
        enclosureUrl: item.enclosureUrl,
        enclosureLength: item.enclosureLength,
        enclosureType: item.enclosureType,
        comments: item.comments,
        upvotes: item.upvotes,
        downvotes: item.downvotes,
        media: item.media,
        doi: item.doi,
        resourceCount,
      })
    )
    .digest('hex');
};

export const buildFeedItemPersistPayload = (
  item: RssFeedItemPersistInput,
  htmlFileKey: string | null,
  sourceHash: string,
  fetchedAt: string
) => {
  return {
    item_id: String(item.itemId || item.id || ''),
    title: item.title,
    link: item.link,
    description: item.description,
    description_html: htmlFileKey ? '' : String(item.descriptionHtml || ''),
    description_html_file_key: htmlFileKey || undefined,
    image_urls: JSON.stringify(item.imageUrls || []),
    author: item.author,
    published_at: item.publishedAt,
    guid: item.guid || undefined,
    category: Array.isArray(item.category) ? JSON.stringify(item.category) : undefined,
    updated_at_text: item.updated || undefined,
    enclosure_url: item.enclosureUrl || undefined,
    enclosure_length: normalizeInt(item.enclosureLength),
    enclosure_type: item.enclosureType || undefined,
    comments_count: normalizeInt(item.comments),
    upvotes_count: normalizeInt(item.upvotes),
    downvotes_count: normalizeInt(item.downvotes),
    media_json: item.media ? JSON.stringify(item.media) : undefined,
    doi: item.doi || undefined,
    source_hash: sourceHash,
    resource_count: Math.max(0, Number(item.resourceCount || 0)),
    resources_localized: item.resourcesLocalized === true,
    fetched_at: fetchedAt,
  };
};

export const mapFeedItemRow = async (
  row: { dataValues: Record<string, any> },
  userId: string
): Promise<RssFeedItem> => {
  const imageUrls = safeJsonParse<string[]>(String(row.dataValues.image_urls || '[]'), []);
  const category = safeJsonParse<string[]>(String(row.dataValues.category || '[]'), []);
  const media = safeJsonParse<Record<string, unknown> | null>(String(row.dataValues.media_json || 'null'), null);
  const htmlFileKey = String(row.dataValues.description_html_file_key || '').trim();
  const fileHtml = htmlFileKey ? await readRssItemHtmlFileByKey({ userId, key: htmlFileKey }) : '';
  const descriptionHtml = fileHtml || String(row.dataValues.description_html || '');
  return {
    id: String(row.dataValues.item_id || ''),
    title: String(row.dataValues.title || ''),
    link: String(row.dataValues.link || ''),
    description: String(row.dataValues.description || ''),
    descriptionHtml,
    imageUrls: Array.isArray(imageUrls) ? imageUrls.map(item => String(item || '')).filter(Boolean) : [],
    author: String(row.dataValues.author || ''),
    publishedAt: String(row.dataValues.published_at || ''),
    guid: String(row.dataValues.guid || '').trim() || undefined,
    category: Array.isArray(category) ? category.map(item => String(item || '').trim()).filter(Boolean) : [],
    updated: String(row.dataValues.updated_at_text || '').trim() || undefined,
    enclosureUrl: String(row.dataValues.enclosure_url || '').trim() || undefined,
    enclosureLength: normalizeInt(row.dataValues.enclosure_length),
    enclosureType: String(row.dataValues.enclosure_type || '').trim() || undefined,
    comments: normalizeInt(row.dataValues.comments_count),
    upvotes: normalizeInt(row.dataValues.upvotes_count),
    downvotes: normalizeInt(row.dataValues.downvotes_count),
    media: media || undefined,
    doi: String(row.dataValues.doi || '').trim() || undefined,
  };
};
