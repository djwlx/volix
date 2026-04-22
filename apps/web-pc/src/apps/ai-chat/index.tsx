import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AIChatDialogue,
  AIChatInput,
  Badge,
  Button,
  Checkbox,
  Empty,
  Image,
  Input,
  Modal,
  Popconfirm,
  SideSheet,
  Space,
  Tag,
  Toast,
} from '@douyinfe/semi-ui';
import { IconComment, IconDelete, IconMenu, IconPlus, IconRefresh } from '@douyinfe/semi-icons';
import type { MessageContent, Content as AIInputContent } from '@douyinfe/semi-ui/lib/es/aiChatInput/interface';
import type {
  Message as SemiChatMessage,
  RenderActionProps,
  RenderContentProps,
  RoleConfig,
} from '@douyinfe/semi-ui/lib/es/aiChatDialogue/interface';
import { useNavigate } from 'react-router';
import { Loading } from '@/components';
import { useUser } from '@/hooks';
import { isAuthenticated } from '@/utils';
import {
  approveAiToolCall,
  createAiConversation,
  deleteAiConversation,
  listAiConversationMessages,
  listAiConversationRuns,
  listAiConversationToolCalls,
  listAiConversations,
  retryAiRun,
  sendAiConversationMessage,
  streamAiConversation,
  toLatestAiRun,
} from '@/services/ai';
import type { AiChatMessage, AiConversationSummary, AiEvent, AiRun, AiToolCall } from '@volix/types';
import styles from './index.module.scss';
import {
  applyConversationDeletion,
  getFallbackConversationId,
  toggleConversationSelection,
  updateSelectionForVisibleConversations,
} from './conversation-selection';

const upsertMessage = (list: AiChatMessage[], next: AiChatMessage) => {
  const index = list.findIndex(item => item.id === next.id);
  if (index < 0) {
    return [...list, next];
  }
  const cloned = list.slice();
  cloned[index] = next;
  return cloned;
};

const upsertToolCall = (list: AiToolCall[], next: AiToolCall) => {
  const index = list.findIndex(item => item.id === next.id);
  if (index < 0) {
    return [next, ...list];
  }
  const cloned = list.slice();
  cloned[index] = next;
  return cloned;
};

const upsertRun = (list: AiRun[], next: AiRun) => {
  const index = list.findIndex(item => item.id === next.id);
  if (index < 0) {
    return [...list, next];
  }
  const cloned = list.slice();
  cloned[index] = next;
  return cloned;
};

const parseToolResult = (toolCall: AiToolCall) => {
  const result = toolCall.result as
    | {
        kind?: string;
        imageUrl?: string;
        previewUrl?: string;
        fileName?: string;
        selectedPath?: string;
        rootPath?: string;
        totalImageCount?: number;
      }
    | undefined;

  return {
    resultText: toolCall.result ? JSON.stringify(toolCall.result, null, 2) : '',
    image:
      result?.kind === 'image' && result?.imageUrl
        ? {
            imageUrl: String(result.imageUrl),
            previewUrl: String(result.previewUrl || result.imageUrl),
            fileName: String(result.fileName || '随机图片'),
            selectedPath: String(result.selectedPath || ''),
            rootPath: String(result.rootPath || ''),
            totalImageCount: Number(result.totalImageCount || 0),
          }
        : null,
  };
};

const getInlineImageResults = (toolCalls: AiToolCall[]) => {
  return toolCalls
    .map(toolCall => parseToolResult(toolCall).image)
    .filter((image): image is NonNullable<ReturnType<typeof parseToolResult>['image']> => Boolean(image));
};

const formatVisibleErrorMessage = (value: string) => {
  const text = String(value || '').trim();
  if (!text) {
    return '执行失败';
  }

  if (/<!doctype|<html/i.test(text)) {
    const plainText = text
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (/blocked|拦截|威胁|security/i.test(plainText)) {
      return '请求被上游服务拦截，通常是访问过快触发了频率或安全限制，请稍后再试。';
    }

    return `上游服务返回了异常页面${plainText ? `：${plainText.slice(0, 180)}` : ''}`;
  }

  if (text === 'agent_step_limit_reached') {
    return 'AI 在当前限制步数内没有产出最终回复。你可以直接重试，或者把问题描述得更具体一些。';
  }

  return text.length > 600 ? `${text.slice(0, 600)}...` : text;
};

const formatConversationDate = (value?: string | null) => {
  if (!value) {
    return '刚刚';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '刚刚';
  }

  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const getToolStatusColor = (status: AiToolCall['status']) => {
  if (status === 'waiting_approval') {
    return 'orange';
  }
  if (status === 'failed') {
    return 'red';
  }
  if (status === 'running' || status === 'queued') {
    return 'blue';
  }
  if (status === 'completed') {
    return 'green';
  }
  return 'grey';
};

const getToolStatusLabel = (status: AiToolCall['status']) => {
  if (status === 'waiting_approval') {
    return '等待审批';
  }
  if (status === 'failed') {
    return '执行失败';
  }
  if (status === 'running') {
    return '执行中';
  }
  if (status === 'queued') {
    return '排队中';
  }
  if (status === 'completed') {
    return '已完成';
  }
  if (status === 'rejected') {
    return '已拒绝';
  }
  return status;
};

const extractPlainTextFromInput = (payload: MessageContent) => {
  return (payload.inputContents || [])
    .map((item: AIInputContent) => String((item as { text?: string }).text || '').trim())
    .filter(Boolean)
    .join('\n')
    .trim();
};

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

function AiChatApp() {
  const navigate = useNavigate();
  const { user, loading: userLoading } = useUser();
  const authed = isAuthenticated();
  const [conversations, setConversations] = useState<AiConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [runs, setRuns] = useState<AiRun[]>([]);
  const [toolCalls, setToolCalls] = useState<AiToolCall[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState('');
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedConversationIds, setSelectedConversationIds] = useState<string[]>([]);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [approvingId, setApprovingId] = useState('');
  const [retryingRunId, setRetryingRunId] = useState('');
  const [streamConnected, setStreamConnected] = useState(false);
  const [mobileSidebarVisible, setMobileSidebarVisible] = useState(false);
  const [compactLayout, setCompactLayout] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia('(max-width: 1100px)').matches
  );
  const [toolModalMessageId, setToolModalMessageId] = useState('');
  const lastSequenceRef = useRef(0);
  const replayingHistoryRef = useRef(false);
  const streamAbortRef = useRef<AbortController | null>(null);

  const activeConversation = useMemo(
    () => conversations.find(item => item.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );

  const latestRun = useMemo(() => toLatestAiRun(runs), [runs]);
  const isThinking =
    latestRun?.status === 'queued' || latestRun?.status === 'running' || latestRun?.status === 'waiting_approval';
  const pendingApprovalCount = useMemo(
    () => toolCalls.filter(item => item.status === 'waiting_approval').length,
    [toolCalls]
  );
  const toolCallsByMessageId = useMemo(() => {
    const visibleMessages = sortByCreatedAtAsc(messages).filter(item => item.role !== 'system' && item.role !== 'tool');
    const attached = new Map<string, AiToolCall[]>();

    sortByCreatedAtAsc(toolCalls).forEach(toolCall => {
      const anchorMessageId = resolveAnchorMessageId(visibleMessages, toolCall.runId);
      if (!anchorMessageId) {
        return;
      }
      const current = attached.get(anchorMessageId) || [];
      current.push(toolCall);
      attached.set(anchorMessageId, current);
    });

    return attached;
  }, [messages, toolCalls]);
  const modalToolCalls = toolCallsByMessageId.get(toolModalMessageId) || [];

  const roleConfig = useMemo<RoleConfig>(
    () => ({
      user: {
        name: user?.nickname || user?.email || '你',
        avatar: user?.avatar,
      },
      assistant: {
        name: 'AI 助手',
      },
      system: {
        name: '系统',
      },
    }),
    [user?.avatar, user?.email, user?.nickname]
  );

  const filteredConversations = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) {
      return conversations;
    }
    return conversations.filter(item => item.title.toLowerCase().includes(keyword));
  }, [conversations, search]);

  const visibleConversationIds = useMemo(() => filteredConversations.map(item => item.id), [filteredConversations]);
  const selectedVisibleCount = useMemo(
    () => visibleConversationIds.filter(id => selectedConversationIds.includes(id)).length,
    [visibleConversationIds, selectedConversationIds]
  );
  const allVisibleSelected =
    visibleConversationIds.length > 0 && selectedVisibleCount === visibleConversationIds.length;

  const dialogueChats = useMemo<SemiChatMessage[]>(() => {
    const visibleMessages = sortByCreatedAtAsc(messages).filter(item => item.role !== 'system' && item.role !== 'tool');
    const mapped = visibleMessages.map(message => ({
      id: message.id,
      role: message.role,
      content: message.content,
      createdAt: new Date(message.createdAt).getTime(),
      updatedAt: new Date(message.updatedAt).getTime(),
      status:
        message.status === 'streaming' || message.status === 'pending'
          ? 'in_progress'
          : message.status === 'failed'
          ? 'failed'
          : 'completed',
    }));

    if (latestRun?.status === 'failed') {
      mapped.push({
        id: `run-failed-${latestRun.id}`,
        role: 'assistant',
        content: formatVisibleErrorMessage(latestRun.errorMessage || ''),
        createdAt: new Date(latestRun.updatedAt).getTime(),
        updatedAt: new Date(latestRun.updatedAt).getTime(),
        status: 'failed',
      });
    } else if (isThinking && !mapped.some(item => item.status === 'in_progress')) {
      mapped.push({
        id: `run-thinking-${latestRun?.id || activeConversationId || 'current'}`,
        role: 'assistant',
        content: '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'in_progress',
      });
    }

    return mapped;
  }, [activeConversationId, isThinking, latestRun, messages]);
  const dialogueRenderConfig = useMemo(
    () => ({
      renderDialogueAction: (props: RenderActionProps) => {
        const messageId = props.message?.id || '';
        const attachedToolCalls = toolCallsByMessageId.get(messageId) || [];
        if (!attachedToolCalls.length) {
          return props.defaultActions;
        }

        return (
          <div className={styles.dialogueActions}>
            <Button
              size="small"
              theme="borderless"
              type={attachedToolCalls.some(item => item.status === 'waiting_approval') ? 'primary' : 'tertiary'}
              onClick={() => setToolModalMessageId(messageId)}
            >
              工具执行
            </Button>
          </div>
        );
      },
      renderDialogueContent: (props: RenderContentProps) => {
        const messageId = props.message?.id || '';
        const attachedToolCalls = toolCallsByMessageId.get(messageId) || [];
        const images = getInlineImageResults(attachedToolCalls);

        if (!images.length) {
          return props.defaultContent;
        }

        return (
          <div className={styles.messageContentWithImage}>
            <div>{props.defaultContent}</div>
            <div className={styles.inlineImageList}>
              {images.map(image => (
                <div key={`${messageId}-${image.selectedPath || image.fileName}`} className={styles.inlineImageCard}>
                  <div className={styles.inlineImageHeader}>
                    <div className={styles.inlineImageTitle}>{image.fileName}</div>
                    <div className={styles.inlineImageMeta}>
                      {image.totalImageCount > 0
                        ? `来自 ${image.rootPath}，共命中 ${image.totalImageCount} 张图片`
                        : image.rootPath}
                    </div>
                  </div>
                  <Image className={styles.inlineImage} src={image.previewUrl} preview alt={image.fileName} />
                  {image.selectedPath ? <div className={styles.inlineImagePath}>{image.selectedPath}</div> : null}
                </div>
              ))}
            </div>
          </div>
        );
      },
    }),
    [toolCallsByMessageId]
  );

  const clearConversationState = () => {
    setMessages([]);
    setRuns([]);
    setToolCalls([]);
    lastSequenceRef.current = 0;
    streamAbortRef.current?.abort();
    setStreamConnected(false);
  };

  const refreshConversations = async (preferredId?: string) => {
    const res = await listAiConversations();
    const items = res.data.items || [];
    setConversations(items);
    if (preferredId) {
      setActiveConversationId(preferredId);
      return;
    }
    setActiveConversationId(current => current || items[0]?.id || '');
  };

  const loadConversationState = async (conversationId: string) => {
    const [messageRes, runRes, toolRes] = await Promise.all([
      listAiConversationMessages(conversationId),
      listAiConversationRuns(conversationId),
      listAiConversationToolCalls(conversationId),
    ]);
    setMessages(messageRes.data.items || []);
    setRuns(runRes.data.items || []);
    setToolCalls(toolRes.data.items || []);
    lastSequenceRef.current = 0;
  };

  const handleEvent = (event: AiEvent) => {
    lastSequenceRef.current = Math.max(lastSequenceRef.current, event.sequence);

    if (event.type === 'message.created' || event.type === 'message.completed') {
      const message = event.payload.message as AiChatMessage | undefined;
      if (message) {
        setMessages(current => upsertMessage(current, message));
      }
      void refreshConversations(activeConversationId || undefined);
      return;
    }

    if (event.type.startsWith('run.')) {
      const run = event.payload.run as AiRun | undefined;
      if (run) {
        setRuns(current => upsertRun(current, run));
        if (event.type === 'run.failed' && run.errorMessage && !replayingHistoryRef.current) {
          Toast.error(`AI 执行失败：${formatVisibleErrorMessage(run.errorMessage)}`);
        }
      }
      void refreshConversations(activeConversationId || undefined);
      return;
    }

    if (event.type === 'message.delta') {
      const messageId = String(event.payload.messageId || '');
      const delta = String(event.payload.delta || '');
      if (!messageId || !delta) {
        return;
      }
      setMessages(current => {
        const existing = current.find(item => item.id === messageId);
        if (!existing) {
          return [
            ...current,
            {
              id: messageId,
              conversationId: activeConversationId,
              role: 'assistant',
              content: delta,
              status: 'streaming',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ];
        }
        return upsertMessage(current, {
          ...existing,
          content: `${existing.content}${delta}`,
          status: 'streaming',
          updatedAt: new Date().toISOString(),
        });
      });
      return;
    }

    if (event.type.startsWith('tool_call.')) {
      const toolCall = event.payload.toolCall as AiToolCall | undefined;
      if (toolCall) {
        setToolCalls(current => upsertToolCall(current, toolCall));
        if (event.type === 'tool_call.failed' && toolCall.errorMessage && !replayingHistoryRef.current) {
          Toast.error(`工具执行失败：${formatVisibleErrorMessage(toolCall.errorMessage)}`);
        }
      }
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const media = window.matchMedia('(max-width: 1100px)');
    const onChange = () => {
      setCompactLayout(media.matches);
      if (!media.matches) {
        setMobileSidebarVisible(false);
      }
    };

    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!userLoading && !authed) {
      navigate('/');
    }
  }, [authed, navigate, userLoading]);

  useEffect(() => {
    if (!authed || userLoading) {
      return;
    }
    setLoading(true);
    refreshConversations()
      .catch(() => Toast.error('加载 AI 会话失败'))
      .finally(() => setLoading(false));
  }, [authed, userLoading]);

  useEffect(() => {
    if (!activeConversationId) {
      setStreamConnected(false);
      clearConversationState();
      return;
    }
    setLoading(true);
    loadConversationState(activeConversationId)
      .catch(() => Toast.error('加载会话内容失败'))
      .finally(() => setLoading(false));
  }, [activeConversationId]);

  useEffect(() => {
    if (!activeConversationId) {
      return;
    }

    streamAbortRef.current?.abort();
    const controller = new AbortController();
    streamAbortRef.current = controller;
    setStreamConnected(false);
    replayingHistoryRef.current = true;

    streamAiConversation(activeConversationId, {
      afterSequence: lastSequenceRef.current,
      signal: controller.signal,
      onOpen: () => setStreamConnected(true),
      onHistoryEnd: () => {
        replayingHistoryRef.current = false;
      },
      onEvent: handleEvent,
    }).catch(error => {
      if ((error as Error)?.name === 'AbortError') {
        return;
      }
      replayingHistoryRef.current = false;
      setStreamConnected(false);
      Toast.error((error as Error)?.message || '会话流连接失败');
    });

    return () => {
      replayingHistoryRef.current = false;
      controller.abort();
    };
  }, [activeConversationId]);

  const onCreateConversation = async () => {
    try {
      setCreating(true);
      const res = await createAiConversation();
      clearConversationState();
      setMobileSidebarVisible(false);
      await refreshConversations(res.data.id);
    } catch {
      Toast.error('创建会话失败');
    } finally {
      setCreating(false);
    }
  };

  const onSend = async (payload: MessageContent) => {
    const content = extractPlainTextFromInput(payload);
    if (!content) {
      Toast.warning('当前仅支持发送文本消息');
      return;
    }

    setSending(true);
    try {
      let conversationId = activeConversationId;
      if (!conversationId) {
        const created = await createAiConversation();
        conversationId = created.data.id;
        clearConversationState();
        await refreshConversations(conversationId);
      }

      const res = await sendAiConversationMessage(conversationId, { content });
      setMessages(current => upsertMessage(current, res.data.message));
      setRuns(current => upsertRun(current, res.data.run));
      await refreshConversations(conversationId);
    } catch (error) {
      Toast.error((error as Error)?.message || '发送失败');
    } finally {
      setSending(false);
    }
  };

  const onResolveToolCall = async (toolCallId: string, approved: boolean) => {
    try {
      setApprovingId(toolCallId);
      await approveAiToolCall(toolCallId, { approved });
    } catch (error) {
      Toast.error((error as Error)?.message || '处理工具审批失败');
    } finally {
      setApprovingId('');
    }
  };

  const onRetryRun = async (runId: string) => {
    try {
      setRetryingRunId(runId);
      const res = await retryAiRun(runId);
      setRuns(current => upsertRun(current, res.data.run));
      Toast.success('已经开始重新生成这次回复');
      await refreshConversations(res.data.conversation.id);
    } catch (error) {
      Toast.error((error as Error)?.message || '重试失败');
    } finally {
      setRetryingRunId('');
    }
  };

  const onDeleteConversation = async (conversationId: string) => {
    const visibleConversations = filteredConversations.length ? filteredConversations : conversations;
    const currentIndex = visibleConversations.findIndex(item => item.id === conversationId);
    const fallbackConversation =
      visibleConversations[currentIndex + 1] ||
      visibleConversations[currentIndex - 1] ||
      conversations.find(item => item.id !== conversationId) ||
      null;

    try {
      setDeletingId(conversationId);
      await deleteAiConversation(conversationId);
      setConversations(current => current.filter(item => item.id !== conversationId));
      setSelectedConversationIds(current => current.filter(item => item !== conversationId));

      if (activeConversationId === conversationId) {
        setActiveConversationId(fallbackConversation?.id || '');
        if (!fallbackConversation) {
          clearConversationState();
        }
      }
      Toast.success('会话已删除');
    } catch (error) {
      Toast.error((error as Error)?.message || '删除会话失败');
    } finally {
      setDeletingId('');
    }
  };

  const onToggleBulkMode = () => {
    if (bulkDeleting || deletingId) {
      return;
    }

    setBulkMode(current => {
      if (current) {
        setSelectedConversationIds([]);
      }
      return !current;
    });
  };

  const onToggleConversationSelection = (conversationId: string) => {
    if (bulkDeleting) {
      return;
    }

    setSelectedConversationIds(current => toggleConversationSelection(current, conversationId));
  };

  const onSelectVisibleConversations = (shouldSelect: boolean) => {
    if (bulkDeleting) {
      return;
    }

    setSelectedConversationIds(current =>
      updateSelectionForVisibleConversations(current, visibleConversationIds, shouldSelect)
    );
  };

  const onBulkDeleteConversations = async () => {
    const targetIds = selectedConversationIds.slice();
    if (!targetIds.length) {
      return;
    }

    const fallbackConversationId =
      getFallbackConversationId(visibleConversationIds, targetIds, activeConversationId) ||
      conversations.find(item => !targetIds.includes(item.id))?.id ||
      '';
    const deletedIds: string[] = [];
    let successCount = 0;
    let failureCount = 0;

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
        setConversations(
          current => applyConversationDeletion({ conversations: current, selectedIds: [], deletedIds }).conversations
        );
        setSelectedConversationIds(
          current => applyConversationDeletion({ conversations: [], selectedIds: current, deletedIds }).selectedIds
        );

        if (activeConversationId && deletedIds.includes(activeConversationId)) {
          setActiveConversationId(fallbackConversationId);
          if (!fallbackConversationId) {
            clearConversationState();
          }
        }

        const remainingConversationCount = conversations.filter(item => !deletedIds.includes(item.id)).length;
        if (remainingConversationCount === 0) {
          setBulkMode(false);
          setSelectedConversationIds([]);
        }
      }

      if (failureCount === 0) {
        Toast.success(`已删除 ${successCount} 条会话`);
      } else if (successCount > 0) {
        Toast.warning(`成功删除 ${successCount} 条，失败 ${failureCount} 条`);
      } else {
        Toast.error('批量删除失败');
      }
    } finally {
      setBulkDeleting(false);
    }
  };

  const renderConversationList = () => {
    if (!filteredConversations.length) {
      return (
        <div className={styles.emptySidebar}>
          <Empty description={search ? '没有匹配的会话' : '还没有 AI 会话'} image={<></>} />
        </div>
      );
    }

    return (
      <div className={styles.conversationList}>
        {bulkMode ? (
          <div className={styles.bulkToolbar}>
            <div className={styles.bulkSummary}>已选 {selectedConversationIds.length} 项</div>
            <div className={styles.bulkActions}>
              <Button
                size="small"
                disabled={bulkDeleting || !visibleConversationIds.length || allVisibleSelected}
                onClick={() => onSelectVisibleConversations(true)}
              >
                全选
              </Button>
              <Button
                size="small"
                disabled={bulkDeleting || !selectedVisibleCount}
                onClick={() => onSelectVisibleConversations(false)}
              >
                取消全选
              </Button>
              <Popconfirm
                title={`确定删除已选的 ${selectedConversationIds.length} 条会话？`}
                content="会同时删除消息、工具记录和运行记录，此操作不可恢复。"
                onConfirm={() => {
                  void onBulkDeleteConversations();
                }}
              >
                <Button
                  theme="solid"
                  type="danger"
                  disabled={bulkDeleting || !selectedConversationIds.length}
                  loading={bulkDeleting}
                >
                  删除所选
                </Button>
              </Popconfirm>
              <Button size="small" disabled={bulkDeleting} onClick={onToggleBulkMode}>
                退出批量模式
              </Button>
            </div>
          </div>
        ) : (
          <div className={styles.sidebarActions}>
            <Button size="small" theme="light" disabled={Boolean(deletingId)} onClick={onToggleBulkMode}>
              批量管理
            </Button>
          </div>
        )}

        <div className={styles.listInner}>
          {filteredConversations.map(item => {
            const selected = bulkMode && selectedConversationIds.includes(item.id);
            const active = item.id === activeConversationId;

            return (
              <div
                key={item.id}
                className={`${styles.conversationItem} ${active ? styles.conversationActive : ''} ${
                  selected ? styles.conversationSelected : ''
                }`}
                onClick={() => {
                  if (bulkMode) {
                    onToggleConversationSelection(item.id);
                    return;
                  }
                  setActiveConversationId(item.id);
                  setMobileSidebarVisible(false);
                }}
              >
                {bulkMode ? (
                  <div
                    className={styles.selector}
                    onClick={event => {
                      event.stopPropagation();
                      onToggleConversationSelection(item.id);
                    }}
                  >
                    <Checkbox checked={selected} onChange={() => undefined} />
                  </div>
                ) : null}

                <div className={styles.conversationBody}>
                  <div className={styles.conversationTop}>
                    <div className={styles.conversationTitle}>{item.title || '新对话'}</div>
                    {!bulkMode ? (
                      <Popconfirm
                        title="确定删除这条会话？"
                        content="会同时删除消息、工具记录和运行记录，此操作不可恢复。"
                        onConfirm={event => {
                          event?.stopPropagation();
                          void onDeleteConversation(item.id);
                        }}
                      >
                        <Button
                          theme="borderless"
                          type="tertiary"
                          icon={<IconDelete />}
                          loading={deletingId === item.id}
                          aria-label="删除会话"
                          onClick={event => event.stopPropagation()}
                        />
                      </Popconfirm>
                    ) : null}
                  </div>
                  <div className={styles.conversationMeta}>
                    <span>{item.latestRunStatus || 'idle'}</span>
                    <span>{formatConversationDate(item.lastMessageAt)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (userLoading) {
    return <Loading type="page" text="正在加载 AI 助手..." />;
  }

  if (!authed) {
    return null;
  }

  return (
    <div className={styles.page}>
      <div className={styles.layout}>
        {compactLayout ? (
          <div className={styles.mobileBar}>
            <Space>
              <Button icon={<IconMenu />} onClick={() => setMobileSidebarVisible(true)}>
                会话
              </Button>
              <Button icon={<IconPlus />} loading={creating} onClick={onCreateConversation}>
                新对话
              </Button>
            </Space>
            <Tag color={streamConnected ? 'green' : isThinking ? 'blue' : 'grey'}>
              {streamConnected ? '实时同步中' : isThinking ? '正在处理' : '空闲'}
            </Tag>
          </div>
        ) : (
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div>
                <div className={styles.sidebarTitle}>会话</div>
                <div className={styles.sidebarDescription}>继续最近工作，或开启新的 AI 协作。</div>
              </div>
              <Button type="primary" icon={<IconPlus />} loading={creating} onClick={onCreateConversation}>
                新对话
              </Button>
            </div>

            <Input
              value={search}
              prefix={<IconComment />}
              placeholder="搜索会话"
              onChange={(value: string) => setSearch(value)}
            />

            {renderConversationList()}

            <div className={styles.quickLinks}>
              <div className={styles.quickLinksTitle}>快捷入口</div>
              <Space wrap>
                <Button size="small" theme="light" onClick={() => navigate('/anime-subscription')}>
                  自动追番
                </Button>
                <Button size="small" theme="light" onClick={() => navigate('/openlist-ai-organizer')}>
                  AI 文件整理
                </Button>
                <Button size="small" theme="light" onClick={() => navigate('/setting/info')}>
                  系统设置
                </Button>
              </Space>
            </div>
          </aside>
        )}

        <section className={styles.workspace}>
          <div className={styles.workspaceHeader}>
            <div>
              <div className={styles.workspaceTitle}>{activeConversation?.title || 'AI 助手'}</div>
              <div className={styles.workspaceSubTitle}>
                {activeConversation ? '使用统一对话视图处理消息、工具执行与审批。' : '创建一个新会话，开始与 AI 协作。'}
              </div>
            </div>

            <div className={styles.workspaceStatus}>
              <div className={styles.connection}>
                <Badge
                  dot={Boolean(activeConversationId && streamConnected)}
                  type={streamConnected ? 'success' : 'warning'}
                />
                {activeConversationId ? (streamConnected ? '实时同步已连接' : '正在连接实时流') : '等待会话'}
              </div>
              {latestRun?.status === 'failed' ? (
                <Button
                  theme="light"
                  icon={<IconRefresh />}
                  loading={retryingRunId === latestRun.id}
                  onClick={() => onRetryRun(latestRun.id)}
                >
                  重试
                </Button>
              ) : null}
            </div>
          </div>

          <div className={styles.dialogueWrap}>
            {loading && !activeConversationId ? (
              <div className={styles.emptyState}>
                <Loading type="block" text="正在加载会话..." />
              </div>
            ) : !activeConversationId ? (
              <div className={styles.emptyState}>
                <Empty title="还没有会话" description="点击“新对话”，开始让 AI 协助你执行工作。" />
              </div>
            ) : !dialogueChats.length ? (
              <div className={styles.emptyState}>
                <Empty description="发一条消息开始和 AI 协作" />
              </div>
            ) : (
              <AIChatDialogue
                chats={dialogueChats}
                roleConfig={roleConfig}
                align={compactLayout ? 'leftAlign' : 'leftRight'}
                mode="bubble"
                className={styles.dialogue}
                dialogueRenderConfig={dialogueRenderConfig}
              />
            )}
          </div>

          <div className={styles.composer}>
            <AIChatInput
              placeholder="给 AI 助手发消息，必要时它会自动调用工具。"
              showUploadButton={false}
              showUploadFile={false}
              showReference={false}
              onMessageSend={onSend}
              sendHotKey="enter"
              clearContentOnGenerating={false}
              renderTopSlot={() => (
                <div className={styles.composerTip}>Enter 发送，Shift + Enter 换行。当前仅支持文本消息。</div>
              )}
            />
            {sending ? <div className={styles.sendingMask}>正在发送消息…</div> : null}
          </div>
        </section>
      </div>

      <SideSheet
        title="AI 会话"
        visible={mobileSidebarVisible}
        placement="left"
        onCancel={() => setMobileSidebarVisible(false)}
        width={360}
        bodyStyle={{ padding: 12 }}
      >
        <Space vertical spacing={14} style={{ width: '100%' }}>
          <Button icon={<IconPlus />} type="primary" loading={creating} onClick={onCreateConversation}>
            新对话
          </Button>
          <Input
            value={search}
            prefix={<IconComment />}
            placeholder="搜索会话"
            onChange={(value: string) => setSearch(value)}
          />
          {renderConversationList()}
        </Space>
      </SideSheet>

      <Modal
        title="工具执行"
        visible={Boolean(toolModalMessageId)}
        onCancel={() => setToolModalMessageId('')}
        footer={null}
        width={820}
        bodyStyle={{ maxHeight: '70vh', overflow: 'auto', padding: 16 }}
      >
        <div className={styles.modalHeader}>
          <div className={styles.panelDescription}>审批、错误和执行结果都集中放在这里。</div>
          {pendingApprovalCount ? <Tag color="orange">{pendingApprovalCount} 个待审批</Tag> : null}
        </div>

        {modalToolCalls.length ? (
          <div className={styles.toolList}>
            {modalToolCalls.map(toolCall => (
              <div key={toolCall.id} className={styles.toolCard}>
                <div className={styles.toolHeader}>
                  <div>
                    <div className={styles.toolTitle}>{toolCall.toolName}</div>
                    <div className={styles.toolMeta}>
                      {toolCall.requiresApproval ? '需要审批' : '自动执行'} · 风险级别 {toolCall.riskLevel}
                    </div>
                  </div>
                  <Tag color={getToolStatusColor(toolCall.status)}>{getToolStatusLabel(toolCall.status)}</Tag>
                </div>

                <div className={styles.toolBlock}>
                  <div className={styles.toolLabel}>参数</div>
                  <pre className={styles.toolCode}>{JSON.stringify(toolCall.arguments, null, 2)}</pre>
                </div>

                {toolCall.result ? (
                  <div className={styles.toolBlock}>
                    <div className={styles.toolLabel}>结果</div>
                    {parseToolResult(toolCall).image ? (
                      <div className={styles.modalImageWrap}>
                        <Image
                          className={styles.inlineImage}
                          src={parseToolResult(toolCall).image?.previewUrl}
                          preview
                          alt={parseToolResult(toolCall).image?.fileName}
                        />
                      </div>
                    ) : null}
                    <pre className={styles.toolCode}>{JSON.stringify(toolCall.result, null, 2)}</pre>
                  </div>
                ) : null}

                {toolCall.errorMessage ? (
                  <div className={styles.toolBlock}>
                    <div className={styles.toolLabel}>错误</div>
                    <div className={styles.toolError}>{formatVisibleErrorMessage(toolCall.errorMessage)}</div>
                  </div>
                ) : null}

                {toolCall.status === 'waiting_approval' ? (
                  <div className={styles.toolActions}>
                    <Button
                      type="primary"
                      loading={approvingId === toolCall.id}
                      onClick={() => onResolveToolCall(toolCall.id, true)}
                    >
                      批准
                    </Button>
                    <Button loading={approvingId === toolCall.id} onClick={() => onResolveToolCall(toolCall.id, false)}>
                      拒绝
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.toolEmpty}>
            <Empty description="这条消息没有工具执行记录" image={<></>} />
          </div>
        )}
      </Modal>
    </div>
  );
}

export default AiChatApp;
