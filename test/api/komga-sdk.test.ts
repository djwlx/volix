import { describe, expect, it, vi } from 'vitest';

const requestMock = vi.fn();

vi.mock('../../apps/api/src/utils/request', () => ({
  default: requestMock,
}));

describe('komga sdk', () => {
  it('builds the generated operation surface and prefers api key auth', async () => {
    requestMock.mockResolvedValue({ data: { id: 'user-1' } });

    const { createKomgaSdk } = await import('../../apps/api/src/sdk');
    const sdk = createKomgaSdk({
      baseUrl: 'https://komga.example.com/',
      apiKey: 'secret-api-key',
      username: 'demo',
      password: 'pass',
    });

    await sdk.getCurrentUser();
    await sdk.getBookById({ pathParams: { bookId: 'book-1' } });

    expect(Object.keys(sdk.operationDefinitions)).toHaveLength(165);
    expect(requestMock).toHaveBeenCalledTimes(2);
    expect(requestMock.mock.calls[0][0]).toMatchObject({
      baseURL: 'https://komga.example.com',
      method: 'GET',
      url: '/api/v2/users/me',
      headers: expect.objectContaining({
        'X-API-Key': 'secret-api-key',
      }),
    });
    expect(requestMock.mock.calls[0][0].headers.Authorization).toBeUndefined();
    expect(requestMock.mock.calls[1][0].url).toContain('/book-1');
  });

  it('falls back to basic auth when api key is absent', async () => {
    requestMock.mockResolvedValue({ data: { id: 'user-1' } });

    const { createKomgaSdk } = await import('../../apps/api/src/sdk');
    const sdk = createKomgaSdk({
      baseUrl: 'https://komga.example.com',
      username: 'reader',
      password: 'reader-pass',
    });

    await sdk.getCurrentUser();

    expect(requestMock.mock.calls.at(-1)?.[0]).toMatchObject({
      headers: expect.objectContaining({
        Authorization: `Basic ${Buffer.from('reader:reader-pass').toString('base64')}`,
      }),
    });
  });
});
