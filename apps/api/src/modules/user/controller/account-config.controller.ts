import { AccountConfigPlatform } from '@volix/types';
import type { AccountConfigMap, TestAccountConfigPayload, UpdateAccountConfigPayload } from '@volix/types';
import { badRequest, unauthorized } from '../../shared/http-handler';
import { createBangumiSdk, createOpenlistSdk, createQbittorrentSdk } from '../../../sdk';
import {
  getUserAccountConfigs,
  normalizeBangumiAccountConfig,
  normalizeServiceAccountConfig,
  updateUserAccountConfig,
} from '../service/user-config.service';

const ensureLoginUserId = (ctx: any) => {
  const userId = ctx.state.userInfo?.id;
  if (!userId) {
    unauthorized('未登录');
  }
  return userId as string | number;
};

const ensureSupportedPlatform = (platform?: AccountConfigPlatform) => {
  if (!platform || !Object.values(AccountConfigPlatform).includes(platform)) {
    badRequest('platform 参数错误');
  }
};

export const getAccountConfigs: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const result: AccountConfigMap = await getUserAccountConfigs(userId);
  return result;
};

export const updateAccountConfig: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const param = (ctx.request.body || {}) as UpdateAccountConfigPayload;
  const platform = param.platform;
  ensureSupportedPlatform(platform);

  const config = await updateUserAccountConfig(userId, platform, param.config);
  return {
    platform,
    config,
  };
};

export const testAccountConfig: MyMiddleware = async ctx => {
  ensureLoginUserId(ctx);
  const param = (ctx.request.body || {}) as TestAccountConfigPayload;
  const platform = param.platform;
  ensureSupportedPlatform(platform);

  try {
    if (platform === AccountConfigPlatform.QBITTORRENT) {
      const config = normalizeServiceAccountConfig(param.config);
      const sdk = createQbittorrentSdk({
        apiHost: config.baseUrl,
        username: config.username,
        password: config.password,
      });

      await sdk.getTorrentList();

      return {
        success: true,
        message: 'qBittorrent 联通成功',
      };
    }

    if (platform === AccountConfigPlatform.OPENLIST) {
      const config = normalizeServiceAccountConfig(param.config);
      const sdk = createOpenlistSdk({
        apiHost: config.baseUrl,
      });

      await sdk.loginWithHashedPassword(config.username, config.password);
      const me = await sdk.getMe();

      return {
        success: true,
        message: `OpenList 联通成功，当前账号：${me.username}`,
      };
    }

    if (platform === AccountConfigPlatform.SMTP) {
      badRequest('SMTP 已迁移到系统配置，不再支持个人账号配置');
    }

    if (platform === AccountConfigPlatform.BANGUMI) {
      const config = normalizeBangumiAccountConfig(param.config);
      const sdk = createBangumiSdk({
        apiHost: config.baseUrl,
        accessToken: config.accessToken,
        userAgent: String(ctx.request.headers['user-agent'] || '').trim() || undefined,
      });
      const me = (await sdk.getMyself()) as { username?: string; nickname?: string };

      return {
        success: true,
        message: `Bangumi 联通成功，当前用户：${me.nickname || me.username || 'unknown'}`,
      };
    }

    badRequest('当前平台暂不支持联通性测试');
  } catch (error) {
    const message =
      (error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string })
        ?.response?.data?.error?.message ||
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      '联通失败';

    const platformLabelMap: Record<AccountConfigPlatform, string> = {
      [AccountConfigPlatform.QBITTORRENT]: 'qBittorrent',
      [AccountConfigPlatform.OPENLIST]: 'OpenList',
      [AccountConfigPlatform.SMTP]: 'SMTP',
      [AccountConfigPlatform.BANGUMI]: 'Bangumi',
    };

    badRequest(`${platformLabelMap[platform] || '服务'}联通失败: ${message}`);
  }
};
