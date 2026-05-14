import { badRequest } from '../../shared/http-handler';
import { fetchRssFeed } from './rss.service';
import { getRssFeedArchiveSnapshotCount, getRssFeedArchiveSnapshotPage } from './rss-feed-archive.service';
import type { GetRssFeedHistoryParams, RssFeedHistoryPayload, RssFeedPayload } from '../types/rss.types';

type HistoryCursor =
  | {
      mode: 'upstream';
      nextUrl: string;
    }
  | {
      mode: 'archive';
      feedUrl: string;
      offset: number;
    };

const parseAttribute = (tag: string, name: string): string => {
  const matched = tag.match(new RegExp(`${name}\\s*=\\s*(["'])([\\s\\S]*?)\\1`, 'i'));
  return String(matched?.[2] || '').trim();
};

const parseFeedLinks = (xml: string): Array<{ rel: string; href: string }> => {
  const links: Array<{ rel: string; href: string }> = [];
  const tagMatches = xml.match(/<(?:atom:)?link\b[\s\S]*?>/gi) || [];

  tagMatches.forEach(tag => {
    const href = parseAttribute(tag, 'href');
    if (!href) {
      return;
    }

    const rel = parseAttribute(tag, 'rel').toLowerCase();
    if (!rel) {
      return;
    }

    rel
      .split(/\s+/)
      .map(item => item.trim().toLowerCase())
      .filter(Boolean)
      .forEach(item => {
        links.push({ rel: item, href });
      });
  });

  return links;
};

const toAbsoluteUrl = (candidateUrl: string, baseUrl: string): string => {
  try {
    const parsed = new URL(candidateUrl, baseUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return '';
    }
    return parsed.toString();
  } catch {
    return '';
  }
};

const pickOlderPageUrl = (xml: string, baseUrl: string): string => {
  const links = parseFeedLinks(xml);
  const relPriority = ['prev-archive', 'previous-archive', 'next', 'previous', 'prev'];

  for (const rel of relPriority) {
    const matched = links.find(item => item.rel === rel);
    if (!matched?.href) {
      continue;
    }

    const nextUrl = toAbsoluteUrl(matched.href, baseUrl);
    if (nextUrl) {
      return nextUrl;
    }
  }

  return '';
};

const encodeCursor = (cursor: HistoryCursor): string => {
  return Buffer.from(JSON.stringify(cursor), 'utf-8').toString('base64url');
};

const decodeCursor = (cursor: string): HistoryCursor => {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf-8');
    const parsed = JSON.parse(raw) as Partial<HistoryCursor>;

    if (parsed.mode === 'upstream' && String(parsed.nextUrl || '').trim()) {
      return {
        mode: 'upstream',
        nextUrl: String(parsed.nextUrl).trim(),
      };
    }

    if (parsed.mode === 'archive' && String(parsed.feedUrl || '').trim()) {
      return {
        mode: 'archive',
        feedUrl: String(parsed.feedUrl).trim(),
        offset: Math.max(0, Math.floor(Number(parsed.offset || 0))),
      };
    }
  } catch {
    // ignore parse error and report统一错误
  }

  badRequest('历史游标无效，请刷新后重试');
  throw new Error('invalid rss history cursor');
};

const toHistoryPayload = (params: {
  page: RssFeedPayload;
  source: RssFeedHistoryPayload['source'];
  mode: RssFeedHistoryPayload['mode'];
  supportsUpstreamPagination: boolean;
  hasMore: boolean;
  nextCursor: string;
}): RssFeedHistoryPayload => {
  return {
    feedUrl: params.page.feedUrl,
    source: params.source,
    mode: params.mode,
    supportsUpstreamPagination: params.supportsUpstreamPagination,
    hasMore: params.hasMore,
    nextCursor: params.nextCursor,
    page: params.page,
  };
};

const getArchiveHistoryPage = async (params: { feedUrl: string; offset: number }): Promise<RssFeedHistoryPayload> => {
  const pageItems = await getRssFeedArchiveSnapshotPage({
    feedUrl: params.feedUrl,
    offset: params.offset,
    limit: 1,
  });

  const page = pageItems[0];
  if (!page) {
    badRequest('没有更多历史数据，请先刷新以生成新归档');
    throw new Error('rss archive page not found');
  }

  const archiveCount = await getRssFeedArchiveSnapshotCount(params.feedUrl);
  const nextOffset = params.offset + 1;
  const hasMore = nextOffset < archiveCount;

  return toHistoryPayload({
    page,
    source: 'archive',
    mode: hasMore ? 'archive' : 'none',
    supportsUpstreamPagination: false,
    hasMore,
    nextCursor: hasMore
      ? encodeCursor({
          mode: 'archive',
          feedUrl: params.feedUrl,
          offset: nextOffset,
        })
      : '',
  });
};

export const fetchRssFeedHistoryPage = async (
  params: GetRssFeedHistoryParams,
  userId?: string | number
): Promise<RssFeedHistoryPayload> => {
  const normalizedCursor = String(params.cursor || '').trim();
  if (normalizedCursor) {
    const decoded = decodeCursor(normalizedCursor);

    if (decoded.mode === 'upstream') {
      const page = await fetchRssFeed(
        {
          feedUrl: decoded.nextUrl,
          force: false,
        },
        userId
      );

      const nextUpstreamUrl = pickOlderPageUrl(page.xml, page.feedUrl);
      const hasMore = Boolean(nextUpstreamUrl);

      return toHistoryPayload({
        page,
        source: 'upstream',
        mode: hasMore ? 'upstream' : 'none',
        supportsUpstreamPagination: true,
        hasMore,
        nextCursor: hasMore
          ? encodeCursor({
              mode: 'upstream',
              nextUrl: nextUpstreamUrl,
            })
          : '',
      });
    }

    return getArchiveHistoryPage({
      feedUrl: decoded.feedUrl,
      offset: decoded.offset,
    });
  }

  const latestPage = await fetchRssFeed(
    {
      route: params.route,
      hub: params.hub,
      feedUrl: params.feedUrl,
      force: params.force,
    },
    userId
  );

  const nextUpstreamUrl = pickOlderPageUrl(latestPage.xml, latestPage.feedUrl);
  if (nextUpstreamUrl) {
    return toHistoryPayload({
      page: latestPage,
      source: 'latest',
      mode: 'upstream',
      supportsUpstreamPagination: true,
      hasMore: true,
      nextCursor: encodeCursor({
        mode: 'upstream',
        nextUrl: nextUpstreamUrl,
      }),
    });
  }

  const archiveCount = await getRssFeedArchiveSnapshotCount(latestPage.feedUrl);
  if (archiveCount > 1) {
    return toHistoryPayload({
      page: latestPage,
      source: 'latest',
      mode: 'archive',
      supportsUpstreamPagination: false,
      hasMore: true,
      nextCursor: encodeCursor({
        mode: 'archive',
        feedUrl: latestPage.feedUrl,
        offset: 1,
      }),
    });
  }

  return toHistoryPayload({
    page: latestPage,
    source: 'latest',
    mode: 'none',
    supportsUpstreamPagination: false,
    hasMore: false,
    nextCursor: '',
  });
};
