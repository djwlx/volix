import type { AiToolDefinition, UserRole } from '@volix/types';
import { UserRole as UserRoleEnum } from '@volix/types';
import { badRequest, unauthorized } from '../../shared/http-handler';
import {
  createAnalyzeOpenlistAiOrganizerTask,
  createExecuteOpenlistAiOrganizerTask,
  queryOpenlistAiOrganizerTaskDetail,
  queryOpenlistAiOrganizerTaskList,
} from '../../openlist-ai-organizer/service/openlist-ai-organizer-task.service';
import {
  browseOpenlistAiOrganizerPath,
  listOpenlistPathEntries,
  pickRandomOpenlistImageFromPath,
} from '../../openlist-ai-organizer/service/openlist-ai-organizer.service';
import {
  queryAnimeSubscriptionById,
  queryAnimeSubscriptions,
  triggerAnimeSubscriptionCheckInBackground,
} from '../../anime-subscription/service/anime-subscription.service';

export interface AiToolExecutionContext {
  user: {
    id: string | number;
    role: UserRole;
    email?: string;
  };
  requestUserAgent?: string;
}

interface RegisteredAiTool {
  definition: AiToolDefinition;
  execute: (context: AiToolExecutionContext, input: Record<string, unknown>) => Promise<unknown>;
}

const ensureAdmin = (context: AiToolExecutionContext) => {
  if (context.user.role !== UserRoleEnum.ADMIN) {
    unauthorized('仅管理员可调用该工具');
  }
};

const normalizeId = (value: unknown, field: string) => {
  const text = String(value || '').trim();
  if (!text) {
    badRequest(`${field} 不能为空`);
  }
  return text;
};

const normalizeString = (value: unknown, field: string) => {
  const text = String(value || '').trim();
  if (!text) {
    badRequest(`${field} 不能为空`);
  }
  return text;
};

const normalizeOpenlistToolPath = (value: unknown, field: string) => {
  const text = normalizeString(value, field).replace(/\\/g, '/');
  return text.startsWith('/') ? text : text.replace(/^\/+|\/+$/g, '');
};

const registeredTools: RegisteredAiTool[] = [
  {
    definition: {
      name: 'anime.list_subscriptions',
      description: '查看当前自动追番订阅列表和基础状态。',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
    },
    execute: async () => {
      const rows = await queryAnimeSubscriptions();
      return rows.slice(0, 20).map(item => ({
        id: item.dataValues.id,
        name: item.dataValues.name,
        status: item.dataValues.status,
        currentStage: item.dataValues.current_stage,
        enabled: Boolean(item.dataValues.enabled),
      }));
    },
  },
  {
    definition: {
      name: 'anime.trigger_subscription_check',
      description: '触发指定自动追番订阅的后台检查任务。',
      riskLevel: 'write_low',
      requiresApproval: false,
      inputSchema: {
        subscriptionId: 'string',
      },
    },
    execute: async (context, input) => {
      ensureAdmin(context);
      const subscriptionId = normalizeId(input.subscriptionId, 'subscriptionId');
      const subscription = await queryAnimeSubscriptionById(subscriptionId);
      if (!subscription) {
        badRequest('订阅不存在');
      }
      return triggerAnimeSubscriptionCheckInBackground(subscriptionId, {
        notifyEmail: context.user.email,
      });
    },
  },
  {
    definition: {
      name: 'openlist.browse_path',
      description: '浏览 OpenList 某个目录下的子项，默认返回子目录。',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        path: 'string',
      },
    },
    execute: async (context, input) => {
      ensureAdmin(context);
      return browseOpenlistAiOrganizerPath(normalizeOpenlistToolPath(input.path || '/', 'path'), {
        userAgent: context.requestUserAgent,
      });
    },
  },
  {
    definition: {
      name: 'openlist.list_path_items',
      description: '列出 OpenList 某个目录下的目录和文件，可用于确认图片或文件名。',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        path: 'string',
      },
    },
    execute: async (context, input) => {
      ensureAdmin(context);
      return listOpenlistPathEntries(
        normalizeOpenlistToolPath(input.path || '/', 'path'),
        {
          includeFiles: true,
        },
        {
          userAgent: context.requestUserAgent,
        }
      );
    },
  },
  {
    definition: {
      name: 'openlist.pick_random_image',
      description: '从 OpenList 指定路径及其子目录中随机挑选一张图片，返回可直接展示的图片链接。',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        path: 'string',
      },
    },
    execute: async (context, input) => {
      ensureAdmin(context);
      return pickRandomOpenlistImageFromPath(normalizeOpenlistToolPath(input.path, 'path'), {
        userAgent: context.requestUserAgent,
      });
    },
  },
  {
    definition: {
      name: 'openlist.list_tasks',
      description: '查看 AI 文件整理任务列表。',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
    },
    execute: async context => {
      ensureAdmin(context);
      return queryOpenlistAiOrganizerTaskList();
    },
  },
  {
    definition: {
      name: 'openlist.get_task_detail',
      description: '查看某个 AI 文件整理任务的详情。',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        taskId: 'string',
      },
    },
    execute: async (context, input) => {
      ensureAdmin(context);
      return queryOpenlistAiOrganizerTaskDetail(normalizeId(input.taskId, 'taskId'));
    },
  },
  {
    definition: {
      name: 'openlist.analyze_folder',
      description: '创建一个新的 OpenList AI 分析任务。',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        rootPath: 'string',
        duplicateFolderName: 'string?',
      },
    },
    execute: async (context, input) => {
      ensureAdmin(context);
      return createAnalyzeOpenlistAiOrganizerTask({
        rootPath: normalizeString(input.rootPath, 'rootPath'),
        duplicateFolderName: String(input.duplicateFolderName || '').trim() || undefined,
      });
    },
  },
  {
    definition: {
      name: 'openlist.execute_plan',
      description: '执行已经确认过的 OpenList 整理计划。',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        rootPath: 'string',
        duplicateFolderName: 'string',
        items: 'array',
      },
    },
    execute: async (context, input) => {
      ensureAdmin(context);
      if (!Array.isArray(input.items) || input.items.length === 0) {
        badRequest('items 不能为空');
      }
      return createExecuteOpenlistAiOrganizerTask({
        rootPath: normalizeString(input.rootPath, 'rootPath'),
        duplicateFolderName: normalizeString(input.duplicateFolderName, 'duplicateFolderName'),
        items: input.items as any[],
      });
    },
  },
];

export const listAiRegisteredTools = () => registeredTools.map(item => item.definition);

export const getAiRegisteredTool = (name: string) => registeredTools.find(item => item.definition.name === name);

export const executeAiRegisteredTool = async (
  name: string,
  context: AiToolExecutionContext,
  input: Record<string, unknown>
) => {
  const tool = getAiRegisteredTool(name);
  if (!tool) {
    badRequest(`工具不存在: ${name}`);
    throw new Error('unreachable');
  }
  return tool.execute(context, input);
};
