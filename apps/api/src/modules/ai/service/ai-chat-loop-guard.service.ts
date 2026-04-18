import type { AiToolCall } from '@volix/types';

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([left], [right]) =>
      left.localeCompare(right)
    );
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stableStringify(item)}`).join(',')}}`;
  }
  return JSON.stringify(value);
};

const isImageResult = (result: unknown): result is { kind?: string; fileName?: string } => {
  return Boolean(result && typeof result === 'object' && (result as { kind?: string }).kind === 'image');
};

export const findRepeatedReadToolCall = (toolCalls: AiToolCall[], toolName: string, args: Record<string, unknown>) => {
  const targetArgs = stableStringify(args || {});

  for (const toolCall of toolCalls) {
    if (toolCall.status !== 'completed') {
      continue;
    }
    if (toolCall.toolName !== toolName) {
      continue;
    }
    if (stableStringify(toolCall.arguments || {}) !== targetArgs) {
      continue;
    }
    return toolCall;
  }

  return null;
};

export const buildAiAssistantReplyFromToolResult = (toolName: string, result: unknown) => {
  if (toolName === 'openlist.pick_random_image' && isImageResult(result)) {
    return `已经为你随机挑好了一张图片，见下方图片卡片。`;
  }

  return '我已经拿到结果了，见下方附加结果。';
};
