import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AppConfigEnum } from '../../apps/api/src/modules/config/model/config.model';
import { buildBangumiInternalTools } from '../../apps/api/src/modules/ai/service/ai-internal-tool-builtins/bangumi-tools';

const mocked = vi.hoisted(() => ({
  getConfig: vi.fn(),
  request: vi.fn(),
}));

vi.mock('../../apps/api/src/modules/config/service/config.service', () => ({
  getConfig: mocked.getConfig,
}));

vi.mock('../../apps/api/src/utils/request', () => ({
  default: mocked.request,
}));

describe('ai bangumi tools', () => {
  beforeEach(() => {
    mocked.getConfig.mockReset();
    mocked.request.mockReset();
    mocked.getConfig.mockResolvedValue({
      [AppConfigEnum.account_bangumi]: JSON.stringify({
        baseUrl: 'https://api.bgm.tv',
        accessToken: 'bangumi-token',
      }),
    });
  });

  test('bangumi get me tool uses default user agent', async () => {
    mocked.request.mockResolvedValue({
      data: {
        username: 'test-user',
      },
    });

    const tool = buildBangumiInternalTools().find(item => item.name === 'bangumi.get_me');
    const result = await tool!.execute(
      {
        user: { id: '1', role: 'admin' as any },
      },
      {}
    );

    expect(result.internalResult).toMatchObject({ username: 'test-user' });
    expect(mocked.request).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'djwl/volix',
        }),
      })
    );
  });

  test('bangumi write tool requires approval', () => {
    const tool = buildBangumiInternalTools().find(item => item.name === 'bangumi.request_write');
    expect(tool?.requiresApproval).toBe(true);
    expect(tool?.riskLevel).toBe('write_high');
  });
});
