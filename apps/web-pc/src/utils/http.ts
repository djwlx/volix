import type { ResponseData } from '@volix/types';
import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

const instance: AxiosInstance = axios.create({
  baseURL: `/api`,
});

// 返回时直接取 data，简化调用方处理
instance.interceptors.response.use(
  (response: AxiosResponse) => response.data,
  error => Promise.reject(error)
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
