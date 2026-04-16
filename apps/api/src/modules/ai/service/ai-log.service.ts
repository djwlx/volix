import { taskLog } from '../../../utils/logger';
import type { InternalAiMessage } from '../types/ai.types';

const summarizeText = (value: string, max = 8000) => {
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max)}...<truncated ${value.length - max} chars>`;
};

export const createAiTraceId = (toolName: string) => {
  const safeName = toolName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase() || 'ai';
  return `${safeName}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

export const logAiEvent = (traceId: string, stage: string, payload: unknown) => {
  taskLog.info(`[AI][${traceId}][${stage}] ${summarizeText(JSON.stringify(payload, null, 2))}`);
};

export const maskAiAccountForLog = (account: { baseUrl: string; model: string }) => ({
  baseUrl: account.baseUrl,
  model: account.model,
});

export const serializeAiMessagesForLog = (messages: InternalAiMessage[]) =>
  messages.map(item => ({
    role: item.role,
    content: summarizeText(item.content, 4000),
  }));

export const getAiMessagesCharCount = (messages: InternalAiMessage[]) =>
  messages.reduce((total, item) => total + String(item.content || '').length, 0);
