import { Op } from 'sequelize';
import { badRequest, unauthorized } from '../../shared/http-handler';
import { AiConversationModel } from '../model/ai-conversation.model';
import { AiEventModel } from '../model/ai-event.model';
import { AiMessageModel } from '../model/ai-message.model';
import { AiRunModel } from '../model/ai-run.model';
import { AiToolCallModel } from '../model/ai-tool-call.model';
import {
  createAiEntityId,
  serializeJson,
  toAiChatMessage,
  toAiConversationDetail,
  toAiConversationSummary,
  toAiRun,
  toAiToolCall,
} from './ai-chat-shared.service';
import type {
  AiChatMessageRole,
  AiChatMessageStatus,
  AiConversationStatus,
  AiRunStatus,
  AiToolCallStatus,
  CreateAiConversationPayload,
  UpdateAiConversationPayload,
} from '@volix/types';

export const createAiConversation = async (userId: string | number, payload?: CreateAiConversationPayload) => {
  const conversation = await AiConversationModel.create({
    id: createAiEntityId('aic'),
    user_id: String(userId),
    title: String(payload?.title || '').trim() || '新对话',
    status: 'active',
    last_message_at: new Date(),
  });
  return toAiConversationDetail(conversation.dataValues);
};

export const listAiConversations = async (userId: string | number) => {
  const conversations = await AiConversationModel.findAll({
    where: {
      user_id: String(userId),
    },
    order: [['updated_at', 'DESC']],
  });
  const conversationIds = conversations.map(item => item.dataValues.id);
  const runs = conversationIds.length
    ? await AiRunModel.findAll({
        where: {
          conversation_id: {
            [Op.in]: conversationIds,
          },
        },
        order: [['updated_at', 'DESC']],
      })
    : [];
  const latestRunStatusMap = new Map<string, string>();
  for (const run of runs) {
    if (!latestRunStatusMap.has(run.dataValues.conversation_id)) {
      latestRunStatusMap.set(run.dataValues.conversation_id, run.dataValues.status);
    }
  }
  return conversations.map(item =>
    toAiConversationSummary(item.dataValues, (latestRunStatusMap.get(item.dataValues.id) as AiRunStatus | null) || null)
  );
};

export const getAiConversationRecord = async (conversationId: string) => {
  return AiConversationModel.findByPk(conversationId);
};

export const ensureAiConversationAccess = async (conversationId: string, userId: string | number) => {
  const conversation = await getAiConversationRecord(conversationId);
  if (!conversation) {
    badRequest('会话不存在');
    throw new Error('unreachable');
  }
  if (String(conversation.dataValues.user_id) !== String(userId)) {
    unauthorized('无权访问该会话');
    throw new Error('unreachable');
  }
  return conversation;
};

export const getAiConversationDetail = async (conversationId: string, userId: string | number) => {
  const conversation = await ensureAiConversationAccess(conversationId, userId);
  const latestRun = await AiRunModel.findOne({
    where: {
      conversation_id: conversationId,
    },
    order: [['updated_at', 'DESC']],
  });
  return toAiConversationDetail(conversation.dataValues, latestRun?.dataValues.status || null);
};

export const updateAiConversation = async (
  conversationId: string,
  userId: string | number,
  payload: UpdateAiConversationPayload
) => {
  const conversation = await ensureAiConversationAccess(conversationId, userId);
  const nextTitle = String(payload.title || '').trim();
  const nextStatus = payload.status as AiConversationStatus | undefined;
  await conversation.update({
    ...(nextTitle ? { title: nextTitle } : {}),
    ...(nextStatus ? { status: nextStatus } : {}),
  });
  return getAiConversationDetail(conversationId, userId);
};

export const deleteAiConversation = async (conversationId: string, userId: string | number) => {
  await ensureAiConversationAccess(conversationId, userId);

  await AiEventModel.destroy({
    where: {
      conversation_id: conversationId,
    },
  });
  await AiToolCallModel.destroy({
    where: {
      conversation_id: conversationId,
    },
  });
  await AiRunModel.destroy({
    where: {
      conversation_id: conversationId,
    },
  });
  await AiMessageModel.destroy({
    where: {
      conversation_id: conversationId,
    },
  });
  await AiConversationModel.destroy({
    where: {
      id: conversationId,
      user_id: String(userId),
    },
  });

  return {
    id: conversationId,
    deleted: true,
  };
};

export const listAiConversationMessages = async (conversationId: string, userId: string | number) => {
  await ensureAiConversationAccess(conversationId, userId);
  const rows = await AiMessageModel.findAll({
    where: {
      conversation_id: conversationId,
    },
    order: [['created_at', 'ASC']],
  });
  return rows.map(item => toAiChatMessage(item.dataValues));
};

export const listAiConversationRuns = async (conversationId: string, userId: string | number) => {
  await ensureAiConversationAccess(conversationId, userId);
  const rows = await AiRunModel.findAll({
    where: {
      conversation_id: conversationId,
    },
    order: [['created_at', 'DESC']],
  });
  return rows.map(item => toAiRun(item.dataValues));
};

export const listAiConversationToolCalls = async (conversationId: string, userId: string | number) => {
  await ensureAiConversationAccess(conversationId, userId);
  const rows = await AiToolCallModel.findAll({
    where: {
      conversation_id: conversationId,
    },
    order: [['created_at', 'DESC']],
  });
  return rows.map(item => toAiToolCall(item.dataValues));
};

export const createAiMessageRecord = async (params: {
  conversationId: string;
  role: AiChatMessageRole;
  content: string;
  status?: AiChatMessageStatus;
  runId?: string | null;
  toolCallId?: string | null;
  meta?: Record<string, unknown>;
}) => {
  const message = await AiMessageModel.create({
    id: createAiEntityId('aim'),
    conversation_id: params.conversationId,
    run_id: params.runId || null,
    tool_call_id: params.toolCallId || null,
    role: params.role,
    content: params.content,
    status: params.status || 'completed',
    meta_json: params.meta ? serializeJson(params.meta) : null,
  });
  await AiConversationModel.update(
    {
      last_message_at: new Date(),
    },
    {
      where: {
        id: params.conversationId,
      },
    }
  );
  return toAiChatMessage(message.dataValues);
};

export const updateAiMessageRecord = async (
  messageId: string,
  payload: {
    content?: string;
    status?: AiChatMessageStatus;
    meta?: Record<string, unknown>;
  }
) => {
  const message = await AiMessageModel.findByPk(messageId);
  if (!message) {
    badRequest('消息不存在');
    throw new Error('unreachable');
  }
  await message.update({
    ...(payload.content !== undefined ? { content: payload.content } : {}),
    ...(payload.status ? { status: payload.status } : {}),
    ...(payload.meta ? { meta_json: serializeJson(payload.meta) } : {}),
  });
  return toAiChatMessage(message.dataValues);
};

export const getAiMessageRecord = async (messageId: string) => {
  const row = await AiMessageModel.findByPk(messageId);
  if (!row) {
    badRequest('消息不存在');
    throw new Error('unreachable');
  }
  return toAiChatMessage(row.dataValues);
};

export const createAiRunRecord = async (params: {
  conversationId: string;
  triggerMessageId: string;
  model?: string | null;
}) => {
  const row = await AiRunModel.create({
    id: createAiEntityId('air'),
    conversation_id: params.conversationId,
    trigger_message_id: params.triggerMessageId,
    status: 'queued',
    model: params.model || null,
    current_step: 0,
  });
  return toAiRun(row.dataValues);
};

export const getAiRunRecord = async (runId: string) => {
  return AiRunModel.findByPk(runId);
};

type UpdateAiRunPayload = Partial<{
  status: AiRunStatus;
  model: string | null;
  current_step: number;
  error_message: string | null;
  started_at: Date | null;
  finished_at: Date | null;
}>;

export const updateAiRunRecord = async (runId: string, payload: UpdateAiRunPayload) => {
  const row = await getAiRunRecord(runId);
  if (!row) {
    badRequest('AI 运行记录不存在');
    throw new Error('unreachable');
  }
  await row.update(payload);
  return toAiRun(row.dataValues);
};

export const createAiToolCallRecord = async (params: {
  conversationId: string;
  runId: string;
  toolName: string;
  riskLevel: 'read' | 'write_low' | 'write_high';
  requiresApproval: boolean;
  arguments: Record<string, unknown>;
  status?: AiToolCallStatus;
}) => {
  const row = await AiToolCallModel.create({
    id: createAiEntityId('ait'),
    conversation_id: params.conversationId,
    run_id: params.runId,
    tool_name: params.toolName,
    risk_level: params.riskLevel,
    status: params.status || (params.requiresApproval ? 'waiting_approval' : 'queued'),
    requires_approval: params.requiresApproval,
    arguments_json: serializeJson(params.arguments),
  });
  return toAiToolCall(row.dataValues);
};

export const getAiToolCallRecord = async (toolCallId: string) => {
  return AiToolCallModel.findByPk(toolCallId);
};

type UpdateAiToolCallPayload = Partial<{
  status: AiToolCallStatus;
  result_json: string | null;
  error_message: string | null;
  started_at: Date | null;
  finished_at: Date | null;
}>;

export const updateAiToolCallRecord = async (toolCallId: string, payload: UpdateAiToolCallPayload) => {
  const row = await getAiToolCallRecord(toolCallId);
  if (!row) {
    badRequest('工具调用不存在');
    throw new Error('unreachable');
  }
  await row.update(payload);
  return toAiToolCall(row.dataValues);
};
