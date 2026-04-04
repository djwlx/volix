import type { ResponseData } from '@volix/types';
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';
import { getAuthToken, getTokenHeaderKey, clearAuthToken } from './auth';

const instance: AxiosInstance = axios.create({
  baseURL: `/api`,
});

instance.interceptors.request.use(config => {
  const token = getAuthToken();
  if (token) {
    config.headers = config.headers || {};
    (config.headers as Record<string, string>)[getTokenHeaderKey()] = token;
  }
  return config;
});

// 返回时直接取 data，简化调用方处理
instance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  error => {
    // 处理 401/403 未授权错误
    if (error?.response?.status === 401 || error?.response?.status === 403) {
      clearAuthToken();
      // 跳转到登录页（不能修改 location，由路由层处理）
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

type Http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<ResponseData<T>>;
  post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ResponseData<T>>;
  put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<ResponseData<T>>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<ResponseData<T>>;
  request<T>(config: AxiosRequestConfig): Promise<ResponseData<T>>;
};

const http: Http = {
  get(url, config) {
    return instance.get(url, config);
  },
  post(url, data?, config?) {
    return instance.post(url, data, config);
  },
  put(url, data?, config?) {
    return instance.put(url, data, config);
  },
  delete(url, config?) {
    return instance.delete(url, config);
  },
  request(config) {
    return instance.request(config);
  },
};

export { http };
