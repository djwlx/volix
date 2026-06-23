import { beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '../../apps/api/src/modules/shared/http-handler';

const mocked = vi.hoisted(() => ({
  createUserAiSdk: vi.fn(),
  chat: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/user/service/user-config.service', () => ({
  createUserAiSdk: mocked.createUserAiSdk,
}));

describe('user ai translate controller', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocked.chat.mockResolvedValue('Hello');
    mocked.createUserAiSdk.mockResolvedValue({
      sdk: {
        chat: mocked.chat,
      },
      config: {
        provider: 'openai',
        baseUrl: 'https://api.openai.com/v1',
        apiKey: 'secret',
        model: 'gpt-4.1-mini',
      },
    });
  });

  it('rejects unauthenticated requests', async () => {
    const { translateText } = await import('../../apps/api/src/modules/user/controller/account-config.controller');

    await expect(
      translateText({
        state: {},
        request: {
          body: {
            text: '你好',
            sourceLanguage: 'zh-CN',
            targetLanguage: 'en-US',
          },
        },
      } as never)
    ).rejects.toMatchObject({
      status: 401,
    } satisfies Partial<HttpError>);
  });

  it('rejects missing target language', async () => {
    const { translateText } = await import('../../apps/api/src/modules/user/controller/account-config.controller');

    await expect(
      translateText({
        state: {
          userInfo: {
            id: 1,
          },
        },
        request: {
          body: {
            text: '你好',
            sourceLanguage: 'zh-CN',
          },
        },
      } as never)
    ).rejects.toMatchObject({
      status: 400,
    } satisfies Partial<HttpError>);
  });

  it('rejects missing ai config', async () => {
    mocked.createUserAiSdk.mockRejectedValueOnce(new HttpError(400, 'AI account not configured'));
    const { translateText } = await import('../../apps/api/src/modules/user/controller/account-config.controller');

    await expect(
      translateText({
        state: {
          userInfo: {
            id: 1,
          },
        },
        request: {
          body: {
            text: '你好',
            sourceLanguage: 'zh-CN',
            targetLanguage: 'en-US',
          },
        },
      } as never)
    ).rejects.toMatchObject({
      status: 400,
    } satisfies Partial<HttpError>);
  });

  it('returns translated text from the sdk response', async () => {
    const { translateText } = await import('../../apps/api/src/modules/user/controller/account-config.controller');

    await expect(
      translateText({
        state: {
          userInfo: {
            id: 1,
          },
        },
        request: {
          body: {
            text: '你好',
            sourceLanguage: 'zh-CN',
            targetLanguage: 'en-US',
          },
        },
      } as never)
    ).resolves.toEqual({
      text: 'Hello',
    });
  });
});
