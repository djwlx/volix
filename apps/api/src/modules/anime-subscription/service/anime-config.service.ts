import type { ServiceAccountConfigItem } from '@volix/types';
import { AppConfigEnum, getConfig } from '../../config';
import { badRequest } from '../../shared/http-handler';

const parseServiceAccountConfig = (raw?: string): ServiceAccountConfigItem | null => {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<ServiceAccountConfigItem>;
    const baseUrl = typeof parsed.baseUrl === 'string' ? parsed.baseUrl.trim() : '';
    const username = typeof parsed.username === 'string' ? parsed.username.trim() : '';
    const password = typeof parsed.password === 'string' ? parsed.password.trim() : '';
    if (!baseUrl || !/^https?:\/\//.test(baseUrl) || !username || !password) {
      return null;
    }
    return {
      baseUrl,
      username,
      password,
    };
  } catch {
    return null;
  }
};

const getServiceAccountConfig = async (key: AppConfigEnum, label: string) => {
  const configData = await getConfig(key);
  const config = parseServiceAccountConfig(configData?.[key]);
  if (!config) {
    badRequest(`${label} 未配置，请先在账号配置中完成设置`);
  }
  return config as NonNullable<typeof config>;
};

export const getQbittorrentAccountConfig = async () => {
  return getServiceAccountConfig(AppConfigEnum.account_qbittorrent, 'qBittorrent');
};

export const getOpenlistAccountConfig = async () => {
  return getServiceAccountConfig(AppConfigEnum.account_openlist, 'OpenList');
};
