import type { AxiosRequestConfig } from 'axios';
import request from '../../utils/request';

export interface CreateAiSdkOptions {
  baseUrl: string;
  apiKey?: string;
}

interface OpenAiModelListResponse {
  data?: Array<{ id?: string }>;
}

const normalizeBaseUrl = (baseUrl: string) =>
  String(baseUrl || '')
    .trim()
    .replace(/\/+$/, '');

export function createAiSdk(options: CreateAiSdkOptions) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const apiKey = String(options.apiKey || '').trim();

  const listModels = async (): Promise<string[]> => {
    const config: AxiosRequestConfig = {
      baseURL: baseUrl,
      url: '/models',
      method: 'GET',
      timeout: 15000,
      headers: {
        Accept: 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
    };

    const response = await request<OpenAiModelListResponse>(config);
    const list = Array.isArray(response.data?.data) ? response.data.data : [];
    return list.map(item => String(item?.id || '').trim()).filter(Boolean);
  };

  return {
    baseUrl,
    listModels,
  };
}

export type AiSdk = ReturnType<typeof createAiSdk>;
