import request from '../../../utils/request';
import { badRequest } from '../../shared/http-handler';
import { getInternalAiAccountConfig } from './ai-config.service';
import { getAiMessagesCharCount, logAiEvent, maskAiAccountForLog, serializeAiMessagesForLog } from './ai-log.service';
import type { InternalAiChatOptions, InternalAiMessage } from '../types/ai.types';

const DEFAULT_INTERNAL_AI_MODEL = 'gpt-4.1-mini';
const INTERNAL_AI_TIMEOUT_MS = 180000;

const buildChatCompletionsUrl = (baseUrl: string) => {
  const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return normalized.endsWith('/chat/completions') ? normalized : `${normalized}/chat/completions`;
};

const getTextFromMessageContent = (content: unknown) => {
  if (typeof content === 'string') {
    return content;
  }

  if (Array.isArray(content)) {
    return content
      .map(item => {
        if (typeof item === 'string') {
          return item;
        }
        if (item && typeof item === 'object' && 'text' in item) {
          return String((item as { text?: string }).text || '');
        }
        return '';
      })
      .join('');
  }

  return '';
};

const extractJsonText = (text: string): string => {
  const trimmed = text.trim();
  if (!trimmed) {
    badRequest('AI 返回为空');
    throw new Error('unreachable');
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim();
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  badRequest('AI 返回不是有效 JSON');
  throw new Error('unreachable');
};

export const runInternalAiJson = async <T>(
  messages: InternalAiMessage[],
  options?: InternalAiChatOptions
): Promise<T> => {
  const account = await getInternalAiAccountConfig();
  const model = options?.model?.trim() || account.model || DEFAULT_INTERNAL_AI_MODEL;
  const traceId = options?.traceId || 'ai_unknown';
  const toolName = options?.toolName || 'internal_ai';
  const startedAt = Date.now();
  const messageCharCount = getAiMessagesCharCount(messages);
  const messageCharBreakdown = messages.map(item => ({
    role: item.role,
    chars: String(item.content || '').length,
  }));

  try {
    logAiEvent(traceId, 'request', {
      toolName,
      account: maskAiAccountForLog(account),
      model,
      temperature: options?.temperature ?? 0.2,
      timeoutMs: INTERNAL_AI_TIMEOUT_MS,
      messageCount: messages.length,
      messageCharCount,
      messageCharBreakdown,
      messages: serializeAiMessagesForLog(messages),
    });

    const response = await request.post(
      buildChatCompletionsUrl(account.baseUrl),
      {
        model,
        temperature: options?.temperature ?? 0.2,
        messages,
      },
      {
        timeout: INTERNAL_AI_TIMEOUT_MS,
        headers: {
          Authorization: `Bearer ${account.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = getTextFromMessageContent(response.data?.choices?.[0]?.message?.content);
    const jsonText = extractJsonText(content);
    const parsed = JSON.parse(jsonText) as T;

    logAiEvent(traceId, 'response', {
      toolName,
      model,
      elapsedMs: Date.now() - startedAt,
      content,
      parsed,
    });

    return parsed;
  } catch (error) {
    const message =
      (error as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data?.error
        ?.message ||
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
      (error as Error)?.message ||
      'AI 服务调用失败';

    logAiEvent(traceId, 'error', {
      toolName,
      model,
      elapsedMs: Date.now() - startedAt,
      timeoutMs: INTERNAL_AI_TIMEOUT_MS,
      messageCount: messages.length,
      messageCharCount,
      messageCharBreakdown,
      errorName: (error as { name?: string })?.name || '',
      errorCode: (error as { code?: string })?.code || '',
      isTimeout: /timeout/i.test(message),
      isAborted: /aborted/i.test(message),
      errorMessage: message,
      responseData: (error as { response?: { data?: unknown } })?.response?.data,
    });

    badRequest(`AI 服务调用失败: ${message}`);
    throw new Error('unreachable');
  }
};
