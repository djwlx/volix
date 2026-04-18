import type { ServiceAccountConfigItem } from '@volix/types';
import { AppConfigEnum } from '../../../config/model/config.model';
import { getConfig } from '../../../config/service/config.service';
import { badRequest } from '../../../shared/http-handler';
import type { AiInternalToolDefinition } from '../ai-internal-tool.types';

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

export const resolveConfigForExecution = async <T = unknown>(key: AppConfigEnum): Promise<T> => {
  const configData = await getConfig(key);
  const raw = configData?.[key];
  if (!raw) {
    badRequest(`缺少配置: ${key}`);
  }

  if (
    key === AppConfigEnum.account_qbittorrent ||
    key === AppConfigEnum.account_openlist ||
    key === AppConfigEnum.account_ai ||
    key === AppConfigEnum.account_smtp ||
    key === AppConfigEnum.account_bangumi
  ) {
    return JSON.parse(raw as string) as T;
  }

  return raw as T;
};

export const buildConfigInternalTools = (): AiInternalToolDefinition[] => {
  return [
    {
      name: 'config.get_masked',
      description: '读取指定配置项的脱敏结果。',
      category: 'config',
      riskLevel: 'read',
      requiresApproval: false,
      hiddenFromFrontend: true,
      inputSchema: {
        key: 'string',
      },
      execute: async (_context, input) => {
        const key = String(input.key || '').trim() as AppConfigEnum;
        const configData = await getConfig(key);
        const raw = configData?.[key];
        if (!raw) {
          badRequest(`缺少配置: ${key}`);
        }

        const parsedAccount = parseServiceAccountConfig(raw);
        const internalResult = parsedAccount || raw;
        return {
          internalResult,
          modelResult: internalResult,
          frontendResult: internalResult,
        };
      },
    },
  ];
};
