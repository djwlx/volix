import request from '../../../utils/request';

export interface AnimeRssItem {
  guid: string;
  title: string;
  link: string;
  description: string;
  pubDate?: string;
  torrentUrl?: string;
}

const decodeXml = (value: string) => {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .trim();
};

const getTagContent = (block: string, tag: string) => {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
  return match?.[1] ? decodeXml(match[1]) : '';
};

const getEnclosureUrl = (block: string) => {
  const match = block.match(/<enclosure[^>]*url="([^"]+)"[^>]*>/i);
  return match?.[1] ? decodeXml(match[1]) : '';
};

export const fetchRssXml = async (url: string) => {
  const result = await request.get<string>(url, {
    responseType: 'text',
    timeout: 30000,
  });
  return String(result.data || '');
};

export const parseRssItems = (xml: string): AnimeRssItem[] => {
  const itemBlocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) || [];
  return itemBlocks
    .map(block => {
      const title = getTagContent(block, 'title');
      const link = getTagContent(block, 'link');
      const guid = getTagContent(block, 'guid') || link || title;
      const description = getTagContent(block, 'description');
      const pubDate = getTagContent(block, 'pubDate');
      const torrentUrl = getEnclosureUrl(block) || link;

      return {
        guid,
        title,
        link,
        description,
        pubDate,
        torrentUrl,
      };
    })
    .filter(item => item.title && (item.guid || item.torrentUrl));
};
