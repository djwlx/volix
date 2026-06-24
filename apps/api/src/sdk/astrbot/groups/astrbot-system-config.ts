import type { AstrbotRequest } from '../types';

export const createAstrbotSystemConfigMethods = (request: AstrbotRequest) => ({
  getSystemConfigSchema: <T = unknown>() => request<T>({ path: '/api/v1/system-config/schema' }),
  getSystemConfig: <T = unknown>() => request<T>({ path: '/api/v1/system-config' }),
  replaceSystemConfig: <T = unknown>(body: Record<string, unknown>) =>
    request<T>({ path: '/api/v1/system-config', method: 'PUT', data: body, requireAuth: true }),
  getSystemConfigRuntime: <T = unknown>() => request<T>({ path: '/api/v1/system-config/runtime' }),
});
