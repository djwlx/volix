import type { AiChatMessage, AiToolCall } from '@volix/types';

export interface AiTimelineItem {
  message: AiChatMessage;
  attachedToolCalls: AiToolCall[];
}

const sortByCreatedAtAsc = <T extends { createdAt: string }>(list: T[]) => {
  return list.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

const resolveAnchorMessageId = (messages: AiChatMessage[], runId?: string | null) => {
  const candidates = runId ? messages.filter(item => item.runId === runId) : messages;
  if (!candidates.length) {
    return '';
  }

  const assistantMessages = candidates.filter(item => item.role === 'assistant');
  if (assistantMessages.length) {
    return assistantMessages[assistantMessages.length - 1].id;
  }

  return candidates[candidates.length - 1].id;
};

export const buildAiChatTimeline = (messages: AiChatMessage[], toolCalls: AiToolCall[]): AiTimelineItem[] => {
  const visibleMessages = sortByCreatedAtAsc(messages).filter(item => item.role !== 'system' && item.role !== 'tool');
  const attachments = new Map<string, AiToolCall[]>();

  sortByCreatedAtAsc(toolCalls).forEach(toolCall => {
    const anchorMessageId = resolveAnchorMessageId(visibleMessages, toolCall.runId);
    if (!anchorMessageId) {
      return;
    }
    const current = attachments.get(anchorMessageId) || [];
    current.push(toolCall);
    attachments.set(anchorMessageId, current);
  });

  return visibleMessages.map(message => ({
    message,
    attachedToolCalls: attachments.get(message.id) || [],
  }));
};
