import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  Empty,
  Image,
  Input,
  Popconfirm,
  SideSheet,
  Space,
  Spin,
  Tag,
  TextArea,
  Toast,
  Typography,
} from '@douyinfe/semi-ui';
import {
  IconBolt,
  IconChevronDown,
  IconChevronUp,
  IconComment,
  IconCopy,
  IconDelete,
  IconExit,
  IconMenu,
  IconPlus,
  IconRefresh,
  IconSetting,
} from '@douyinfe/semi-icons';
import { useNavigate } from 'react-router';
import { AppHeader } from '@/components';
import { useUser } from '@/hooks';
import { clearAuthToken, isAuthenticated } from '@/utils';
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
import { buildAiChatTimeline } from './timeline';
import {
  applyConversationDeletion,
  getFallbackConversationId,
  toggleConversationSelection,
  updateSelectionForVisibleConversations,
} from './conversation-selection';

const { Paragraph } = Typography;

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
    toolName: toolCall.toolName || '工具结果',
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
    return 'AI 连续尝试了多轮工具调用和推理，但在当前限制步数内仍没有产出最终回复。通常表示它陷入了反复试探或没有收敛。你可以直接点“重试这次回复”，或者把指令说得更具体一些。';
  }

  return text.length > 600 ? `${text.slice(0, 600)}...` : text;
};

const getToolSummaryText = (toolCalls: AiToolCall[]) => {
  if (!toolCalls.length) {
    return '';
  }

  const waitingCount = toolCalls.filter(item => item.status === 'waiting_approval').length;
  const runningCount = toolCalls.filter(item => item.status === 'running').length;
  const failedCount = toolCalls.filter(item => item.status === 'failed').length;

  if (waitingCount > 0) {
    return `${toolCalls.length} 个工具调用，${waitingCount} 个等待确认`;
  }
  if (failedCount > 0) {
    return `${toolCalls.length} 个工具调用，${failedCount} 个失败`;
  }
  if (runningCount > 0) {
    return `${toolCalls.length} 个工具调用，${runningCount} 个执行中`;
  }
  return `${toolCalls.length} 个工具调用`;
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
  const [input, setInput] = useState('');
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
  const [toolPanelOpenMap, setToolPanelOpenMap] = useState<Record<string, boolean>>({});
  const lastSequenceRef = useRef(0);
  const replayingHistoryRef = useRef(false);
  const streamAbortRef = useRef<AbortController | null>(null);
  const streamRef = useRef<HTMLDivElement | null>(null);
  const streamBottomRef = useRef<HTMLDivElement | null>(null);

  const activeConversation = useMemo(
    () => conversations.find(item => item.id === activeConversationId) || null,
    [conversations, activeConversationId]
  );
  const hasActiveConversation = Boolean(activeConversationId);
  const latestRun = useMemo(() => toLatestAiRun(runs), [runs]);
  const isThinking = latestRun?.status === 'queued' || latestRun?.status === 'running';
  const runErrorMessage = latestRun?.status === 'failed' ? latestRun.errorMessage || '执行失败' : '';

  const pendingInlineToolCalls = useMemo(() => {
    return toolCalls
      .filter(item => item.status !== 'completed' && item.status !== 'rejected')
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [toolCalls]);

  const timelineItems = useMemo(() => buildAiChatTimeline(messages, toolCalls), [messages, toolCalls]);

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
          Toast.error(`AI 执行失败: ${formatVisibleErrorMessage(run.errorMessage)}`);
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
          Toast.error(`工具执行失败: ${formatVisibleErrorMessage(toolCall.errorMessage)}`);
        }
      }
    }
  };

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
      setToolPanelOpenMap({});
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
      onOpen: () => {
        setStreamConnected(true);
      },
      onHistoryEnd: () => {
        replayingHistoryRef.current = false;
      },
      onEvent: event => {
        handleEvent(event);
      },
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

  useEffect(() => {
    streamBottomRef.current?.scrollIntoView({
      block: 'end',
    });
  }, [timelineItems]);

  const onLogout = () => {
    clearAuthToken();
    navigate('/', { replace: true });
  };

  const onCreateConversation = async () => {
    try {
      setCreating(true);
      const res = await createAiConversation();
      const nextId = res.data.id;
      clearConversationState();
      setMobileSidebarVisible(false);
      await refreshConversations(nextId);
    } catch {
      Toast.error('创建会话失败');
    } finally {
      setCreating(false);
    }
  };

  const onSend = async () => {
    if (!input.trim()) {
      return;
    }
    const content = input.trim();
    setInput('');
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
      setInput(content);
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

  const isToolPanelOpen = (messageId: string, attachedToolCalls: AiToolCall[]) => {
    if (Object.prototype.hasOwnProperty.call(toolPanelOpenMap, messageId)) {
      return Boolean(toolPanelOpenMap[messageId]);
    }
    return attachedToolCalls.some(item => item.status === 'waiting_approval' || item.status === 'failed');
  };

  const toggleToolPanel = (messageId: string, attachedToolCalls: AiToolCall[]) => {
    setToolPanelOpenMap(current => ({
      ...current,
      [messageId]: !isToolPanelOpen(messageId, attachedToolCalls),
    }));
  };

  const renderConversationList = () => {
    if (!filteredConversations.length) {
      return <Empty description={search ? '没有匹配的会话' : '还没有 AI 会话'} image={<></>} />;
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
        <Space vertical spacing={10} style={{ width: '100%' }}>
          {filteredConversations.map(item => (
            <div
              key={item.id}
              className={`${styles.conversationItem} ${
                item.id === activeConversationId ? styles.conversationActive : ''
              } ${bulkMode && selectedConversationIds.includes(item.id) ? styles.conversationSelected : ''}`}
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
                  className={styles.conversationSelector}
                  onClick={event => {
                    event.stopPropagation();
                    onToggleConversationSelection(item.id);
                  }}
                >
                  <Checkbox checked={selectedConversationIds.includes(item.id)} onChange={() => undefined} />
                </div>
              ) : null}
              <div className={styles.conversationBody}>
                <div className={styles.conversationTop}>
                  <div className={styles.conversationName}>{item.title || '新对话'}</div>
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
                  <span>{item.lastMessageAt ? new Date(item.lastMessageAt).toLocaleDateString() : '刚刚'}</span>
                </div>
              </div>
            </div>
          ))}
        </Space>
      </div>
    );
  };

  if (userLoading) {
    return <Spin tip="正在加载 AI 工作台..." />;
  }

  return (
    <div className={styles.page}>
      <AppHeader
        title="AI 助手"
        description="统一会话、工具执行与审批确认的工作台"
        logo={
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #0f172a 0%, #0369a1 55%, #38bdf8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 16px 28px rgba(14, 165, 233, 0.24)',
            }}
          >
            <IconBolt style={{ fontSize: 20, color: '#fff' }} />
          </div>
        }
        onLogoClick={() => navigate('/')}
        userOverride={user || undefined}
        menuItems={
          authed
            ? [
                { key: 'home', label: '返回首页', icon: <IconCopy />, onClick: () => navigate('/') },
                { key: 'setting', label: '系统管理', icon: <IconSetting />, onClick: () => navigate('/setting/info') },
                { key: 'logout', label: '退出登录', icon: <IconExit />, type: 'danger', onClick: onLogout },
              ]
            : []
        }
      />

      <div className={styles.content}>
        <div className={styles.mobileConversationBar}>
          <Space>
            <Button icon={<IconMenu />} onClick={() => setMobileSidebarVisible(true)}>
              会话
            </Button>
            <Button icon={<IconPlus />} loading={creating} onClick={onCreateConversation}>
              新对话
            </Button>
          </Space>
          <Tag color={hasActiveConversation ? (streamConnected ? 'green' : 'blue') : 'grey'}>
            {hasActiveConversation ? (streamConnected ? '实时同步已开启' : '正在建立实时同步') : '等待会话'}
          </Tag>
        </div>

        <div className={styles.shell}>
          <aside className={styles.sidebar}>
            <div className={styles.sidebarHeader}>
              <div>
                <div className={styles.sidebarTitle}>会话列表</div>
                <div className={styles.sidebarDescription}>继续最近工作，或开启新的 AI 协作。</div>
              </div>
              <Button
                theme="solid"
                type="primary"
                icon={<IconPlus />}
                loading={creating}
                onClick={onCreateConversation}
              >
                新对话
              </Button>
            </div>

            <div className={styles.search}>
              <Input
                value={search}
                prefix={<IconComment />}
                placeholder="搜索会话"
                onChange={(value: string) => setSearch(value)}
              />
            </div>

            {renderConversationList()}

            <div className={styles.quickPanel}>
              <div className={styles.quickLabel}>快捷入口</div>
              <div className={styles.quickButtons}>
                <Button size="small" theme="light" onClick={() => navigate('/setting/anime-subscription')}>
                  自动追番
                </Button>
                <Button size="small" theme="light" onClick={() => navigate('/setting/openlist-ai-organizer')}>
                  AI 文件整理
                </Button>
                <Button size="small" theme="light" onClick={() => navigate('/setting/info')}>
                  系统设置
                </Button>
              </div>
            </div>
          </aside>

          <section className={styles.workspace}>
            <div className={styles.workspaceHeader}>
              <div>
                <div className={styles.workspaceTitle}>{activeConversation?.title || 'AI 助手'}</div>
                <div className={styles.workspaceSubTitle}>
                  {activeConversation
                    ? '你可以继续提问，也可以等待工具执行完成后继续推进。'
                    : '创建一个新会话，开始让 AI 调用工具帮你完成工作。'}
                </div>
              </div>

              <div className={styles.connection}>
                <Badge
                  dot={hasActiveConversation ? streamConnected : false}
                  type={streamConnected ? 'success' : 'warning'}
                />
                {hasActiveConversation
                  ? streamConnected
                    ? '实时同步已开启'
                    : '正在建立实时同步'
                  : '创建会话后开始同步'}
              </div>
            </div>

            <div ref={streamRef} className={styles.stream}>
              <div className={styles.streamInner}>
                {loading && !messages.length && !activeConversationId ? (
                  <Spin tip="正在加载 AI 工作台..." />
                ) : !activeConversationId ? (
                  <div className={styles.empty}>
                    <Empty
                      title="还没有会话"
                      description="创建一个新会话，开始让 AI 协助你检查状态、执行工具和推进任务。"
                    />
                  </div>
                ) : !timelineItems.length && !pendingInlineToolCalls.length ? (
                  <div className={styles.empty}>
                    <Empty description="发一条消息开始和 AI 协作" />
                  </div>
                ) : (
                  <>
                    {timelineItems.map(item => {
                      const { message, attachedToolCalls } = item;
                      const isUser = message.role === 'user';
                      const toolPanelOpen = isToolPanelOpen(message.id, attachedToolCalls);
                      const inlineImages = isUser ? [] : getInlineImageResults(attachedToolCalls);
                      return (
                        <div key={message.id} className={isUser ? styles.rowUser : styles.rowAssistant}>
                          <div className={styles.messageStack}>
                            <div className={`${styles.bubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
                              <div className={styles.bubbleLabel}>{isUser ? '你' : 'AI 助手'}</div>
                              <Paragraph className={styles.bubbleContent}>{message.content}</Paragraph>
                            </div>
                            {inlineImages.length ? (
                              <div className={styles.inlineImageList}>
                                {inlineImages.map(image => (
                                  <div
                                    key={`${message.id}-${image.selectedPath || image.fileName}`}
                                    className={styles.inlineImageCard}
                                  >
                                    <div className={styles.imageResult}>
                                      <div className={styles.imageResultHeader}>
                                        <div className={styles.imageResultTitle}>{image.fileName}</div>
                                        <div className={styles.imageResultMeta}>
                                          {image.totalImageCount > 0
                                            ? `来自 ${image.rootPath}，共命中 ${image.totalImageCount} 张图片`
                                            : image.rootPath}
                                        </div>
                                      </div>
                                      <div className={styles.imageFrame}>
                                        <Image
                                          className={styles.toolImage}
                                          src={image.previewUrl}
                                          preview
                                          alt={image.fileName}
                                        />
                                      </div>
                                      {image.selectedPath ? (
                                        <div className={styles.imagePath}>{image.selectedPath}</div>
                                      ) : null}
                                      <div className={styles.imageActions}>
                                        <Button
                                          theme="light"
                                          onClick={() => {
                                            window.open(image.imageUrl, '_blank', 'noopener,noreferrer');
                                          }}
                                        >
                                          打开原图
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : null}
                            {attachedToolCalls.length ? (
                              <div className={styles.messageAttachment}>
                                <button
                                  className={styles.toolToggle}
                                  type="button"
                                  onClick={() => toggleToolPanel(message.id, attachedToolCalls)}
                                >
                                  <span>{toolPanelOpen ? '收起工具调用' : '查看工具调用结果'}</span>
                                  <span className={styles.toolToggleMeta}>{getToolSummaryText(attachedToolCalls)}</span>
                                  {toolPanelOpen ? <IconChevronUp size="small" /> : <IconChevronDown size="small" />}
                                </button>
                                {toolPanelOpen ? (
                                  <div className={styles.toolPanel}>
                                    {attachedToolCalls.map(toolCall => {
                                      const parsed = parseToolResult(toolCall);
                                      const image = parsed.image;
                                      return (
                                        <div
                                          key={toolCall.id}
                                          className={`${styles.toolCard} ${
                                            toolCall.status === 'failed'
                                              ? styles.toolCardError
                                              : toolCall.status === 'completed'
                                              ? styles.toolCardDone
                                              : ''
                                          }`}
                                        >
                                          <div className={styles.toolHeader}>
                                            <div className={styles.toolTitle}>工具调用 · {toolCall.toolName}</div>
                                            <Tag
                                              color={
                                                toolCall.status === 'waiting_approval'
                                                  ? 'orange'
                                                  : toolCall.status === 'failed'
                                                  ? 'red'
                                                  : toolCall.status === 'running'
                                                  ? 'blue'
                                                  : 'green'
                                              }
                                            >
                                              {toolCall.status}
                                            </Tag>
                                          </div>
                                          <div className={styles.toolSection}>
                                            <div className={styles.toolSectionLabel}>参数</div>
                                            <div className={styles.toolBody}>
                                              {JSON.stringify(toolCall.arguments, null, 2)}
                                            </div>
                                          </div>
                                          {toolCall.errorMessage ? (
                                            <div className={styles.toolSection}>
                                              <div className={styles.toolSectionLabel}>错误</div>
                                              <div className={styles.toolBody}>
                                                {formatVisibleErrorMessage(toolCall.errorMessage)}
                                              </div>
                                            </div>
                                          ) : null}
                                          {image && !inlineImages.length ? (
                                            <div className={styles.imageResult}>
                                              <div className={styles.imageResultHeader}>
                                                <div className={styles.imageResultTitle}>{image.fileName}</div>
                                                <div className={styles.imageResultMeta}>
                                                  {image.totalImageCount > 0
                                                    ? `来自 ${image.rootPath}，共命中 ${image.totalImageCount} 张图片`
                                                    : image.rootPath}
                                                </div>
                                              </div>
                                              <div className={styles.imageFrame}>
                                                <Image
                                                  className={styles.toolImage}
                                                  src={image.previewUrl}
                                                  preview
                                                  alt={image.fileName}
                                                />
                                              </div>
                                              {image.selectedPath ? (
                                                <div className={styles.imagePath}>{image.selectedPath}</div>
                                              ) : null}
                                              <div className={styles.imageActions}>
                                                <Button
                                                  theme="light"
                                                  onClick={() => {
                                                    window.open(image.imageUrl, '_blank', 'noopener,noreferrer');
                                                  }}
                                                >
                                                  打开原图
                                                </Button>
                                              </div>
                                            </div>
                                          ) : null}
                                          {parsed.resultText ? (
                                            <div className={styles.toolSection}>
                                              <div className={styles.toolSectionLabel}>结果</div>
                                              <div className={styles.toolBody}>{parsed.resultText}</div>
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
                                              <Button
                                                loading={approvingId === toolCall.id}
                                                onClick={() => onResolveToolCall(toolCall.id, false)}
                                              >
                                                拒绝
                                              </Button>
                                            </div>
                                          ) : null}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : null}
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                    {isThinking ? (
                      <div className={styles.rowAssistant}>
                        <div className={styles.messageStack}>
                          <div className={`${styles.bubble} ${styles.assistantBubble}`}>
                            <div className={styles.thinkingBlock}>
                              <div className={styles.bubbleLabel}>AI 助手</div>
                              <div className={styles.thinking}>
                                <span className={styles.thinkingDots} aria-hidden="true">
                                  <span />
                                  <span />
                                  <span />
                                </span>
                                <span>
                                  正在思考中{latestRun?.currentStep ? `，第 ${latestRun.currentStep} 步` : ''}...
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : null}
                    {runErrorMessage ? (
                      <div className={styles.rowAssistant}>
                        <div className={styles.messageStack}>
                          <div className={styles.runErrorCard}>
                            <div className={styles.runErrorTitle}>本次执行失败</div>
                            <div className={styles.runErrorBody}>{formatVisibleErrorMessage(runErrorMessage)}</div>
                            {latestRun?.id ? (
                              <div className={styles.runErrorActions}>
                                <Button
                                  type="primary"
                                  theme="light"
                                  icon={<IconRefresh />}
                                  loading={retryingRunId === latestRun.id}
                                  onClick={() => onRetryRun(latestRun.id)}
                                >
                                  重试这次回复
                                </Button>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                    <div ref={streamBottomRef} />
                  </>
                )}
              </div>
            </div>

            <div className={styles.composerWrap}>
              <div className={styles.composer}>
                <TextArea
                  autosize={{ minRows: 1, maxRows: 8 }}
                  value={input}
                  placeholder="给 AI 助手发消息，必要时它会自动调用工具。"
                  onChange={(value: string) => setInput(value)}
                  onEnterPress={(event: KeyboardEvent) => {
                    if (event.shiftKey) {
                      return;
                    }
                    event.preventDefault();
                    void onSend();
                  }}
                />
                <div className={styles.composerFooter}>
                  <div className={styles.composerHint}>Shift + Enter 换行。发送失败时会自动保留输入内容。</div>
                  <Button
                    type="primary"
                    theme="solid"
                    icon={<IconBolt />}
                    loading={sending}
                    disabled={!input.trim()}
                    onClick={onSend}
                  >
                    发送
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>

      <SideSheet
        title="AI 会话"
        visible={mobileSidebarVisible}
        placement="left"
        onCancel={() => setMobileSidebarVisible(false)}
        width={320}
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
    </div>
  );
}

export default AiChatApp;
