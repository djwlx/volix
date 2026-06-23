import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  http: {
    post: vi.fn(),
  },
}));

vi.mock('@/utils', () => ({
  http: mocked.http,
}));

describe('ai translate service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.http.post.mockResolvedValue({
      data: {
        text: 'Hello',
      },
    });
  });

  it('posts translation payload to the ai translate endpoint', async () => {
    const { translateText } = await import('../user');

    await translateText({
      text: '你好',
      sourceLanguage: 'zh-CN',
      targetLanguage: 'en-US',
    });

    expect(mocked.http.post).toHaveBeenCalledWith('/user/ai/translate', {
      text: '你好',
      sourceLanguage: 'zh-CN',
      targetLanguage: 'en-US',
    });
  });
});
