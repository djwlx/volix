import type { AstrbotMessageContent, AstrbotRequest } from '../types';

export interface AstrbotChatRequest {
  message: AstrbotMessageContent;
  // username 为 chat 接口必填（调用方声明的 WebChat 用户标识，参与权限判断）
  username: string;
  session_id?: string;
  conversation_id?: string;
  config_id?: string;
  config_name?: string;
  selected_provider?: string;
  selected_model?: string;
  enable_streaming?: boolean;
  [key: string]: unknown;
}

export interface AstrbotChatSessionListQuery {
  // username 为查询会话必填参数
  username: string;
  page?: number;
  page_size?: number;
}

export const createAstrbotChatMethods = (request: AstrbotRequest) => ({
  sendChatMessage: <T = unknown>(body: AstrbotChatRequest) =>
    request<T>({ path: '/api/v1/chat', method: 'POST', data: body, requireAuth: true }),
  listChatSessions: <T = unknown>(query: AstrbotChatSessionListQuery) =>
    request<T>({
      path: '/api/v1/chat/sessions',
      params: query as unknown as Record<string, unknown>,
      requireAuth: true,
    }),
  createChatSession: <T = unknown>(platformId?: string) =>
    request<T>({
      path: '/api/v1/chat/sessions/new',
      params: platformId ? { platform_id: platformId } : undefined,
      requireAuth: true,
    }),
  getChatSession: <T = unknown>(sessionId: string) =>
    request<T>({ path: `/api/v1/chat/sessions/${encodeURIComponent(sessionId)}`, requireAuth: true }),
  updateChatSession: <T = unknown>(sessionId: string, body: Record<string, unknown>) =>
    request<T>({
      path: `/api/v1/chat/sessions/${encodeURIComponent(sessionId)}`,
      method: 'PATCH',
      data: body,
      requireAuth: true,
    }),
  deleteChatSession: <T = unknown>(sessionId: string) =>
    request<T>({
      path: `/api/v1/chat/sessions/${encodeURIComponent(sessionId)}`,
      method: 'DELETE',
      requireAuth: true,
    }),
  batchDeleteChatSessions: <T = unknown>(sessionIds: string[]) =>
    request<T>({
      path: '/api/v1/chat/sessions/batch-delete',
      method: 'POST',
      data: { session_ids: sessionIds },
      requireAuth: true,
    }),
  stopChatSession: <T = unknown>(sessionId: string) =>
    request<T>({
      path: `/api/v1/chat/sessions/${encodeURIComponent(sessionId)}/stop`,
      method: 'POST',
      requireAuth: true,
    }),
  // 实现使用 /api/v1/configs（OpenAPI spec 标注为 /api/v1/chat/configs）
  listChatConfigs: <T = unknown>() => request<T>({ path: '/api/v1/configs', requireAuth: true }),
});
