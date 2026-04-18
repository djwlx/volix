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

export const getFallbackConversationId = (visibleIds: string[], deletedIds: string[], activeConversationId: string) => {
  if (!activeConversationId || !deletedIds.includes(activeConversationId)) {
    return '';
  }

  const currentIndex = visibleIds.findIndex(id => id === activeConversationId);
  const remainingVisibleIds = visibleIds.filter(id => !deletedIds.includes(id));

  return remainingVisibleIds[currentIndex] || remainingVisibleIds[currentIndex - 1] || remainingVisibleIds[0] || '';
};

export const applyConversationDeletion = <T extends { id: string }>(params: {
  conversations: T[];
  selectedIds: string[];
  deletedIds: string[];
}) => {
  return {
    conversations: params.conversations.filter(item => !params.deletedIds.includes(item.id)),
    selectedIds: params.selectedIds.filter(id => !params.deletedIds.includes(id)),
  };
};
