import { describe, expect, it } from 'vitest';
import { buildPicCacheDownloadRequestUrl } from '../picture-download-url';

describe('buildPicCacheDownloadRequestUrl', () => {
  it('prefers the configured cloud proxy url for cache downloads', () => {
    const result = buildPicCacheDownloadRequestUrl({
      originUrl: 'https://imgjump.115.com/?sha1=abc',
      cloudProxyUrl: 'https://worker.example.com/proxy',
      userAgent: 'Mozilla/5.0 Test',
    });

    expect(result).toBe(
      'https://worker.example.com/proxy?url=https%3A%2F%2Fimgjump.115.com%2F%3Fsha1%3Dabc&ua=Mozilla%2F5.0+Test'
    );
  });

  it('falls back to the origin url when no cloud proxy is configured', () => {
    const result = buildPicCacheDownloadRequestUrl({
      originUrl: 'https://imgjump.115.com/?sha1=abc',
      cloudProxyUrl: '',
      userAgent: 'Mozilla/5.0 Test',
    });

    expect(result).toBe('https://imgjump.115.com/?sha1=abc');
  });
});
