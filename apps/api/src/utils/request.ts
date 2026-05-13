import axios from 'axios';
import type { AxiosError } from 'axios';
import http from 'http';
import https from 'https';
import { log } from './logger';

export function getCookieValue(cookie: string, name: string) {
  return (
    cookie
      .split('; ')
      .find(row => row.startsWith(name + '='))
      ?.split('=')[1] || null
  );
}

const request = axios.create({
  httpAgent: new http.Agent({
    keepAlive: true,
    maxSockets: 64,
  }),
  httpsAgent: new https.Agent({
    keepAlive: true,
    maxSockets: 64,
    rejectUnauthorized: false,
  }),
});

const requestStartTimeMap = new WeakMap<object, number>();

request.interceptors.request.use(config => {
  requestStartTimeMap.set(config, Date.now());
  return config;
});

request.interceptors.response.use(
  response => {
    requestStartTimeMap.delete(response.config);
    return response;
  },
  (error: AxiosError) => {
    const startedAt = error.config ? requestStartTimeMap.get(error.config) : undefined;
    if (error.config) {
      requestStartTimeMap.delete(error.config);
    }

    const method = String(error.config?.method || 'get').toUpperCase();
    const path = String(error.config?.url || '');
    const baseURL = String(error.config?.baseURL || '');
    const url = `${baseURL}${path}`;

    log.error('[http-client] 请求失败', {
      method,
      url,
      status: error.response?.status,
      durationMs: startedAt ? Date.now() - startedAt : undefined,
      message: error.message,
    });

    return Promise.reject(error);
  }
);

export default request;
