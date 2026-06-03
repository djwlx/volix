import { describe, expect, it, vi } from 'vitest';
import { requestPicCacheDownloadStream } from './picture-cache-download';

describe('picture cache download', () => {
  it('retries transient proxy download failures and returns the later stream response', async () => {
    const response = {
      data: {
        pipe: vi.fn(),
      },
    };
    const requestGet = vi
      .fn()
      .mockRejectedValueOnce(Object.assign(new Error('read ECONNRESET'), { code: 'ECONNRESET' }))
      .mockResolvedValueOnce(response);

    const result = await requestPicCacheDownloadStream({
      requestUrl: 'https://proxy.example.com/?url=https%3A%2F%2F115cdn.example.com%2Ftest.jpg',
      userAgent: 'Mozilla/5.0 Test',
      requestGet,
      retryDelayMs: 0,
    });

    expect(result).toBe(response);
    expect(requestGet).toHaveBeenCalledTimes(2);
    expect(requestGet).toHaveBeenNthCalledWith(
      1,
      'https://proxy.example.com/?url=https%3A%2F%2F115cdn.example.com%2Ftest.jpg',
      expect.objectContaining({
        responseType: 'stream',
        muteErrorLog: true,
      })
    );
  });

  it('does not retry non-retryable failures', async () => {
    const requestGet = vi.fn().mockRejectedValueOnce(
      Object.assign(new Error('forbidden'), {
        response: {
          status: 403,
        },
      })
    );

    await expect(
      requestPicCacheDownloadStream({
        requestUrl: 'https://proxy.example.com/?url=https%3A%2F%2F115cdn.example.com%2Ftest.jpg',
        userAgent: 'Mozilla/5.0 Test',
        requestGet,
        retryDelayMs: 0,
      })
    ).rejects.toThrow('forbidden');

    expect(requestGet).toHaveBeenCalledTimes(1);
  });
});
