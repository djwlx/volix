import { http } from '@/utils';
import { getAuthToken, getTokenHeaderKey } from '@/utils/auth';
import type {
  AiConversationDetail,
  AiConversationListResponse,
  AiEvent,
  AiEventListResponse,
  AiMessageListResponse,
  AiRun,
  AiRunListResponse,
  AiToolCall,
  AiToolCallListResponse,
  AiToolDefinitionListResponse,
  ApproveAiToolCallPayload,
  CreateAiConversationPayload,
  DeleteAiConversationResponse,
  RetryAiRunResponse,
  SendAiMessagePayload,
  SendAiMessageResponse,
} from '@volix/types';

export const listAiTools = () => {
  return http.get<AiToolDefinitionListResponse>('/ai/tools');
};

export const listAiConversations = () => {
  return http.get<AiConversationListResponse>('/ai/conversations');
};

export const createAiConversation = (data?: CreateAiConversationPayload) => {
  return http.post<AiConversationDetail>('/ai/conversations', data);
};

export const getAiConversationDetail = (id: string) => {
  return http.get<AiConversationDetail>(`/ai/conversations/${id}`);
};

export const deleteAiConversation = (id: string) => {
  return http.delete<DeleteAiConversationResponse>(`/ai/conversations/${id}`);
};

export const listAiConversationMessages = (id: string) => {
  return http.get<AiMessageListResponse>(`/ai/conversations/${id}/messages`);
};

export const listAiConversationRuns = (id: string) => {
  return http.get<AiRunListResponse>(`/ai/conversations/${id}/runs`);
};

export const listAiConversationToolCalls = (id: string) => {
  return http.get<AiToolCallListResponse>(`/ai/conversations/${id}/tool-calls`);
};

export const listAiConversationEvents = (id: string, afterSequence = 0) => {
  return http.get<AiEventListResponse>(`/ai/conversations/${id}/events`, {
    params: {
      afterSequence,
    },
  });
};

export const sendAiConversationMessage = (id: string, data: SendAiMessagePayload) => {
  return http.post<SendAiMessageResponse>(`/ai/conversations/${id}/messages`, data);
};

export const approveAiToolCall = (id: string, data: ApproveAiToolCallPayload) => {
  return http.post<AiToolCall>(`/ai/tool-calls/${id}/approve`, data);
};

export const retryAiRun = (id: string) => {
  return http.post<RetryAiRunResponse>(`/ai/runs/${id}/retry`);
};

export const toLatestAiRun = (runs: AiRun[]) => {
  return runs
    .slice()
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .at(-1);
};

const parseSseEventBlock = (block: string) => {
  const lines = block.split('\n');
  let eventName = 'message';
  let data = '';

  for (const line of lines) {
    if (!line || line.startsWith(':')) {
      continue;
    }
    if (line.startsWith('event:')) {
      eventName = line.slice('event:'.length).trim();
      continue;
    }
    if (line.startsWith('data:')) {
      data += `${line.slice('data:'.length).trim()}\n`;
    }
  }

  if (!data.trim()) {
    return null;
  }

  return {
    event: eventName,
    data: JSON.parse(data.trim()) as AiEvent,
  };
};

export const streamAiConversation = async (
  id: string,
  options: {
    afterSequence?: number;
    signal?: AbortSignal;
    onOpen?: () => void;
    onHistoryEnd?: () => void;
    onEvent: (event: AiEvent) => void;
  }
) => {
  const token = getAuthToken();
  const response = await fetch(`/api/ai/conversations/${id}/stream?afterSequence=${options.afterSequence || 0}`, {
    method: 'GET',
    headers: {
      Accept: 'text/event-stream',
      ...(token ? { [getTokenHeaderKey()]: token } : {}),
    },
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE 连接失败: ${response.status}`);
  }

  options.onOpen?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    const result = await reader.read();
    if (result.done) {
      break;
    }

    buffer += decoder.decode(result.value, { stream: true });
    const blocks = buffer.split('\n\n');
    buffer = blocks.pop() || '';

    for (const block of blocks) {
      const parsed = parseSseEventBlock(block);
      if (parsed?.event === 'ping' || parsed?.event === 'ready') {
        continue;
      }
      if (parsed?.event === 'history_end') {
        options.onHistoryEnd?.();
        continue;
      }
      if (parsed) {
        options.onEvent(parsed.data);
      }
    }
  }
};
