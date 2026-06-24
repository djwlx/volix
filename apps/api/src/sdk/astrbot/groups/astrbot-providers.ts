import type { AstrbotRequest } from '../types';

export interface AstrbotProviderListQuery {
  capability?: string;
  source_id?: string;
  enabled?: boolean;
}

export const createAstrbotProviderMethods = (request: AstrbotRequest) => ({
  getProviderSchema: <T = unknown>() => request<T>({ path: '/api/v1/providers/schema', requireAuth: true }),
  listProviders: <T = unknown>(query?: AstrbotProviderListQuery) =>
    request<T>({ path: '/api/v1/providers', params: query as Record<string, unknown>, requireAuth: true }),
  createProvider: <T = unknown>(body: Record<string, unknown>) =>
    request<T>({ path: '/api/v1/providers', method: 'POST', data: body, requireAuth: true }),
  getProvider: <T = unknown>(providerId: string, merged?: boolean) =>
    request<T>({
      path: `/api/v1/providers/${encodeURIComponent(providerId)}`,
      params: merged === undefined ? undefined : { merged },
      requireAuth: true,
    }),
  updateProvider: <T = unknown>(providerId: string, body: Record<string, unknown>) =>
    request<T>({
      path: `/api/v1/providers/${encodeURIComponent(providerId)}`,
      method: 'PUT',
      data: body,
      requireAuth: true,
    }),
  deleteProvider: <T = unknown>(providerId: string, body?: Record<string, unknown>) =>
    request<T>({
      path: `/api/v1/providers/${encodeURIComponent(providerId)}`,
      method: 'DELETE',
      data: body,
      requireAuth: true,
    }),
  setProviderEnabled: <T = unknown>(providerId: string, enabled: boolean) =>
    request<T>({
      path: `/api/v1/providers/${encodeURIComponent(providerId)}/enabled`,
      method: 'PATCH',
      data: { enabled },
      requireAuth: true,
    }),
  testProvider: <T = unknown>(providerId: string) =>
    request<T>({
      path: `/api/v1/providers/${encodeURIComponent(providerId)}/test`,
      method: 'POST',
      requireAuth: true,
    }),
});
