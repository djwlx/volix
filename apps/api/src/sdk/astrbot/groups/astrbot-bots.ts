import type { AstrbotRequest } from '../types';

export interface AstrbotBotListQuery {
  enabled?: boolean;
  type?: string;
}

export const createAstrbotBotMethods = (request: AstrbotRequest) => ({
  listBotTypes: <T = unknown>() => request<T>({ path: '/api/v1/bot-types', requireAuth: true }),
  listBots: <T = unknown>(query?: AstrbotBotListQuery) =>
    request<T>({ path: '/api/v1/bots', params: query as Record<string, unknown>, requireAuth: true }),
  getBotStats: <T = unknown>() => request<T>({ path: '/api/v1/bots/stats', requireAuth: true }),
  createBot: <T = unknown>(body: Record<string, unknown>) =>
    request<T>({ path: '/api/v1/bots', method: 'POST', data: body, requireAuth: true }),
  getBot: <T = unknown>(botId: string) =>
    request<T>({ path: `/api/v1/bots/${encodeURIComponent(botId)}`, requireAuth: true }),
  updateBot: <T = unknown>(botId: string, body: Record<string, unknown>) =>
    request<T>({ path: `/api/v1/bots/${encodeURIComponent(botId)}`, method: 'PUT', data: body, requireAuth: true }),
  deleteBot: <T = unknown>(botId: string) =>
    request<T>({ path: `/api/v1/bots/${encodeURIComponent(botId)}`, method: 'DELETE', requireAuth: true }),
  setBotEnabled: <T = unknown>(botId: string, enabled: boolean) =>
    request<T>({
      path: `/api/v1/bots/${encodeURIComponent(botId)}/enabled`,
      method: 'PATCH',
      data: { enabled },
      requireAuth: true,
    }),
  testBot: <T = unknown>(botId: string) =>
    request<T>({ path: `/api/v1/bots/${encodeURIComponent(botId)}/test`, method: 'POST', requireAuth: true }),
});
