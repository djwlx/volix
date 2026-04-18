import { describe, expect, test } from 'vitest';
import {
  applyConversationDeletion,
  getFallbackConversationId,
  toggleConversationSelection,
  updateSelectionForVisibleConversations,
} from '../../apps/web-pc/src/apps/ai-chat/conversation-selection';

describe('toggleConversationSelection', () => {
  test('adds and removes a conversation id without duplicating selections', () => {
    expect(toggleConversationSelection([], 'conv-1')).toEqual(['conv-1']);
    expect(toggleConversationSelection(['conv-1'], 'conv-1')).toEqual([]);
    expect(toggleConversationSelection(['conv-1'], 'conv-2')).toEqual(['conv-1', 'conv-2']);
  });
});

describe('updateSelectionForVisibleConversations', () => {
  test('selects all visible ids and preserves hidden selections', () => {
    expect(updateSelectionForVisibleConversations(['hidden-1'], ['conv-1', 'conv-2'], true)).toEqual([
      'hidden-1',
      'conv-1',
      'conv-2',
    ]);
  });

  test('clears only visible ids when cancelling visible selection', () => {
    expect(
      updateSelectionForVisibleConversations(['hidden-1', 'conv-1', 'conv-2'], ['conv-1', 'conv-2'], false)
    ).toEqual(['hidden-1']);
  });
});

describe('getFallbackConversationId', () => {
  test('prefers the next visible conversation after a deleted active conversation', () => {
    expect(getFallbackConversationId(['conv-1', 'conv-2', 'conv-3'], ['conv-2'], 'conv-2')).toBe('conv-3');
  });

  test('falls back to the previous visible conversation when there is no next item', () => {
    expect(getFallbackConversationId(['conv-1', 'conv-2'], ['conv-2'], 'conv-2')).toBe('conv-1');
  });

  test('falls back to the first remaining visible conversation when multiple earlier items are removed', () => {
    expect(
      getFallbackConversationId(['conv-1', 'conv-2', 'conv-3', 'conv-4'], ['conv-1', 'conv-2', 'conv-3'], 'conv-2')
    ).toBe('conv-4');
  });

  test('returns empty string when the active conversation is not deleted', () => {
    expect(getFallbackConversationId(['conv-1', 'conv-2'], ['conv-1'], 'conv-2')).toBe('');
  });
});

describe('applyConversationDeletion', () => {
  test('removes deleted ids and clears deleted selections', () => {
    expect(
      applyConversationDeletion({
        conversations: [
          { id: 'conv-1', title: 'A' },
          { id: 'conv-2', title: 'B' },
          { id: 'conv-3', title: 'C' },
        ],
        selectedIds: ['conv-1', 'conv-2'],
        deletedIds: ['conv-2'],
      })
    ).toEqual({
      conversations: [
        { id: 'conv-1', title: 'A' },
        { id: 'conv-3', title: 'C' },
      ],
      selectedIds: ['conv-1'],
    });
  });
});
