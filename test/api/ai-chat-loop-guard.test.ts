import type { AiToolCall } from '@volix/types';
import {
  buildAiAssistantReplyFromToolResult,
  findRepeatedReadToolCall,
} from '../../apps/api/src/modules/ai/service/ai-chat-loop-guard.service';

const createToolCall = (overrides: Partial<AiToolCall> = {}): AiToolCall => ({
  id: 'tc-1',
  conversationId: 'conv-1',
  runId: 'run-1',
  toolName: 'openlist.pick_random_image',
  riskLevel: 'read',
  status: 'completed',
  requiresApproval: false,
  arguments: {
    path: '/对象储存R2/img',
  },
  result: {
    kind: 'image',
    imageUrl: '/file/cached.demo.jpg',
    fileName: 'demo.jpg',
  },
  errorMessage: null,
  startedAt: '2026-04-18T00:00:00.000Z',
  finishedAt: '2026-04-18T00:00:01.000Z',
  createdAt: '2026-04-18T00:00:00.000Z',
  updatedAt: '2026-04-18T00:00:01.000Z',
  ...overrides,
});

describe('ai chat loop guard', () => {
  test('detects repeated completed read tool call with the same arguments', () => {
    const repeated = findRepeatedReadToolCall(
      [
        createToolCall(),
        createToolCall({
          id: 'tc-2',
          toolName: 'openlist.list_path_items',
          arguments: { path: '/对象储存R2' },
        }),
      ],
      'openlist.pick_random_image',
      { path: '/对象储存R2/img' }
    );

    expect(repeated?.id).toBe('tc-1');
  });

  test('does not match failed or different argument tool calls', () => {
    const repeated = findRepeatedReadToolCall(
      [
        createToolCall({
          id: 'tc-1',
          status: 'failed',
        }),
        createToolCall({
          id: 'tc-2',
          arguments: { path: '/对象储存R2/other' },
        }),
      ],
      'openlist.pick_random_image',
      { path: '/对象储存R2/img' }
    );

    expect(repeated).toBeNull();
  });

  test('builds a direct natural-language reply for cached image results', () => {
    const reply = buildAiAssistantReplyFromToolResult('openlist.pick_random_image', createToolCall().result);

    expect(reply).toContain('随机挑好了一张图片');
  });
});
