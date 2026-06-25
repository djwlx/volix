import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocked = vi.hoisted(() => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
  userService: {
    querySystemSettingByKey: vi.fn(),
    queryUser: vi.fn(),
    upsertSystemSetting: vi.fn(),
  },
  userConfig: {
    normalizeSmtpAccountConfig: vi.fn(),
    parseSmtpAccountConfig: vi.fn(),
  },
}));

vi.mock('../../apps/api/src/utils/logger', () => ({
  log: mocked.logger,
}));

vi.mock('../../apps/api/src/utils/i18n', () => ({
  t: ({ defaultMessage }: { defaultMessage: string }) => defaultMessage,
}));

vi.mock('../../apps/api/src/modules/user/service/user.service', () => mocked.userService);
vi.mock('../../apps/api/src/modules/user/service/user-config.service', () => mocked.userConfig);

describe('system setting service diagnostics', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    mocked.userConfig.parseSmtpAccountConfig.mockReturnValue(null);
    mocked.userConfig.normalizeSmtpAccountConfig.mockImplementation((value: unknown) => value);
  });

  it('logs the persisted log retention value after saving', async () => {
    mocked.userService.querySystemSettingByKey.mockResolvedValueOnce(null);
    mocked.userService.upsertSystemSetting.mockResolvedValue(undefined);
    mocked.userService.querySystemSettingByKey.mockResolvedValueOnce({
      dataValues: {
        setting_value: '10',
      },
    });

    const { updateSystemConfigData } = await import('../../apps/api/src/modules/user/service/system-setting.service');

    await updateSystemConfigData({
      registerEmailVerifyEnabled: false,
      randomPicDefaultUserId: '',
      logRetentionDays: 10,
    });

    expect(mocked.logger.info).toHaveBeenCalledWith(
      '系统日志保留天数已落库',
      expect.objectContaining({
        requestedLogRetentionDays: 10,
        persistedLogRetentionDays: 10,
        source: 'database',
      })
    );
  });
});
