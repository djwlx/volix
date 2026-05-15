import fs from 'fs';
import { beforeEach, describe, expect, test } from 'vitest';

import {
  getIncrementalCacheFolderPath,
  mergeRssFeedIncrementalCache,
  readRssFeedIncrementalCache,
} from '../../apps/api/src/modules/rss/service/rss-feed-incremental-cache.service';

const FEED_URL = 'https://example.com/rss/incremental-test';

const buildPayload = (xml: string, fetchedAt: string) => ({
  feedUrl: FEED_URL,
  contentType: 'application/rss+xml',
  xml,
  fetchedAt,
});

const XML_V1 = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <description>Feed Description</description>
    <link>https://example.com</link>
    <item>
      <guid>item-1</guid>
      <title>Item 1</title>
      <link>https://example.com/item-1</link>
      <description><![CDATA[<p>hello 1<img src="https://img.example.com/1.jpg" /></p>]]></description>
      <pubDate>Fri, 15 May 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <guid>item-2</guid>
      <title>Item 2</title>
      <link>https://example.com/item-2</link>
      <description><![CDATA[<p>hello 2<audio src="https://cdn.example.com/2.mp3"></audio></p>]]></description>
      <pubDate>Fri, 15 May 2026 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

const XML_V2 = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Test Feed</title>
    <description>Feed Description</description>
    <link>https://example.com</link>
    <item>
      <guid>item-3</guid>
      <title>Item 3</title>
      <link>https://example.com/item-3</link>
      <description><![CDATA[<p>hello 3<img src="https://img.example.com/3.jpg" /></p>]]></description>
      <pubDate>Fri, 15 May 2026 11:00:00 GMT</pubDate>
    </item>
    <item>
      <guid>item-2</guid>
      <title>Item 2 (updated)</title>
      <link>https://example.com/item-2</link>
      <description><![CDATA[<p>hello 2 updated</p>]]></description>
      <pubDate>Fri, 15 May 2026 09:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>`;

describe('rss feed incremental cache', () => {
  beforeEach(async () => {
    await fs.promises.rm(getIncrementalCacheFolderPath(FEED_URL), { recursive: true, force: true });
  });

  test('merges feed by item id and keeps history when upstream removes old item', async () => {
    const first = await mergeRssFeedIncrementalCache(buildPayload(XML_V1, '2026-05-15T10:10:00.000Z'));
    expect(first.total).toBe(2);
    expect(first.inserted).toBe(2);
    expect(first.updated).toBe(0);

    const second = await mergeRssFeedIncrementalCache(buildPayload(XML_V2, '2026-05-15T11:10:00.000Z'));
    expect(second.total).toBe(3);
    expect(second.inserted).toBe(1);
    expect(second.updated).toBe(1);

    const cached = await readRssFeedIncrementalCache(FEED_URL);
    expect(cached).not.toBeNull();
    expect(cached?.items.length).toBe(3);
    expect(cached?.title).toBe('Test Feed');
    expect(cached?.items[0]?.id).toBe('item-3');

    const item2 = cached?.items.find(item => item.id === 'item-2');
    expect(item2?.title).toBe('Item 2 (updated)');

    const item1 = cached?.items.find(item => item.id === 'item-1');
    expect(item1).toBeTruthy();
  });
});
