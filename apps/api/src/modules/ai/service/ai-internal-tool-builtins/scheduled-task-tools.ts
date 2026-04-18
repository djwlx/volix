import {
  createScheduledTask,
  getScheduledTaskDetail,
  getScheduledTaskLogs,
  listScheduledTasks,
  toggleScheduledTask,
} from '../../../scheduled-task/service/scheduled-task.service';
import { triggerScheduledTaskNow } from '../../../scheduled-task/service/scheduled-task-scheduler.service';
import { badRequest } from '../../../shared/http-handler';
import type { AiInternalToolDefinition } from '../ai-internal-tool.types';

const normalizeText = (value: unknown, field: string) => {
  const text = String(value || '').trim();
  if (!text) {
    badRequest(`${field} 不能为空`);
  }
  return text;
};

export const buildScheduledTaskInternalTools = (): AiInternalToolDefinition[] => {
  return [
    {
      name: 'scheduled_task.list',
      description: '查看当前定时任务列表。',
      category: 'business',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
      execute: async () => ({
        internalResult: await listScheduledTasks(),
      }),
    },
    {
      name: 'scheduled_task.get_detail',
      description: '查看指定定时任务详情。',
      category: 'business',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        taskId: 'string',
      },
      execute: async (_context, input) => ({
        internalResult: await getScheduledTaskDetail(normalizeText(input.taskId, 'taskId')),
      }),
    },
    {
      name: 'scheduled_task.create',
      description: '创建新的定时任务并立即启用。',
      category: 'business',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        name: 'string',
        description: 'string?',
        category: 'string?',
        cronExpr: 'string',
        timezone: 'string?',
        scriptLanguage: 'string?',
        scriptContent: 'string?',
        scriptEntryArgs: 'object?',
      },
      summarizeForFrontend: input => ({
        name: String(input.name || ''),
        cronExpr: String(input.cronExpr || ''),
        timezone: String(input.timezone || 'Asia/Shanghai'),
      }),
      execute: async (context, input) => ({
        internalResult: await createScheduledTask(
          {
            name: normalizeText(input.name, 'name'),
            description: input.description ? String(input.description) : undefined,
            category: (input.category ? String(input.category) : 'custom') as any,
            taskType: 'script',
            enabled: input.enabled !== false,
            cronExpr: normalizeText(input.cronExpr, 'cronExpr'),
            timezone: input.timezone ? String(input.timezone) : 'Asia/Shanghai',
            scriptLanguage: 'javascript',
            scriptContent: input.scriptContent ? String(input.scriptContent) : '',
            scriptEntryArgs:
              input.scriptEntryArgs && typeof input.scriptEntryArgs === 'object'
                ? (input.scriptEntryArgs as Record<string, unknown>)
                : undefined,
          },
          String(context.user.id || '')
        ),
      }),
    },
    {
      name: 'scheduled_task.toggle',
      description: '启用或停用定时任务。',
      category: 'business',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        taskId: 'string',
      },
      summarizeForFrontend: input => ({
        taskId: String(input.taskId || ''),
      }),
      execute: async (_context, input) => ({
        internalResult: await toggleScheduledTask(normalizeText(input.taskId, 'taskId')),
      }),
    },
    {
      name: 'scheduled_task.run_now',
      description: '立即执行一次定时任务。',
      category: 'business',
      riskLevel: 'write_high',
      requiresApproval: true,
      inputSchema: {
        taskId: 'string',
      },
      summarizeForFrontend: input => ({
        taskId: String(input.taskId || ''),
      }),
      execute: async (_context, input) => ({
        internalResult: await triggerScheduledTaskNow(normalizeText(input.taskId, 'taskId'), 'ai'),
      }),
    },
    {
      name: 'scheduled_task.get_logs',
      description: '查看定时任务最近日志。',
      category: 'business',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {
        taskId: 'string',
      },
      execute: async (_context, input) => ({
        internalResult: await getScheduledTaskLogs(normalizeText(input.taskId, 'taskId')),
      }),
    },
  ];
};
