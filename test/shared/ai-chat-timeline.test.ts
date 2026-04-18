import type { AiChatMessage, AiToolCall } from '@volix/types';
import { buildAiChatTimeline } from '../../apps/web-pc/src/apps/ai-chat/timeline';

const createMessage = (
  partial: Partial<AiChatMessage> & Pick<AiChatMessage, 'id' | 'role' | 'content'>
): AiChatMessage => ({
  conversationId: 'conv-1',
  status: 'completed',
  createdAt: '2026-04-18T00:00:00.000Z',
  updatedAt: '2026-04-18T00:00:00.000Z',
  ...partial,
});

const createToolCall = (
  partial: Partial<AiToolCall> & Pick<AiToolCall, 'id' | 'runId' | 'toolName' | 'status'>
): AiToolCall => ({
  conversationId: 'conv-1',
  riskLevel: 'read',
  requiresApproval: false,
  arguments: {},
  createdAt: '2026-04-18T00:00:00.000Z',
  updatedAt: '2026-04-18T00:00:00.000Z',
  ...partial,
});

describe('ai chat timeline', () => {
  test('keeps tool calls as message attachments instead of standalone bubbles', () => {
    const messages: AiChatMessage[] = [
      createMessage({
        id: 'm1',
        role: 'user',
        content: '帮我找图',
        runId: 'run-1',
        createdAt: '2026-04-18T00:00:00.000Z',
      }),
      createMessage({
        id: 'm2',
        role: 'tool',
        content: '{"toolName":"openlist.pick_random_image","result":{"imageUrl":"https://a"}}',
        runId: 'run-1',
        toolCallId: 'tc-1',
        createdAt: '2026-04-18T00:00:01.000Z',
      }),
      createMessage({
        id: 'm3',
        role: 'assistant',
        content: '我帮你随机找了一张图。',
        runId: 'run-1',
        createdAt: '2026-04-18T00:00:02.000Z',
      }),
      createMessage({
        id: 'm4',
        role: 'user',
        content: '再执行一个需要审批的操作',
        runId: 'run-2',
        createdAt: '2026-04-18T00:01:00.000Z',
      }),
    ];

    const toolCalls: AiToolCall[] = [
      createToolCall({
        id: 'tc-1',
        runId: 'run-1',
        toolName: 'openlist.pick_random_image',
        status: 'completed',
        createdAt: '2026-04-18T00:00:01.000Z',
      }),
      createToolCall({
        id: 'tc-2',
        runId: 'run-2',
        toolName: 'openlist.execute_plan',
        status: 'waiting_approval',
        requiresApproval: true,
        createdAt: '2026-04-18T00:01:01.000Z',
      }),
    ];

    const timeline = buildAiChatTimeline(messages, toolCalls);

    expect(timeline.map(item => item.message.id)).toEqual(['m1', 'm3', 'm4']);
    expect(timeline.find(item => item.message.id === 'm3')?.attachedToolCalls.map(item => item.id)).toEqual(['tc-1']);
    expect(timeline.find(item => item.message.id === 'm4')?.attachedToolCalls.map(item => item.id)).toEqual(['tc-2']);
  });
});
