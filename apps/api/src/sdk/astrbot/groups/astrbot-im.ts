import type { AstrbotMessageContent, AstrbotRequest } from '../types';

export interface AstrbotImMessageRequest {
  umo: string;
  message: AstrbotMessageContent;
}

export const createAstrbotImMethods = (request: AstrbotRequest) => ({
  // 注意：实现与文档使用单数 /api/v1/im/message（OpenAPI spec 误写为复数 messages）
  sendImMessage: <T = unknown>(body: AstrbotImMessageRequest) =>
    request<T>({ path: '/api/v1/im/message', method: 'POST', data: body, requireAuth: true }),
  listImBots: <T = unknown>() => request<T>({ path: '/api/v1/im/bots', requireAuth: true }),
});
