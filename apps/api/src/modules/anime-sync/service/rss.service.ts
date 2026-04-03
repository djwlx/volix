import request from '../../../utils/request';
import type { AnimeRssItem } from '../types/anime-sync.types';

const decodeXml = (text: string) => {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
};

const pickTag = (source: string, tag: string) => {
  const match = source.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return match?.[1] ? decodeXml(match[1]) : '';
};

const parseRssXml = (xml: string): AnimeRssItem[] => {
  const itemMatches = xml.match(/<item>([\s\S]*?)<\/item>/gi) || [];
  return itemMatches
    .map(itemXml => {
      const title = pickTag(itemXml, 'title');
      const link = pickTag(itemXml, 'link');
      const guid = pickTag(itemXml, 'guid');
      const pubDate = pickTag(itemXml, 'pubDate');
      if (!title) {
        return null;
      }
      return { title, link, guid, pubDate };
    })
    .filter(Boolean) as AnimeRssItem[];
};

export const fetchAnimeRssItems = async (rssUrl: string) => {
  const result = await request.get<string>(rssUrl, {
    responseType: 'text',
    timeout: 20000,
  });
  const xml = typeof result.data === 'string' ? result.data : String(result.data || '');
  return parseRssXml(xml);
};

export const extractMagnetFromRssItem = (item: AnimeRssItem) => {
  const candidates = [item.link, item.guid].filter(Boolean) as string[];
  return candidates.find(link => link.startsWith('magnet:?xt=urn:btih:')) || '';
};

export const buildEpisodeKey = (item: AnimeRssItem, magnet: string) => {
  const btih = magnet.match(/btih:([a-zA-Z0-9]+)/i)?.[1]?.toLowerCase();
  if (btih) {
    return `btih:${btih}`;
  }
  const base = item.guid || item.link || item.title;
  return base.trim().toLowerCase();
};
