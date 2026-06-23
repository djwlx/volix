import { AccountConfigPlatform } from '@volix/types';
import type {
  AccountConfigMap,
  ListAiModelsPayload,
  ListAiModelsResponse,
  TestAccountConfigPayload,
  TranslateTextPayload,
  UpdateAccountConfigPayload,
} from '@volix/types';
import { badRequest, unauthorized } from '../../shared/http-handler';
import { createAiSdk, createBangumiSdk, createOpenlistSdk, createQbittorrentSdk } from '../../../sdk';
import { t } from '../../../utils/i18n';
import {
  getUserAccountConfigs,
  normalizeAiConnection,
  normalizeBangumiAccountConfig,
  normalizeServiceAccountConfig,
  updateUserAccountConfig,
} from '../service/user-config.service';
import { translateUserText } from '../service/ai-translate.service';

const ensureLoginUserId = (ctx: any) => {
  const userId = ctx.state.userInfo?.id;
  if (!userId) {
    unauthorized(t('auth.unauthorized'));
  }
  return userId as string | number;
};

const ensureSupportedPlatform = (platform?: AccountConfigPlatform) => {
  if (!platform || !Object.values(AccountConfigPlatform).includes(platform)) {
    badRequest(t('accountConfig.platform.invalid'));
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
        message: t('accountConfig.test.qbittorrentSuccess'),
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
        message: t('accountConfig.test.openlistSuccess', { username: me.username }),
      };
    }

    if (platform === AccountConfigPlatform.SMTP) {
      badRequest(t('accountConfig.smtp.migrated'));
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
        message: t('accountConfig.test.bangumiSuccess', { username: me.nickname || me.username || 'unknown' }),
      };
    }

    if (platform === AccountConfigPlatform.AI) {
      const { baseUrl, apiKey } = normalizeAiConnection(param.config);
      const sdk = createAiSdk({ baseUrl, apiKey });
      const models = await sdk.listModels();

      return {
        success: true,
        message: t('accountConfig.test.aiSuccess', { count: models.length }),
      };
    }

    badRequest(t('accountConfig.test.unsupported'));
  } catch (error) {
    const message =
      (error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string })
        ?.response?.data?.error?.message ||
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      t('setting.account.connectionFailed');

    const platformLabelMap: Record<AccountConfigPlatform, string> = {
      [AccountConfigPlatform.QBITTORRENT]: 'qBittorrent',
      [AccountConfigPlatform.OPENLIST]: 'OpenList',
      [AccountConfigPlatform.SMTP]: 'SMTP',
      [AccountConfigPlatform.BANGUMI]: 'Bangumi',
      [AccountConfigPlatform.AI]: 'AI',
    };

    badRequest(
      t('accountConfig.test.failed', {
        service: platformLabelMap[platform] || t('accountConfig.service.default'),
        message,
      })
    );
  }
};

export const listAiModels: MyMiddleware = async ctx => {
  ensureLoginUserId(ctx);
  const param = (ctx.request.body || {}) as ListAiModelsPayload;
  const { baseUrl, apiKey } = normalizeAiConnection(param);

  try {
    const sdk = createAiSdk({ baseUrl, apiKey });
    const models = await sdk.listModels();
    const result: ListAiModelsResponse = { models };
    return result;
  } catch (error) {
    const message =
      (error as { response?: { data?: { error?: { message?: string }; message?: string } }; message?: string })
        ?.response?.data?.error?.message ||
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      t('setting.account.connectionFailed');

    badRequest(t('accountConfig.test.failed', { service: 'AI', message }));
  }
};

export const translateText: MyMiddleware = async ctx => {
  const userId = ensureLoginUserId(ctx);
  const payload = (ctx.request.body || {}) as TranslateTextPayload;
  return translateUserText(userId, payload);
};
