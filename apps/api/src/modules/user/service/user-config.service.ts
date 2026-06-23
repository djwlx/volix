import { AccountConfigPlatform, AiProvider } from '@volix/types';
import type {
  AccountConfigMap,
  AiAccountConfigItem,
  BangumiAccountConfigItem,
  SmtpAccountConfigItem,
  ServiceAccountConfigItem,
} from '@volix/types';
import { badRequest } from '../../shared/http-handler';
import { decryptSecret, encryptSecret } from '../../../utils/crypto-store';
import { t } from '../../../utils/i18n';
import { createAiSdk, type AiSdk } from '../../../sdk';
import { queryUser, updateUser } from './user.service';

const EMAIL_REGEXP = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeServiceAccountConfig = (config: unknown): ServiceAccountConfigItem => {
  if (!config || typeof config !== 'object') {
    badRequest('配置格式错误');
  }

  const raw = config as Partial<ServiceAccountConfigItem>;
  const baseUrl = typeof raw.baseUrl === 'string' ? raw.baseUrl.trim() : '';
  const username = typeof raw.username === 'string' ? raw.username.trim() : '';
  const password = typeof raw.password === 'string' ? raw.password.trim() : '';

  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    badRequest('baseUrl 必须是 http/https 地址');
  }
  if (!username) {
    badRequest('username 不能为空');
  }
  if (!password) {
    badRequest('password 不能为空');
  }

  return {
    baseUrl,
    username,
    password,
  };
};

export const normalizeSmtpAccountConfig = (config: unknown): SmtpAccountConfigItem => {
  if (!config || typeof config !== 'object') {
    badRequest('SMTP 配置格式错误');
  }
  const raw = config as Partial<SmtpAccountConfigItem>;
  const host = typeof raw.host === 'string' ? raw.host.trim() : '';
  const port = typeof raw.port === 'number' ? raw.port : Number(raw.port);
  const secure = Boolean(raw.secure);
  const username = typeof raw.username === 'string' ? raw.username.trim() : '';
  const password = typeof raw.password === 'string' ? raw.password.trim() : '';
  const fromEmail = typeof raw.fromEmail === 'string' ? raw.fromEmail.trim() : '';

  if (!host) {
    badRequest('SMTP host 不能为空');
  }
  if (!Number.isFinite(port) || port <= 0 || port > 65535) {
    badRequest('SMTP port 非法');
  }
  if (!username) {
    badRequest('SMTP username 不能为空');
  }
  if (!password) {
    badRequest('SMTP password 不能为空');
  }
  if (!EMAIL_REGEXP.test(fromEmail)) {
    badRequest('SMTP 发件邮箱格式错误');
  }

  return {
    host,
    port,
    secure,
    username,
    password,
    fromEmail,
  };
};

export const normalizeBangumiAccountConfig = (config: unknown): BangumiAccountConfigItem => {
  if (!config || typeof config !== 'object') {
    badRequest('Bangumi 配置格式错误');
  }

  const raw = config as Partial<BangumiAccountConfigItem>;
  const baseUrl = typeof raw.baseUrl === 'string' ? raw.baseUrl.trim() : '';
  const accessToken = typeof raw.accessToken === 'string' ? raw.accessToken.trim() : '';

  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    badRequest('Bangumi baseUrl 必须是 http/https 地址');
  }
  if (!accessToken) {
    badRequest('Bangumi accessToken 不能为空');
  }

  return {
    baseUrl,
    accessToken,
  };
};

export const normalizeAiConnection = (config: unknown): { baseUrl: string; apiKey: string } => {
  if (!config || typeof config !== 'object') {
    badRequest(t('accountConfig.ai.invalidConfig'));
  }

  const raw = config as Partial<AiAccountConfigItem>;
  const baseUrl = typeof raw.baseUrl === 'string' ? raw.baseUrl.trim() : '';
  const apiKey = typeof raw.apiKey === 'string' ? raw.apiKey.trim() : '';

  if (!baseUrl || !/^https?:\/\//.test(baseUrl)) {
    badRequest(t('accountConfig.ai.invalidBaseUrl'));
  }
  if (!apiKey) {
    badRequest(t('accountConfig.ai.missingApiKey'));
  }

  return { baseUrl, apiKey };
};

export const normalizeAiAccountConfig = (config: unknown): AiAccountConfigItem => {
  const { baseUrl, apiKey } = normalizeAiConnection(config);
  const raw = config as Partial<AiAccountConfigItem>;
  const provider = Object.values(AiProvider).includes(raw.provider as AiProvider)
    ? (raw.provider as AiProvider)
    : AiProvider.CUSTOM;
  const model = typeof raw.model === 'string' ? raw.model.trim() : '';

  if (!model) {
    badRequest(t('accountConfig.ai.missingModel'));
  }

  return {
    provider,
    baseUrl,
    apiKey,
    model,
  };
};

export const parseServiceAccountConfig = (raw?: string): ServiceAccountConfigItem | null => {
  if (!raw) {
    return null;
  }
  try {
    return normalizeServiceAccountConfig(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const parseSmtpAccountConfig = (raw?: string): SmtpAccountConfigItem | null => {
  if (!raw) {
    return null;
  }
  try {
    return normalizeSmtpAccountConfig(JSON.parse(raw));
  } catch {
    return null;
  }
};

export const parseBangumiAccountConfig = (raw?: string): BangumiAccountConfigItem | null => {
  if (!raw) {
    return null;
  }
  try {
    return normalizeBangumiAccountConfig(JSON.parse(raw));
  } catch {
    return null;
  }
};

type AccountListData = Partial<Record<AccountConfigPlatform, unknown>>;

const parseAccountList = (raw?: string): AccountListData => {
  if (!raw) {
    return {};
  }
  try {
    const parsed = JSON.parse(decryptSecret(raw)) as AccountListData;
    if (!parsed || typeof parsed !== 'object') {
      return {};
    }
    return parsed;
  } catch {
    return {};
  }
};

const parseServiceAccountConfigFromUnknown = (raw: unknown): ServiceAccountConfigItem | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  try {
    return normalizeServiceAccountConfig(raw);
  } catch {
    return null;
  }
};

const parseBangumiAccountConfigFromUnknown = (raw: unknown): BangumiAccountConfigItem | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  try {
    return normalizeBangumiAccountConfig(raw);
  } catch {
    return null;
  }
};

const parseAiAccountConfigFromUnknown = (raw: unknown): AiAccountConfigItem | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  try {
    return normalizeAiAccountConfig(raw);
  } catch {
    return null;
  }
};

const normalizeByPlatform = (platform: AccountConfigPlatform, config: unknown) => {
  if (platform === AccountConfigPlatform.SMTP) {
    return normalizeSmtpAccountConfig(config);
  }
  if (platform === AccountConfigPlatform.BANGUMI) {
    return normalizeBangumiAccountConfig(config);
  }
  if (platform === AccountConfigPlatform.AI) {
    return normalizeAiAccountConfig(config);
  }
  return normalizeServiceAccountConfig(config);
};

export async function getUserAccountConfigs(userId: string | number): Promise<AccountConfigMap> {
  const user = await queryUser({ id: userId });
  if (!user) {
    badRequest('用户不存在');
    throw new Error('用户不存在');
  }

  const accountList = parseAccountList(user.dataValues.account_list);

  return {
    qbittorrent: parseServiceAccountConfigFromUnknown(accountList[AccountConfigPlatform.QBITTORRENT]) || undefined,
    openlist: parseServiceAccountConfigFromUnknown(accountList[AccountConfigPlatform.OPENLIST]) || undefined,
    bangumi: parseBangumiAccountConfigFromUnknown(accountList[AccountConfigPlatform.BANGUMI]) || undefined,
    ai: parseAiAccountConfigFromUnknown(accountList[AccountConfigPlatform.AI]) || undefined,
  };
}

export async function updateUserAccountConfig(
  userId: string | number,
  platform: AccountConfigPlatform,
  config: unknown
) {
  if (platform === AccountConfigPlatform.SMTP) {
    badRequest('SMTP 已迁移到系统配置，不再支持个人账号配置');
  }
  if (!Object.values(AccountConfigPlatform).includes(platform)) {
    badRequest('platform 参数错误');
  }

  const normalized = normalizeByPlatform(platform, config);
  const user = await queryUser({ id: userId });
  if (!user) {
    badRequest('用户不存在');
  }
  const accountList = parseAccountList(user?.dataValues.account_list);
  accountList[platform] = normalized;
  await updateUser(userId, {
    account_list: encryptSecret(JSON.stringify(accountList)),
  });

  return normalized;
}

export async function getUserAiConfig(userId: string | number): Promise<AiAccountConfigItem | null> {
  const configs = await getUserAccountConfigs(userId);
  return configs.ai || null;
}

export async function createUserAiSdk(userId: string | number): Promise<{ sdk: AiSdk; config: AiAccountConfigItem }> {
  const config = await getUserAiConfig(userId);
  if (!config) {
    badRequest(t('accountConfig.ai.notConfigured'));
    throw new Error('AI account not configured');
  }

  const sdk = createAiSdk({
    baseUrl: config.baseUrl,
    apiKey: config.apiKey,
    model: config.model,
  });

  return { sdk, config };
}
