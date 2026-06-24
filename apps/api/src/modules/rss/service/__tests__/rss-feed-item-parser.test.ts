import { describe, expect, it } from 'vitest';
import { parseRssFeedItemsFromXml } from '../rss-feed-item-parser.service';

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
<channel>
<title>M-Team - TP</title>
<link>https://kp.m-team.cc</link>
<description>Latest torrents from M-Team - TP Working</description>
<item>
<guid isPermaLink="false">1199476</guid>
<title>FC2-PPV-4925571 +++ test item</title>
<link>https://kp.m-team.cc/detail/1199476</link>
<description><p>desc<br /><img src="https://cdn.imgchest.com/files/d6b321cd6f20.jpg"/><img src="https://cdn.imgchest.com/files/ecc3324b893d.jpg"/></p></description>
<author>N/A@kp.m-team.cc</author>
<comments>https://kp.m-team.cc/detail/1199476#comment</comments>
<pubDate>Wed, 24 Jun 2026 10:47:29 GMT</pubDate>
<category domain="https://kp.m-team.cc/browse?cat=429">AV(無碼)/HD Uncensored</category>
</item>
<item>
<guid isPermaLink="false">1199064</guid>
<title>Picture Collection</title>
<link>https://kp.m-team.cc/detail/1199064</link>
<description><p><img src="https://img.m-team.cc/images/2026/06/24/6cb5b606d34535178de5dd4d2aa13d29.jpg" alt="" /><img src="https://img.m-team.cc/images/2026/06/24/21d6157b8f8ef8e003a1b195e176e3db.jpg" alt="" /></p></description>
<author>N/A@kp.m-team.cc</author>
<pubDate>Tue, 23 Jun 2026 17:41:45 GMT</pubDate>
<category domain="https://kp.m-team.cc/browse?cat=433">IV/Picture Collection</category>
</item>
</channel>
</rss>`;

describe('rss feed item parser', () => {
  it('parses standard rss feeds with inline image galleries', () => {
    const parsed = parseRssFeedItemsFromXml(sampleXml);

    expect(parsed.title).toBe('M-Team - TP');
    expect(parsed.link).toBe('https://kp.m-team.cc');
    expect(parsed.description).toBe('Latest torrents from M-Team - TP Working');
    expect(parsed.items).toHaveLength(2);

    expect(parsed.items[0]).toMatchObject({
      id: '1199476',
      title: 'FC2-PPV-4925571 +++ test item',
      link: 'https://kp.m-team.cc/detail/1199476',
      author: 'N/A@kp.m-team.cc',
      publishedAt: 'Wed, 24 Jun 2026 10:47:29 GMT',
      category: ['AV(無碼)/HD Uncensored'],
    });
    expect(parsed.items[0].descriptionHtml).toContain('https://cdn.imgchest.com/files/d6b321cd6f20.jpg');
    expect(parsed.items[0].imageUrls).toEqual([
      'https://cdn.imgchest.com/files/d6b321cd6f20.jpg',
      'https://cdn.imgchest.com/files/ecc3324b893d.jpg',
    ]);

    expect(parsed.items[1]).toMatchObject({
      id: '1199064',
      title: 'Picture Collection',
      link: 'https://kp.m-team.cc/detail/1199064',
      category: ['IV/Picture Collection'],
    });
    expect(parsed.items[1].imageUrls).toEqual([
      'https://img.m-team.cc/images/2026/06/24/6cb5b606d34535178de5dd4d2aa13d29.jpg',
      'https://img.m-team.cc/images/2026/06/24/21d6157b8f8ef8e003a1b195e176e3db.jpg',
    ]);
  });
});
