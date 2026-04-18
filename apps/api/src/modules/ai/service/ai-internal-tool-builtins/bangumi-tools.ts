import { createBangumiSdk } from '../../../../sdk';
import { AppConfigEnum } from '../../../config/model/config.model';
import { badRequest } from '../../../shared/http-handler';
import type { AiInternalToolDefinition } from '../ai-internal-tool.types';
import { resolveConfigForExecution } from './config-tools';

const getBangumiSdk = async () => {
  const config = await resolveConfigForExecution<{
    baseUrl: string;
    accessToken: string;
  }>(AppConfigEnum.account_bangumi);

  return createBangumiSdk({
    apiHost: config.baseUrl,
    accessToken: config.accessToken,
  });
};

const normalizeId = (value: unknown, field: string) => {
  const text = String(value || '').trim();
  if (!text) {
    badRequest(`${field} 不能为空`);
  }
  return text;
};

export const buildBangumiInternalTools = (): AiInternalToolDefinition[] => {
  return [
    {
      name: 'bangumi.get_calendar',
      description: '获取 Bangumi 每日放送。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
      execute: async () => ({
        internalResult: await (await getBangumiSdk()).getCalendar(),
      }),
    },
    {
      name: 'bangumi.search_subjects',
      description: '搜索 Bangumi 条目。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        keyword: 'string',
        sort: 'string?',
        filter: 'object?',
        limit: 'number?',
        offset: 'number?',
      },
      execute: async (_context, input) => ({
        internalResult: await (
          await getBangumiSdk()
        ).searchSubjects(
          {
            keyword: normalizeId(input.keyword, 'keyword'),
            ...(input.sort ? { sort: String(input.sort) as 'match' | 'heat' | 'rank' | 'score' } : {}),
            ...(input.filter && typeof input.filter === 'object'
              ? { filter: input.filter as Record<string, unknown> }
              : {}),
          },
          {
            ...(input.limit !== undefined ? { limit: Number(input.limit) } : {}),
            ...(input.offset !== undefined ? { offset: Number(input.offset) } : {}),
          }
        ),
      }),
    },
    {
      name: 'bangumi.get_subject',
      description: '读取 Bangumi 条目详情。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        subjectId: 'string',
      },
      execute: async (_context, input) => ({
        internalResult: await (await getBangumiSdk()).getSubjectById(normalizeId(input.subjectId, 'subjectId')),
      }),
    },
    {
      name: 'bangumi.get_me',
      description: '读取 Bangumi 当前登录用户信息。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
      execute: async () => ({
        internalResult: await (await getBangumiSdk()).getMyself(),
      }),
    },
    {
      name: 'bangumi.get_user_collections',
      description: '获取指定用户的条目收藏列表。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        username: 'string',
        subjectType: 'number?',
        type: 'number?',
        limit: 'number?',
        offset: 'number?',
      },
      execute: async (_context, input) => ({
        internalResult: await (
          await getBangumiSdk()
        ).getUserCollections(normalizeId(input.username, 'username'), {
          ...(input.subjectType !== undefined ? { subjectType: Number(input.subjectType) } : {}),
          ...(input.type !== undefined ? { type: Number(input.type) } : {}),
          ...(input.limit !== undefined ? { limit: Number(input.limit) } : {}),
          ...(input.offset !== undefined ? { offset: Number(input.offset) } : {}),
        }),
      }),
    },
    {
      name: 'bangumi.upsert_user_collection',
      description: '新增或修改当前用户的 Bangumi 条目收藏。',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        subjectId: 'string',
        body: 'object?',
      },
      summarizeForFrontend: input => ({
        subjectId: String(input.subjectId || ''),
        body: input.body,
      }),
      execute: async (_context, input) => ({
        internalResult: await (
          await getBangumiSdk()
        ).upsertUserCollection(
          normalizeId(input.subjectId, 'subjectId'),
          input.body && typeof input.body === 'object' ? (input.body as Record<string, unknown>) : {}
        ),
      }),
    },
    {
      name: 'bangumi.request_read',
      description: '按路径调用 Bangumi 只读接口。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        path: 'string',
        params: 'object?',
      },
      execute: async (_context, input) => ({
        internalResult: await (
          await getBangumiSdk()
        ).requestBangumi({
          path: normalizeId(input.path, 'path'),
          params:
            input.params && typeof input.params === 'object' ? (input.params as Record<string, unknown>) : undefined,
        }),
      }),
    },
    {
      name: 'bangumi.request_write',
      description: '按路径调用 Bangumi 写接口。',
      category: 'sdk',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        path: 'string',
        method: 'string',
        params: 'object?',
        body: 'object?',
      },
      summarizeForFrontend: input => ({
        path: String(input.path || ''),
        method: String(input.method || 'POST').toUpperCase(),
      }),
      execute: async (_context, input) => ({
        internalResult: await (
          await getBangumiSdk()
        ).requestBangumi({
          path: normalizeId(input.path, 'path'),
          method: String(input.method || 'POST').toUpperCase() as 'POST' | 'PUT' | 'PATCH' | 'DELETE',
          params:
            input.params && typeof input.params === 'object' ? (input.params as Record<string, unknown>) : undefined,
          data: input.body && typeof input.body === 'object' ? input.body : {},
          requireAuth: true,
        }),
      }),
    },
  ];
};
