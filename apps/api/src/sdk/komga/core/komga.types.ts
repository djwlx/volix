import type { AxiosRequestConfig, Method } from 'axios';

export interface KomgaAccountConfigItem {
  baseUrl: string;
  username?: string;
  password?: string;
  apiKey?: string;
}

export interface CreateKomgaSdkOptions extends KomgaAccountConfigItem {
  userAgent?: string;
}

export interface KomgaOperationDefinition {
  method: Method;
  path: string;
  tag: string;
  requiresAuth: boolean;
  pathParams: string[];
  contentType?: string;
}

export type KomgaOperationDefinitionMap = Record<string, KomgaOperationDefinition>;

export interface KomgaOperationInput {
  pathParams?: Record<string, string | number>;
  query?: Record<string, unknown>;
  body?: unknown;
  headers?: Record<string, string>;
  responseType?: AxiosRequestConfig['responseType'];
}
