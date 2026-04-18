# AI Chat Bulk Delete Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a bulk-selection mode to the AI conversation list so users can select multiple conversations and delete them while preserving the existing single-delete flow.

**Architecture:** Keep the backend unchanged and implement bulk deletion entirely in the web app by reusing the existing single-conversation delete API. Extract selection and post-delete fallback logic into a small pure helper module so we can cover the risky state transitions with unit tests before wiring the UI.

**Tech Stack:** React 18, TypeScript, Semi UI, SCSS modules, Vitest

---

### Task 1: Extract and test conversation selection helpers

**Files:**
- Create: `apps/web-pc/src/apps/ai-chat/conversation-selection.ts`
- Create: `test/shared/ai-chat-conversation-selection.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
    expect(updateSelectionForVisibleConversations(['hidden-1', 'conv-1', 'conv-2'], ['conv-1', 'conv-2'], false)).toEqual([
      'hidden-1',
    ]);
  });
});

describe('getFallbackConversationId', () => {
  test('prefers the next visible conversation after a deleted active conversation', () => {
    expect(getFallbackConversationId(['conv-1', 'conv-2', 'conv-3'], ['conv-2'], 'conv-2')).toBe('conv-3');
  });

  test('falls back to the previous visible conversation when there is no next item', () => {
    expect(getFallbackConversationId(['conv-1', 'conv-2'], ['conv-2'], 'conv-2')).toBe('conv-1');
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test test/shared/ai-chat-conversation-selection.test.ts`
Expected: FAIL because `conversation-selection.ts` does not exist yet

- [ ] **Step 3: Write minimal implementation**

```ts
import type { AiConversationSummary } from '@volix/types';

export const toggleConversationSelection = (selectedIds: string[], conversationId: string) => {
  return selectedIds.includes(conversationId)
    ? selectedIds.filter(item => item !== conversationId)
    : [...selectedIds, conversationId];
};

export const updateSelectionForVisibleConversations = (
  selectedIds: string[],
  visibleIds: string[],
  shouldSelect: boolean
) => {
  const hiddenIds = selectedIds.filter(id => !visibleIds.includes(id));
  return shouldSelect ? [...hiddenIds, ...visibleIds] : hiddenIds;
};

export const getFallbackConversationId = (
  visibleIds: string[],
  deletedIds: string[],
  activeConversationId: string
) => {
  if (!activeConversationId || !deletedIds.includes(activeConversationId)) {
    return '';
  }

  const currentIndex = visibleIds.findIndex(id => id === activeConversationId);
  const remainingVisibleIds = visibleIds.filter(id => !deletedIds.includes(id));

  return remainingVisibleIds[currentIndex] || remainingVisibleIds[currentIndex - 1] || remainingVisibleIds[0] || '';
};

export const applyConversationDeletion = (params: {
  conversations: Pick<AiConversationSummary, 'id' | 'title'>[];
  selectedIds: string[];
  deletedIds: string[];
}) => {
  return {
    conversations: params.conversations.filter(item => !params.deletedIds.includes(item.id)),
    selectedIds: params.selectedIds.filter(id => !params.deletedIds.includes(id)),
  };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test test/shared/ai-chat-conversation-selection.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add test/shared/ai-chat-conversation-selection.test.ts apps/web-pc/src/apps/ai-chat/conversation-selection.ts
git commit -m "test: cover ai chat conversation bulk selection helpers"
```

### Task 2: Wire bulk selection state into the AI chat sidebar

**Files:**
- Modify: `apps/web-pc/src/apps/ai-chat/index.tsx`
- Modify: `apps/web-pc/src/apps/ai-chat/index.module.scss`
- Use: `apps/web-pc/src/apps/ai-chat/conversation-selection.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('getFallbackConversationId returns the next remaining visible conversation after bulk delete', () => {
  expect(getFallbackConversationId(['conv-1', 'conv-2', 'conv-3'], ['conv-2'], 'conv-2')).toBe('conv-3');
});
```

This test already exists in `test/shared/ai-chat-conversation-selection.test.ts` and protects the most failure-prone state transition before the UI is wired.

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test test/shared/ai-chat-conversation-selection.test.ts -t "getFallbackConversationId returns the next remaining visible conversation after bulk delete"`
Expected: PASS only after Task 1 implementation; if it fails, do not proceed until the helper is correct

- [ ] **Step 3: Write minimal implementation**

```tsx
const [bulkMode, setBulkMode] = useState(false);
const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
const [bulkDeleting, setBulkDeleting] = useState(false);

const visibleConversationIds = useMemo(() => filteredConversations.map(item => item.id), [filteredConversations]);
const selectedVisibleCount = useMemo(
  () => visibleConversationIds.filter(id => selectedConversationIds.includes(id)).length,
  [visibleConversationIds, selectedConversationIds]
);
const allVisibleSelected = visibleConversationIds.length > 0 && selectedVisibleCount === visibleConversationIds.length;

const onToggleBulkMode = () => {
  if (bulkDeleting) return;
  setBulkMode(current => {
    if (current) setSelectedConversationIds([]);
    return !current;
  });
};

const onToggleConversationSelection = (conversationId: string) => {
  setSelectedConversationIds(current => toggleConversationSelection(current, conversationId));
};

const onSelectVisibleConversations = (shouldSelect: boolean) => {
  setSelectedConversationIds(current =>
    updateSelectionForVisibleConversations(current, visibleConversationIds, shouldSelect)
  );
};
```

Add a bulk toolbar in `renderConversationList()` with:

```tsx
{bulkMode ? (
  <div className={styles.bulkToolbar}>
    <div className={styles.bulkSummary}>已选 {selectedConversationIds.length} 项</div>
    <Space wrap>
      <Button size="small" disabled={bulkDeleting || !visibleConversationIds.length} onClick={() => onSelectVisibleConversations(true)}>
        全选
      </Button>
      <Button size="small" disabled={bulkDeleting || !selectedVisibleCount} onClick={() => onSelectVisibleConversations(false)}>
        取消全选
      </Button>
      <Popconfirm
        title={`确定删除已选的 ${selectedConversationIds.length} 条会话？`}
        content="会同时删除消息、工具记录和运行记录，此操作不可恢复。"
        onConfirm={() => void onBulkDeleteConversations()}
      >
        <Button theme="solid" type="danger" disabled={bulkDeleting || !selectedConversationIds.length} loading={bulkDeleting}>
          删除所选
        </Button>
      </Popconfirm>
      <Button size="small" disabled={bulkDeleting} onClick={onToggleBulkMode}>
        退出批量模式
      </Button>
    </Space>
  </div>
) : (
  <div className={styles.sidebarActions}>
    <Button size="small" theme="light" onClick={onToggleBulkMode}>
      批量管理
    </Button>
  </div>
)}
```

Render each conversation item with a checkbox when `bulkMode` is active, and switch the card click handler to selection mode:

```tsx
onClick={() => {
  if (bulkMode) {
    onToggleConversationSelection(item.id);
    return;
  }
  setActiveConversationId(item.id);
  setMobileSidebarVisible(false);
}}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test test/shared/ai-chat-conversation-selection.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web-pc/src/apps/ai-chat/index.tsx apps/web-pc/src/apps/ai-chat/index.module.scss
git commit -m "feat: add ai chat bulk selection mode"
```

### Task 3: Implement bulk delete state reconciliation and verification

**Files:**
- Modify: `apps/web-pc/src/apps/ai-chat/index.tsx`
- Modify: `apps/web-pc/src/apps/ai-chat/conversation-selection.ts`
- Test: `test/shared/ai-chat-conversation-selection.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('getFallbackConversationId falls back to the first remaining visible conversation when multiple earlier items are removed', () => {
  expect(getFallbackConversationId(['conv-1', 'conv-2', 'conv-3', 'conv-4'], ['conv-1', 'conv-2', 'conv-3'], 'conv-2')).toBe(
    'conv-4'
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test test/shared/ai-chat-conversation-selection.test.ts -t "falls back to the first remaining visible conversation"`
Expected: FAIL if the helper does not yet cover this edge case

- [ ] **Step 3: Write minimal implementation**

```tsx
const clearConversationState = () => {
  setMessages([]);
  setRuns([]);
  setToolCalls([]);
  lastSequenceRef.current = 0;
  streamAbortRef.current?.abort();
  setStreamConnected(false);
};

const onBulkDeleteConversations = async () => {
  const targetIds = selectedConversationIds.slice();
  const fallbackConversationId = getFallbackConversationId(visibleConversationIds, targetIds, activeConversationId);
  let successCount = 0;
  let failureCount = 0;
  const deletedIds: string[] = [];

  try {
    setBulkDeleting(true);

    for (const conversationId of targetIds) {
      try {
        await deleteAiConversation(conversationId);
        deletedIds.push(conversationId);
        successCount += 1;
      } catch {
        failureCount += 1;
      }
    }

    if (deletedIds.length) {
      setConversations(current => applyConversationDeletion({ conversations: current, selectedIds: [], deletedIds }).conversations);
      setSelectedConversationIds(current => applyConversationDeletion({ conversations: [], selectedIds: current, deletedIds }).selectedIds);

      if (activeConversationId && deletedIds.includes(activeConversationId)) {
        if (fallbackConversationId) {
          setActiveConversationId(fallbackConversationId);
        } else {
          setActiveConversationId('');
          clearConversationState();
        }
      }
    }

    if (!failureCount) {
      Toast.success(`已删除 ${successCount} 条会话`);
    } else if (successCount) {
      Toast.warning(`成功删除 ${successCount} 条，失败 ${failureCount} 条`);
    } else {
      Toast.error('批量删除失败');
    }

    if (!filteredConversations.length) {
      setBulkMode(false);
    }
  } finally {
    setBulkDeleting(false);
  }
};
```

Refine the state reconciliation so:
- successful deletions are removed from both `conversations` and `selectedConversationIds`
- failed deletions remain selected
- bulk mode exits only when there are no conversations left after deletion

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test test/shared/ai-chat-conversation-selection.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add apps/web-pc/src/apps/ai-chat/index.tsx apps/web-pc/src/apps/ai-chat/conversation-selection.ts test/shared/ai-chat-conversation-selection.test.ts
git commit -m "feat: add ai chat bulk delete flow"
```

### Task 4: Verify the shipped behavior

**Files:**
- Verify: `apps/web-pc/src/apps/ai-chat/index.tsx`
- Verify: `apps/web-pc/src/apps/ai-chat/index.module.scss`
- Verify: `apps/web-pc/src/apps/ai-chat/conversation-selection.ts`
- Verify: `test/shared/ai-chat-conversation-selection.test.ts`

- [ ] **Step 1: Run targeted tests**

Run: `pnpm test test/shared/ai-chat-conversation-selection.test.ts`
Expected: PASS

- [ ] **Step 2: Run the web app build**

Run: `pnpm --filter @volix/web-pc build`
Expected: exit code `0`

- [ ] **Step 3: Manual regression checklist**

Verify in the AI chat page:

- single delete still works outside bulk mode
- `批量管理` enters selection mode
- checkbox selection updates `已选 N 项`
- `全选` only selects the currently filtered conversations
- `删除所选` removes successful items and preserves failed ones
- deleting the active conversation switches to the next or previous remaining conversation

- [ ] **Step 4: Commit**

```bash
git add docs/superpowers/plans/2026-04-18-ai-chat-bulk-delete.md
git commit -m "docs: add ai chat bulk delete implementation plan"
```
