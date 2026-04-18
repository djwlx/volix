import { UserRole as UserRoleEnum } from '@volix/types';
import { badRequest, unauthorized } from '../../../shared/http-handler';
import {
  createAnalyzeOpenlistAiOrganizerTask,
  createExecuteOpenlistAiOrganizerTask,
  queryOpenlistAiOrganizerTaskDetail,
  queryOpenlistAiOrganizerTaskList,
} from '../../../openlist-ai-organizer/service/openlist-ai-organizer-task.service';
import {
  browseOpenlistAiOrganizerPath,
  listOpenlistPathEntries,
  pickRandomOpenlistImageFromPath,
} from '../../../openlist-ai-organizer/service/openlist-ai-organizer.service';
import type { AiInternalToolDefinition, AiInternalToolExecutionContext } from '../ai-internal-tool.types';

const ensureAdmin = (context: AiInternalToolExecutionContext) => {
  if (context.user.role !== UserRoleEnum.ADMIN) {
    unauthorized('仅管理员可调用该工具');
  }
};

const normalizeString = (value: unknown, field: string) => {
  const text = String(value || '').trim();
  if (!text) {
    badRequest(`${field} 不能为空`);
  }
  return text;
};

const normalizeId = (value: unknown, field: string) => {
  return normalizeString(value, field);
};

const normalizeOpenlistToolPath = (value: unknown, field: string) => {
  const text = normalizeString(value, field).replace(/\\/g, '/');
  return text.startsWith('/') ? text : text.replace(/^\/+|\/+$/g, '');
};

export const buildOpenlistInternalTools = (): AiInternalToolDefinition[] => {
  return [
    {
      name: 'openlist.browse_path',
      description: '浏览 OpenList 某个目录下的子项，默认返回子目录。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        path: 'string',
      },
      execute: async (context, input) => {
        ensureAdmin(context);
        return {
          internalResult: await browseOpenlistAiOrganizerPath(normalizeOpenlistToolPath(input.path || '/', 'path'), {
            userAgent: context.requestUserAgent,
          }),
        };
      },
    },
    {
      name: 'openlist.list_path_items',
      description: '列出 OpenList 某个目录下的目录和文件，可用于确认图片或文件名。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        path: 'string',
      },
      execute: async (context, input) => {
        ensureAdmin(context);
        return {
          internalResult: await listOpenlistPathEntries(
            normalizeOpenlistToolPath(input.path || '/', 'path'),
            {
              includeFiles: true,
            },
            {
              userAgent: context.requestUserAgent,
            }
          ),
        };
      },
    },
    {
      name: 'openlist.pick_random_image',
      description: '从 OpenList 指定路径及其子目录中随机挑选一张图片，返回可直接展示的图片链接。',
      category: 'sdk',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        path: 'string',
      },
      execute: async (context, input) => {
        ensureAdmin(context);
        return {
          internalResult: await pickRandomOpenlistImageFromPath(normalizeOpenlistToolPath(input.path, 'path'), {
            userAgent: context.requestUserAgent,
          }),
        };
      },
    },
    {
      name: 'openlist.list_tasks',
      description: '查看 AI 文件整理任务列表。',
      category: 'business',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
      execute: async context => {
        ensureAdmin(context);
        return {
          internalResult: await queryOpenlistAiOrganizerTaskList(),
        };
      },
    },
    {
      name: 'openlist.get_task_detail',
      description: '查看某个 AI 文件整理任务的详情。',
      category: 'business',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        taskId: 'string',
      },
      execute: async (context, input) => {
        ensureAdmin(context);
        return {
          internalResult: await queryOpenlistAiOrganizerTaskDetail(normalizeId(input.taskId, 'taskId')),
        };
      },
    },
    {
      name: 'openlist.analyze_folder',
      description: '创建一个新的 OpenList AI 分析任务。',
      category: 'business',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        rootPath: 'string',
        duplicateFolderName: 'string?',
      },
      summarizeForFrontend: input => ({
        rootPath: String(input.rootPath || ''),
        duplicateFolderName: String(input.duplicateFolderName || ''),
      }),
      execute: async (context, input) => {
        ensureAdmin(context);
        return {
          internalResult: await createAnalyzeOpenlistAiOrganizerTask({
            rootPath: normalizeString(input.rootPath, 'rootPath'),
            duplicateFolderName: String(input.duplicateFolderName || '').trim() || undefined,
          }),
        };
      },
    },
    {
      name: 'openlist.execute_plan',
      description: '执行已经确认过的 OpenList 整理计划。',
      category: 'business',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        rootPath: 'string',
        duplicateFolderName: 'string',
        items: 'array',
      },
      summarizeForFrontend: input => ({
        rootPath: String(input.rootPath || ''),
        duplicateFolderName: String(input.duplicateFolderName || ''),
        itemCount: Array.isArray(input.items) ? input.items.length : 0,
      }),
      execute: async (context, input) => {
        ensureAdmin(context);
        if (!Array.isArray(input.items) || input.items.length === 0) {
          badRequest('items 不能为空');
        }
        return {
          internalResult: await createExecuteOpenlistAiOrganizerTask({
            rootPath: normalizeString(input.rootPath, 'rootPath'),
            duplicateFolderName: normalizeString(input.duplicateFolderName, 'duplicateFolderName'),
            items: input.items as any[],
          }),
        };
      },
    },
  ];
};
