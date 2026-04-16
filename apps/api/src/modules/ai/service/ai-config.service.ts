import { AppConfigEnum } from '../../config/model/config.model';
import { getConfig } from '../../config/service/config.service';
import { badRequest } from '../../shared/http-handler';
import type { InternalAiAccountConfig } from '../types/ai.types';

const parseInternalAiAccountConfig = (raw?: string): InternalAiAccountConfig | null => {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<InternalAiAccountConfig>;
    const baseUrl = typeof parsed.baseUrl === 'string' ? parsed.baseUrl.trim() : '';
    const apiKey = typeof parsed.apiKey === 'string' ? parsed.apiKey.trim() : '';
    const model = typeof parsed.model === 'string' ? parsed.model.trim() : '';

    if (!baseUrl || !/^https?:\/\//.test(baseUrl) || !apiKey || !model) {
      return null;
    }

    return {
      baseUrl,
      apiKey,
      model,
    };
  } catch {
    return null;
  }
};

export const getInternalAiAccountConfig = async (): Promise<InternalAiAccountConfig> => {
  const configData = await getConfig(AppConfigEnum.account_ai);
  const config = parseInternalAiAccountConfig(configData?.[AppConfigEnum.account_ai]);

  if (!config) {
    badRequest('AI 服务未配置，请先在账号配置中填写 baseUrl、apiKey 和 model');
    throw new Error('unreachable');
  }

  return config;
};
