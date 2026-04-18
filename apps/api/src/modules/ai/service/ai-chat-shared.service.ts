import type {
  AiChatMessage,
  AiConversationDetail,
  AiConversationSummary,
  AiEvent,
  AiRun,
  AiToolCall,
} from '@volix/types';
import { randomUUID } from 'crypto';
import type { AiConversationEntity } from '../model/ai-conversation.model';
import type { AiMessageEntity } from '../model/ai-message.model';
import type { AiRunEntity } from '../model/ai-run.model';
import type { AiToolCallEntity } from '../model/ai-tool-call.model';
import type { AiEventEntity } from '../model/ai-event.model';

export const createAiEntityId = (prefix: string) => `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 24)}`;

const toIso = (value?: string | Date | null) => {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const parseJson = (value?: string | null) => {
  if (!value) {
    return undefined;
  }
  try {
    return JSON.parse(value);
  } catch {
    return undefined;
  }
};

export const serializeJson = (value: unknown) => JSON.stringify(value ?? {});

export const toAiConversationSummary = (
  entity: AiConversationEntity,
  latestRunStatus?: AiRun['status'] | null
): AiConversationSummary => ({
  id: entity.id,
  title: entity.title,
  status: entity.status,
  userId: String(entity.user_id),
  lastMessageAt: toIso(entity.last_message_at) || null,
  createdAt: toIso(entity.created_at) || new Date().toISOString(),
  updatedAt: toIso(entity.updated_at) || new Date().toISOString(),
  ...(latestRunStatus ? { latestRunStatus } : {}),
});

export const toAiConversationDetail = (
  entity: AiConversationEntity,
  latestRunStatus?: AiRun['status'] | null
): AiConversationDetail => ({
  ...toAiConversationSummary(entity, latestRunStatus),
  latestRunStatus: latestRunStatus || null,
});

export const toAiChatMessage = (entity: AiMessageEntity): AiChatMessage => ({
  id: entity.id,
  conversationId: entity.conversation_id,
  runId: entity.run_id || null,
  toolCallId: entity.tool_call_id || null,
  role: entity.role,
  content: entity.content || '',
  status: entity.status,
  createdAt: toIso(entity.created_at) || new Date().toISOString(),
  updatedAt: toIso(entity.updated_at) || new Date().toISOString(),
});

export const toAiRun = (entity: AiRunEntity): AiRun => ({
  id: entity.id,
  conversationId: entity.conversation_id,
  triggerMessageId: entity.trigger_message_id,
  status: entity.status,
  model: entity.model || null,
  currentStep: Number(entity.current_step || 0),
  errorMessage: entity.error_message || null,
  startedAt: toIso(entity.started_at) || null,
  finishedAt: toIso(entity.finished_at) || null,
  createdAt: toIso(entity.created_at) || new Date().toISOString(),
  updatedAt: toIso(entity.updated_at) || new Date().toISOString(),
});

export const toAiToolCall = (entity: AiToolCallEntity): AiToolCall => ({
  id: entity.id,
  conversationId: entity.conversation_id,
  runId: entity.run_id,
  toolName: entity.tool_name,
  riskLevel: entity.risk_level,
  status: entity.status,
  requiresApproval: Boolean(entity.requires_approval),
  arguments: (parseJson(entity.arguments_json) as Record<string, unknown>) || {},
  result: parseJson(entity.result_json),
  errorMessage: entity.error_message || null,
  startedAt: toIso(entity.started_at) || null,
  finishedAt: toIso(entity.finished_at) || null,
  createdAt: toIso(entity.created_at) || new Date().toISOString(),
  updatedAt: toIso(entity.updated_at) || new Date().toISOString(),
});

export const toAiEvent = (entity: AiEventEntity): AiEvent => ({
  id: entity.id,
  conversationId: entity.conversation_id,
  runId: entity.run_id || null,
  sequence: Number(entity.sequence || 0),
  type: entity.type,
  payload: (parseJson(entity.payload_json) as Record<string, unknown>) || {},
  createdAt: toIso(entity.created_at) || new Date().toISOString(),
});
