import request from '../../../utils/request';
import { badRequest } from '../../shared/http-handler';
import { getInternalAiAccountConfig } from './ai-config.service';
import { getAiMessagesCharCount, logAiEvent, maskAiAccountForLog, serializeAiMessagesForLog } from './ai-log.service';
import type { InternalAiChatOptions, InternalAiMessage } from '../types/ai.types';

const DEFAULT_INTERNAL_AI_MODEL = 'gpt-4.1-mini';
const INTERNAL_AI_TIMEOUT_MS = 180000;
const INTERNAL_AI_MAX_RETRIES = 3;
const INTERNAL_AI_RETRY_DELAY_MS = 1500;
const INVALID_JSON_RESPONSE_CODE = 'AI_INVALID_JSON_RESPONSE';
const UNSUPPORTED_JSON_MODE_CODE = 'AI_UNSUPPORTED_JSON_MODE';

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

class InternalAiJsonParseError extends Error {
  code = INVALID_JSON_RESPONSE_CODE;
  rawContent: string;

  constructor(message: string, rawContent: string) {
    super(message);
    this.name = 'InternalAiJsonParseError';
    this.rawContent = rawContent;
  }
}

const getRawContentPreview = (content: string) => {
  const trimmed = content.trim();
  if (!trimmed) {
    return '';
  }
  return trimmed.length > 1200 ? `${trimmed.slice(0, 1200)}...(truncated)` : trimmed;
};

const parseJsonResponse = <T>(content: string): T => {
  try {
    const jsonText = extractJsonText(content);
    return JSON.parse(jsonText) as T;
  } catch (error) {
    if (error instanceof InternalAiJsonParseError) {
      throw error;
    }
    const message = (error as Error)?.message || 'AI 返回不是有效 JSON';
    throw new InternalAiJsonParseError(message, content);
  }
};

const supportsJsonResponseFormat = (baseUrl: string, model: string) => {
  const normalizedBaseUrl = baseUrl.toLowerCase();
  const normalizedModel = model.toLowerCase();
  return (
    normalizedBaseUrl.includes('api.openai.com') ||
    normalizedBaseUrl.includes('api.deepseek.com') ||
    normalizedModel.startsWith('gpt-') ||
    normalizedModel.startsWith('o1') ||
    normalizedModel.startsWith('o3') ||
    normalizedModel.startsWith('o4') ||
    normalizedModel.startsWith('deepseek-')
  );
};

const isUnsupportedJsonModeResponse = (error: unknown) => {
  const responseStatus = (error as { response?: { status?: number } })?.response?.status;
  if (responseStatus !== 400 && responseStatus !== 422) {
    return false;
  }
  const message =
    (error as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data?.error
      ?.message ||
    (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
    (error as Error)?.message ||
    '';
  return /response_format|json_object|json_schema|unsupported|invalid/i.test(message);
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
  const jsonModePreferred = supportsJsonResponseFormat(account.baseUrl, model);
  const messageCharCount = getAiMessagesCharCount(messages);
  const messageCharBreakdown = messages.map(item => ({
    role: item.role,
    chars: String(item.content || '').length,
  }));

  logAiEvent(traceId, 'request', {
    toolName,
    account: maskAiAccountForLog(account),
    model,
    temperature: options?.temperature ?? 0.2,
    timeoutMs: INTERNAL_AI_TIMEOUT_MS,
    maxRetries: INTERNAL_AI_MAX_RETRIES,
    messageCount: messages.length,
    messageCharCount,
    messageCharBreakdown,
    messages: serializeAiMessagesForLog(messages),
  });

  for (let attempt = 1; attempt <= INTERNAL_AI_MAX_RETRIES; attempt += 1) {
    let useJsonResponseFormat = jsonModePreferred;
    try {
      const requestBody: Record<string, unknown> = {
        model,
        temperature: options?.temperature ?? 0.2,
        messages,
      };

      if (useJsonResponseFormat) {
        requestBody.response_format = {
          type: 'json_object',
        };
      }

      const response = await request.post(buildChatCompletionsUrl(account.baseUrl), requestBody, {
        timeout: INTERNAL_AI_TIMEOUT_MS,
        headers: {
          Authorization: `Bearer ${account.apiKey}`,
          'Content-Type': 'application/json',
        },
      });

      const content = getTextFromMessageContent(response.data?.choices?.[0]?.message?.content);
      const parsed = parseJsonResponse<T>(content);

      logAiEvent(traceId, 'response', {
        toolName,
        model,
        attempt,
        elapsedMs: Date.now() - startedAt,
        responseFormat: useJsonResponseFormat ? 'json_object' : 'none',
        content,
        parsed,
      });

      return parsed;
    } catch (error) {
      if (useJsonResponseFormat && isUnsupportedJsonModeResponse(error)) {
        logAiEvent(traceId, 'retry', {
          toolName,
          model,
          attempt,
          elapsedMs: Date.now() - startedAt,
          timeoutMs: INTERNAL_AI_TIMEOUT_MS,
          messageCount: messages.length,
          messageCharCount,
          messageCharBreakdown,
          shouldRetry: true,
          errorCode: UNSUPPORTED_JSON_MODE_CODE,
          errorMessage: '当前 AI 服务不支持 response_format=json_object，自动降级为普通模式重试',
        });
        useJsonResponseFormat = false;
        try {
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
          const parsed = parseJsonResponse<T>(content);

          logAiEvent(traceId, 'response', {
            toolName,
            model,
            attempt,
            elapsedMs: Date.now() - startedAt,
            responseFormat: 'none',
            content,
            parsed,
          });

          return parsed;
        } catch (fallbackError) {
          error = fallbackError;
        }
      }

      const responseStatus = (error as { response?: { status?: number } })?.response?.status;
      const message =
        (error as { response?: { data?: { error?: { message?: string }; message?: string } } })?.response?.data?.error
          ?.message ||
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        (error as Error)?.message ||
        'AI 服务调用失败';
      const errorCode = (error as { code?: string })?.code || '';
      const rawContent = error instanceof InternalAiJsonParseError ? getRawContentPreview(error.rawContent) : undefined;
      const isTimeout = /timeout/i.test(message);
      const isAborted = /aborted/i.test(message);
      const shouldRetry =
        attempt < INTERNAL_AI_MAX_RETRIES &&
        (errorCode === 'ECONNRESET' ||
          errorCode === 'ETIMEDOUT' ||
          errorCode === 'ECONNABORTED' ||
          errorCode === INVALID_JSON_RESPONSE_CODE ||
          isTimeout ||
          responseStatus === 429 ||
          (typeof responseStatus === 'number' && responseStatus >= 500));

      logAiEvent(traceId, shouldRetry ? 'retry' : 'error', {
        toolName,
        model,
        attempt,
        maxRetries: INTERNAL_AI_MAX_RETRIES,
        elapsedMs: Date.now() - startedAt,
        timeoutMs: INTERNAL_AI_TIMEOUT_MS,
        messageCount: messages.length,
        messageCharCount,
        messageCharBreakdown,
        errorName: (error as { name?: string })?.name || '',
        errorCode,
        responseStatus,
        isTimeout,
        isAborted,
        shouldRetry,
        errorMessage: message,
        responseFormat: useJsonResponseFormat ? 'json_object' : 'none',
        rawContent,
        responseData: (error as { response?: { data?: unknown } })?.response?.data,
      });

      if (!shouldRetry) {
        badRequest(`AI 服务调用失败: ${message}`);
        throw new Error('unreachable');
      }

      const delayMs = INTERNAL_AI_RETRY_DELAY_MS * attempt;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  badRequest('AI 服务调用失败: 超过最大重试次数');
  throw new Error('unreachable');
};
