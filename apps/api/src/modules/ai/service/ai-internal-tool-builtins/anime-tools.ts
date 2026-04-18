import { UserRole as UserRoleEnum } from '@volix/types';
import { badRequest, unauthorized } from '../../../shared/http-handler';
import {
  queryAnimeSubscriptionById,
  queryAnimeSubscriptions,
  triggerAnimeSubscriptionCheckInBackground,
} from '../../../anime-subscription/service/anime-subscription.service';
import type { AiInternalToolDefinition, AiInternalToolExecutionContext } from '../ai-internal-tool.types';

const ensureAdmin = (context: AiInternalToolExecutionContext) => {
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

export const buildAnimeInternalTools = (): AiInternalToolDefinition[] => {
  return [
    {
      name: 'anime.list_subscriptions',
      description: '查看当前自动追番订阅列表和基础状态。',
      category: 'business',
      riskLevel: 'read',
      requiresApproval: false,
      inputSchema: {},
      execute: async () => {
        const rows = await queryAnimeSubscriptions();
        return {
          internalResult: rows.slice(0, 20).map(item => ({
            id: item.dataValues.id,
            name: item.dataValues.name,
            status: item.dataValues.status,
            currentStage: item.dataValues.current_stage,
            enabled: Boolean(item.dataValues.enabled),
          })),
        };
      },
    },
    {
      name: 'anime.trigger_subscription_check',
      description: '触发指定自动追番订阅的后台检查任务。',
      category: 'business',
      riskLevel: 'write_low',
      requiresApproval: true,
      inputSchema: {
        subscriptionId: 'string',
      },
      summarizeForFrontend: input => ({
        subscriptionId: String(input.subscriptionId || ''),
      }),
      execute: async (context, input) => {
        ensureAdmin(context);
        const subscriptionId = normalizeId(input.subscriptionId, 'subscriptionId');
        const subscription = await queryAnimeSubscriptionById(subscriptionId);
        if (!subscription) {
          badRequest('订阅不存在');
        }
        return {
          internalResult: await triggerAnimeSubscriptionCheckInBackground(subscriptionId, {
            notifyEmail: context.user.email,
          }),
        };
      },
    },
  ];
};
