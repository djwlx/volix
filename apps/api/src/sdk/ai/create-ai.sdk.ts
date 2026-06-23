import type { AxiosRequestConfig } from 'axios';
import request from '../../utils/request';

export interface CreateAiSdkOptions {
  baseUrl: string;
  apiKey?: string;
  model?: string;
}

export interface AiChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
}

export interface AiChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  /** Extra OpenAI-compatible body fields (top_p, response_format, etc.). */
  extra?: Record<string, unknown>;
  /** Override request timeout in milliseconds. */
  timeout?: number;
}

interface OpenAiModelListResponse {
  data?: Array<{ id?: string }>;
}

export interface AiChatCompletionResponse {
  choices?: Array<{ message?: { role?: string; content?: string } }>;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
  [key: string]: unknown;
}

const DEFAULT_TIMEOUT = 60000;

const normalizeBaseUrl = (baseUrl: string) =>
  String(baseUrl || '')
    .trim()
    .replace(/\/+$/, '');

export function createAiSdk(options: CreateAiSdkOptions) {
  const baseUrl = normalizeBaseUrl(options.baseUrl);
  const apiKey = String(options.apiKey || '').trim();
  const defaultModel = String(options.model || '').trim();

  const buildHeaders = () => ({
    Accept: 'application/json',
    ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
  });

  const listModels = async (): Promise<string[]> => {
    const config: AxiosRequestConfig = {
      baseURL: baseUrl,
      url: '/models',
      method: 'GET',
      timeout: 15000,
      headers: buildHeaders(),
    };

    const response = await request<OpenAiModelListResponse>(config);
    const list = Array.isArray(response.data?.data) ? response.data.data : [];
    return list.map(item => String(item?.id || '').trim()).filter(Boolean);
  };

  const chatCompletion = async (
    messages: AiChatMessage[],
    chatOptions?: AiChatOptions
  ): Promise<AiChatCompletionResponse> => {
    const model = String(chatOptions?.model || defaultModel || '').trim();
    if (!model) {
      throw new Error('AI model is required');
    }

    const config: AxiosRequestConfig = {
      baseURL: baseUrl,
      url: '/chat/completions',
      method: 'POST',
      timeout: chatOptions?.timeout || DEFAULT_TIMEOUT,
      headers: buildHeaders(),
      data: {
        model,
        messages,
        ...(chatOptions?.temperature !== undefined ? { temperature: chatOptions.temperature } : {}),
        ...(chatOptions?.maxTokens !== undefined ? { max_tokens: chatOptions.maxTokens } : {}),
        ...(chatOptions?.extra || {}),
      },
    };

    const response = await request<AiChatCompletionResponse>(config);
    return response.data;
  };

  const chat = async (messages: AiChatMessage[], chatOptions?: AiChatOptions): Promise<string> => {
    const completion = await chatCompletion(messages, chatOptions);
    return String(completion.choices?.[0]?.message?.content || '').trim();
  };

  return {
    baseUrl,
    model: defaultModel,
    listModels,
    chatCompletion,
    chat,
  };
}

export type AiSdk = ReturnType<typeof createAiSdk>;
