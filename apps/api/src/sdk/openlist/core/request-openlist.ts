import { createHash } from 'crypto';
import type { AxiosRequestConfig } from 'axios';
import request from '../../../utils/request';
import { getRequestUserAgent } from '../../../utils/request-context';
import type { CreateOpenlistSdkOptions, OpenlistApiResponse, OpenlistPaginationReq } from './openlist.types';

const OPENLIST_HASH_SUFFIX = '-https://github.com/alist-org/alist';
const OPENLIST_MIN_REQUEST_INTERVAL_MS = 1000;

let openlistRequestQueue = Promise.resolve();
let lastOpenlistRequestAt = 0;

const waitTime = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const runOpenlistSerialRequest = async <T>(runner: () => Promise<T>, minRequestIntervalMs: number) => {
  const task = async () => {
    const waitMs = Math.max(0, lastOpenlistRequestAt + minRequestIntervalMs - Date.now());
    if (waitMs > 0) {
      await waitTime(waitMs);
    }
    try {
      return await runner();
    } finally {
      lastOpenlistRequestAt = Date.now();
    }
  };

  const pending = openlistRequestQueue.then(task, task);
  openlistRequestQueue = pending.then(
    () => undefined,
    () => undefined
  );
  return pending;
};

const stripHtml = (value: string) =>
  String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const summarizeOpenlistError = (error: unknown) => {
  const responseStatus = (error as { response?: { status?: number } })?.response?.status;
  const responseData = (error as { response?: { data?: unknown } })?.response?.data;
  const responseMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  const rawMessage = responseMessage || (error as Error)?.message || 'OpenList 请求失败';
  const rawText =
    typeof responseData === 'string'
      ? responseData
      : typeof rawMessage === 'string'
      ? rawMessage
      : JSON.stringify(responseData || rawMessage);

  if (/<!doctype|<html/i.test(rawText)) {
    const plainText = stripHtml(rawText);
    if (/blocked|拦截|威胁|security/i.test(plainText)) {
      return `OpenList 上游触发了访问限制${responseStatus ? `（HTTP ${responseStatus}）` : ''}，请稍后再试`;
    }
    return `OpenList 返回了异常页面${responseStatus ? `（HTTP ${responseStatus}）` : ''}`;
  }

  return rawMessage;
};

export const toSnakePageReq = (params?: OpenlistPaginationReq) => ({
  page: params?.page ?? 1,
  per_page: params?.perPage ?? 20,
});

export const hashOpenlistPassword = (plainPassword: string) => {
  return createHash('sha256').update(`${plainPassword}${OPENLIST_HASH_SUFFIX}`).digest('hex');
};

export interface RequestOpenlistOptions extends CreateOpenlistSdkOptions {}

export type RequestOpenlist = <T>(config: AxiosRequestConfig, needAuth?: boolean) => Promise<T>;

export function createRequestOpenlist(options: RequestOpenlistOptions) {
  const normalizedHost = options.apiHost.replace(/\/+$/, '');
  let token = options.token || '';
  const userAgent = String(options.userAgent || getRequestUserAgent() || '').trim();
  const minRequestIntervalMs =
    typeof options.minRequestIntervalMs === 'number' && options.minRequestIntervalMs >= 0
      ? options.minRequestIntervalMs
      : OPENLIST_MIN_REQUEST_INTERVAL_MS;

  const getToken = () => token;
  const setToken = (nextToken?: string) => {
    token = (nextToken || '').trim();
  };
  const clearToken = () => {
    token = '';
  };

  const requestOpenlist: RequestOpenlist = async <T>(config: AxiosRequestConfig, needAuth = true) => {
    if (needAuth && !token) {
      throw new Error('OpenList token 不存在，请先登录');
    }

    let result;
    try {
      result = await runOpenlistSerialRequest(
        () =>
          request<OpenlistApiResponse<T>>({
            ...config,
            baseURL: normalizedHost,
            headers: {
              ...(config.data ? { 'Content-Type': 'application/json' } : {}),
              ...(userAgent ? { 'User-Agent': userAgent } : {}),
              ...(needAuth ? { Authorization: token } : {}),
              ...(config.headers || {}),
            },
          }),
        minRequestIntervalMs
      );
    } catch (error) {
      throw new Error(summarizeOpenlistError(error));
    }

    const data = result.data;
    if (!data || data.code !== 200) {
      throw new Error(data?.message || 'OpenList 请求失败');
    }
    return data.data;
  };

  return {
    getToken,
    setToken,
    clearToken,
    requestOpenlist,
  };
}
