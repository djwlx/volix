import type { AxiosRequestConfig } from 'axios';
import request from '../../../utils/request';
import type { CreateKomgaSdkOptions, KomgaOperationDefinition, KomgaOperationInput } from './komga.types';

const normalizeBaseUrl = (baseUrl?: string) => {
  const normalized = String(baseUrl || '')
    .trim()
    .replace(/\/+$/, '');
  if (!normalized || !/^https?:\/\//.test(normalized)) {
    throw new Error('Komga baseUrl must be an http/https URL');
  }
  return normalized;
};

const interpolatePath = (pathTemplate: string, pathParams?: Record<string, string | number>) => {
  return pathTemplate.replace(/\{([^}]+)\}/g, (_, key: string) => {
    const value = pathParams?.[key];
    if (value === undefined || value === null || value === '') {
      throw new Error(`Komga path param is required: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
};

const buildAuthHeaders = (options: CreateKomgaSdkOptions, requiresAuth: boolean) => {
  const apiKey = String(options.apiKey || '').trim();
  if (apiKey) {
    return {
      'X-API-Key': apiKey,
    };
  }

  const username = String(options.username || '').trim();
  const password = String(options.password || '').trim();
  if (username && password) {
    return {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    };
  }

  if (requiresAuth) {
    throw new Error('Komga authentication is required');
  }

  return {};
};

export const createKomgaRequester = (options: CreateKomgaSdkOptions) => {
  const baseURL = normalizeBaseUrl(options.baseUrl);
  const userAgent = String(options.userAgent || '').trim();

  const requestKomga = async <T = unknown>(
    definition: KomgaOperationDefinition,
    input: KomgaOperationInput = {}
  ): Promise<T> => {
    const config: AxiosRequestConfig = {
      baseURL,
      url: interpolatePath(definition.path, input.pathParams),
      method: definition.method,
      params: input.query,
      data: input.body,
      responseType: input.responseType,
      headers: {
        Accept: 'application/json',
        ...(definition.contentType && input.body !== undefined ? { 'Content-Type': definition.contentType } : {}),
        ...(userAgent ? { 'User-Agent': userAgent } : {}),
        ...buildAuthHeaders(options, definition.requiresAuth),
        ...(input.headers || {}),
      },
    };

    const response = await request<T>(config);
    return response.data;
  };

  return {
    requestKomga,
  };
};
