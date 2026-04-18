import { useEffect, useMemo, useState } from 'react';
import {
  Banner,
  Button,
  Card,
  Checkbox,
  Descriptions,
  Empty,
  Input,
  Modal,
  Space,
  Table,
  Tag,
  TextArea,
  Toast,
  Tree,
  Typography,
} from '@douyinfe/semi-ui';
import { IconFolder, IconRefresh } from '@douyinfe/semi-icons';
import type { TreeNodeData } from '@douyinfe/semi-ui/lib/es/tree';
import type {
  AnalyzeOpenlistAiOrganizerResponse,
  ExecuteOpenlistAiOrganizerResponse,
  OpenlistAiOrganizerAction,
  OpenlistAiOrganizerBrowseItem,
  OpenlistAiOrganizerPlanItem,
  OpenlistAiOrganizerTaskDetail,
  OpenlistAiOrganizerTaskSummary,
} from '@volix/types';
import {
  analyzeOpenlistAiOrganizer,
  browseOpenlistAiOrganizerPath,
  deleteOpenlistAiOrganizerDuplicateFolder,
  executeOpenlistAiOrganizer,
  getOpenlistAiOrganizerTaskDetail,
  getOpenlistAiOrganizerTaskList,
  reviseOpenlistAiOrganizerAnalyzeTask,
  retryOpenlistAiOrganizerTask,
} from '@/services/openlist-ai-organizer';
import { getHttpErrorMessage } from '@/utils';
import { useOutletContext } from 'react-router';
import type { SettingOutletContext } from '@/apps/setting/types';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag';

const actionColorMap: Record<OpenlistAiOrganizerAction, TagColor> = {
  keep: 'grey',
  rename: 'blue',
  move: 'green',
  move_to_duplicates: 'orange',
};

const actionLabelMap: Record<OpenlistAiOrganizerAction, string> = {
  keep: '保留',
  rename: '重命名',
  move: '移动',
  move_to_duplicates: '移入重复复核区',
};

const buildTreeNode = (item: OpenlistAiOrganizerBrowseItem, onPick?: (path: string) => void): TreeNodeData => ({
  key: item.path,
  value: item.path,
  label: (
    <div
      onClick={() => onPick?.(item.path)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
        width: '100%',
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          display: 'block',
          minWidth: 0,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          lineHeight: '20px',
        }}
        title={item.name}
      >
        {item.name}
      </span>
    </div>
  ),
  isLeaf: item.isLeaf,
  icon: <IconFolder />,
});

const renderEllipsis = (value?: string | null, width = 320) => {
  const text = String(value || '').trim();
  if (!text) {
    return '-';
  }

  return (
    <Typography.Text ellipsis={{ showTooltip: true }} style={{ width, display: 'block' }}>
      {text}
    </Typography.Text>
  );
};

function SettingOpenlistAiOrganizerApp() {
  const { isAdmin } = useOutletContext<SettingOutletContext>();
  const [rootPath, setRootPath] = useState('/');
  const [duplicateFolderName, setDuplicateFolderName] = useState('__AI_DUPLICATES_PENDING__');
  const [analyzing, setAnalyzing] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [browseVisible, setBrowseVisible] = useState(false);
  const [treeData, setTreeData] = useState<TreeNodeData[]>([]);
  const [treeLoading, setTreeLoading] = useState(false);
  const [selectedBrowsePath, setSelectedBrowsePath] = useState('/');
  const [analysis, setAnalysis] = useState<AnalyzeOpenlistAiOrganizerResponse>();
  const [execution, setExecution] = useState<ExecuteOpenlistAiOrganizerResponse>();
  const [selectedPlanIds, setSelectedPlanIds] = useState<Array<string | number>>([]);
  const [showChangedOnly, setShowChangedOnly] = useState(true);
  const [showFiles, setShowFiles] = useState(true);
  const [showDirectories, setShowDirectories] = useState(true);
  const [taskList, setTaskList] = useState<OpenlistAiOrganizerTaskSummary[]>([]);
  const [taskListLoading, setTaskListLoading] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState('');
  const [currentTaskDetail, setCurrentTaskDetail] = useState<OpenlistAiOrganizerTaskDetail>();
  const [revisionFeedback, setRevisionFeedback] = useState('');
  const [revising, setRevising] = useState(false);
  const [retryingTaskId, setRetryingTaskId] = useState('');
  const [deletingDuplicateFolderTaskId, setDeletingDuplicateFolderTaskId] = useState('');

  const applyTaskDetail = (task: OpenlistAiOrganizerTaskDetail) => {
    setCurrentTaskDetail(task);
    if (task.type === 'analyze' && task.analysisResult) {
      setAnalysis(task.analysisResult);
    }
    if (task.type === 'execute' && task.executionResult) {
      setExecution(task.executionResult);
    }
  };

  const loadTaskList = async () => {
    setTaskListLoading(true);
    try {
      const res = await getOpenlistAiOrganizerTaskList();
      const items = res.data.items || [];
      setTaskList(items);
      const runningTask = items.find(item => item.status === 'queued' || item.status === 'running');
      const latestFinishedTask = items[0];
      const preferredTask = runningTask || latestFinishedTask;
      if (preferredTask) {
        setCurrentTaskId(preferredTask.id);
      }
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '加载任务列表失败'));
    } finally {
      setTaskListLoading(false);
    }
  };

  const loadDirectory = async (targetPath: string) => {
    const res = await browseOpenlistAiOrganizerPath(targetPath);
    return res.data.items.map(item => buildTreeNode(item, setSelectedBrowsePath));
  };

  const loadRootTree = async () => {
    setTreeLoading(true);
    try {
      const children = await loadDirectory('/');
      setTreeData([
        {
          key: '/',
          value: '/',
          label: (
            <div
              onClick={() => setSelectedBrowsePath('/')}
              style={{
                display: 'flex',
                alignItems: 'center',
                width: '100%',
                cursor: 'pointer',
              }}
            >
              /
            </div>
          ),
          isLeaf: false,
          icon: <IconFolder />,
          children,
        },
      ]);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '加载 OpenList 目录失败'));
    } finally {
      setTreeLoading(false);
    }
  };

  useEffect(() => {
    if (browseVisible && treeData.length === 0) {
      loadRootTree().catch(() => undefined);
    }
  }, [browseVisible, treeData.length]);

  useEffect(() => {
    loadTaskList().catch(() => undefined);
  }, []);

  useEffect(() => {
    const defaultIds = (analysis?.items || []).filter(item => item.hasChange).map(item => item.id);
    setSelectedPlanIds(defaultIds);
  }, [analysis]);

  useEffect(() => {
    if (!currentTaskId) {
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const poll = async () => {
      try {
        const res = await getOpenlistAiOrganizerTaskDetail(currentTaskId);
        if (cancelled) {
          return;
        }
        const task = res.data;
        applyTaskDetail(task);
        setTaskList(prev => {
          const exists = prev.some(item => item.id === task.id);
          const summary: OpenlistAiOrganizerTaskSummary = {
            id: task.id,
            type: task.type,
            status: task.status,
            rootPath: task.rootPath,
            duplicateFolderName: task.duplicateFolderName,
            basedOnTaskId: task.basedOnTaskId,
            summary: task.summary,
            currentStage: task.currentStage,
            errorMessage: task.errorMessage,
            createdAt: task.createdAt,
            startedAt: task.startedAt,
            finishedAt: task.finishedAt,
            updatedAt: task.updatedAt,
          };
          return exists ? prev.map(item => (item.id === task.id ? summary : item)) : [summary, ...prev];
        });

        if (task.status === 'queued' || task.status === 'running') {
          timer = window.setTimeout(poll, 2000);
          return;
        }

        await loadTaskList().catch(() => undefined);
      } catch (error) {
        if (!cancelled) {
          Toast.error(getHttpErrorMessage(error, '获取任务状态失败'));
        }
      }
    };

    poll().catch(() => undefined);

    return () => {
      cancelled = true;
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [currentTaskId]);

  const onLoadTreeData = async (node: TreeNodeData) => {
    const currentPath = String(node.key || '/');
    const children = await loadDirectory(currentPath);
    setTreeData(prev => {
      const updateNode = (nodes: TreeNodeData[]): TreeNodeData[] =>
        nodes.map(item => {
          if (item.key === node.key) {
            return {
              ...item,
              children,
            };
          }
          if (Array.isArray(item.children) && item.children.length > 0) {
            return {
              ...item,
              children: updateNode(item.children),
            };
          }
          return item;
        });

      return updateNode(prev);
    });
  };

  const handleAnalyze = async () => {
    if (!rootPath.trim()) {
      Toast.warning('请先选择一个 OpenList 路径');
      return;
    }
    setAnalyzing(true);
    setExecution(undefined);
    try {
      const res = await analyzeOpenlistAiOrganizer({
        rootPath,
        duplicateFolderName,
      });
      setCurrentTaskId(res.data.taskId);
      setCurrentTaskDetail(undefined);
      setAnalysis(undefined);
      setRevisionFeedback('');
      Toast.success('分析任务已创建，后台开始处理');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, 'AI 分析失败'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExecute = async (mode: 'selected' | 'all') => {
    if (!analysis || analysis.items.length === 0) {
      Toast.warning('当前没有可执行的整理计划');
      return;
    }

    const targetItems =
      mode === 'all'
        ? analysis.items.filter(item => item.hasChange)
        : analysis.items.filter(item => selectedPlanIds.includes(item.id));

    if (targetItems.length === 0) {
      Toast.warning('请至少勾选一个需要执行的改动');
      return;
    }

    setExecuting(true);
    try {
      const res = await executeOpenlistAiOrganizer({
        rootPath: analysis.rootPath,
        duplicateFolderName,
        items: targetItems,
      });
      setCurrentTaskId(res.data.taskId);
      setCurrentTaskDetail(undefined);
      setExecution(undefined);
      Toast.success(`执行任务已创建，本次提交 ${targetItems.length} 项`);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '执行整理失败'));
    } finally {
      setExecuting(false);
    }
  };

  const handleRevise = async () => {
    const feedback = revisionFeedback.trim();
    if (!feedback) {
      Toast.warning('先告诉 AI 你希望调整哪些整理建议');
      return;
    }

    const baseTask =
      currentTaskDetail?.type === 'analyze' && currentTaskDetail.analysisResult
        ? currentTaskDetail
        : taskList.find(item => item.id === currentTaskId && item.type === 'analyze');

    if (!baseTask?.id) {
      Toast.warning('请先选中一个已完成分析的任务，再提交修订要求');
      return;
    }

    setRevising(true);
    try {
      const res = await reviseOpenlistAiOrganizerAnalyzeTask(baseTask.id, {
        feedback,
      });
      setCurrentTaskId(res.data.taskId);
      setCurrentTaskDetail(undefined);
      setAnalysis(undefined);
      setExecution(undefined);
      Toast.success('修订分析任务已创建，AI 会基于你的反馈重新生成整理计划');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '提交修订失败'));
    } finally {
      setRevising(false);
    }
  };

  const handleRetryTask = async (taskId: string) => {
    if (!taskId) {
      return;
    }
    setRetryingTaskId(taskId);
    try {
      const res = await retryOpenlistAiOrganizerTask(taskId);
      setCurrentTaskId(res.data.taskId);
      setCurrentTaskDetail(undefined);
      Toast.success('已创建重试任务，后台会重新处理');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '重试任务失败'));
    } finally {
      setRetryingTaskId('');
    }
  };

  const handleDeleteDuplicateFolder = async (taskId: string) => {
    if (!taskId) {
      return;
    }

    setDeletingDuplicateFolderTaskId(taskId);
    try {
      const res = await deleteOpenlistAiOrganizerDuplicateFolder(taskId);
      const payload = res.data;
      setExecution(prev =>
        prev
          ? {
              ...prev,
              duplicateFolderDeleted: true,
            }
          : prev
      );
      setCurrentTaskDetail(prev =>
        prev && prev.id === taskId && prev.executionResult
          ? {
              ...prev,
              executionResult: {
                ...prev.executionResult,
                duplicateFolderDeleted: true,
              },
            }
          : prev
      );
      Toast.success(payload.message || '重复复核目录已删除');
      await loadTaskList().catch(() => undefined);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '删除重复复核目录失败'));
    } finally {
      setDeletingDuplicateFolderTaskId('');
    }
  };

  const filteredPlanData = useMemo(() => {
    return (analysis?.items || []).filter(item => {
      if (showChangedOnly && !item.hasChange) {
        return false;
      }
      if (!showFiles && item.itemType === 'file') {
        return false;
      }
      if (!showDirectories && item.itemType === 'directory') {
        return false;
      }
      return true;
    });
  }, [analysis, showChangedOnly, showFiles, showDirectories]);

  const selectedCount = useMemo(
    () => analysis?.items.filter(item => selectedPlanIds.includes(item.id)).length || 0,
    [analysis, selectedPlanIds]
  );

  if (!isAdmin) {
    return (
      <Card title="AI 文件整理工具" shadows="hover" style={{ width: '100%' }}>
        <Empty title="暂无权限" description="仅管理员可使用该工具" />
      </Card>
    );
  }

  return (
    <Space vertical spacing={16} style={{ width: '100%' }}>
      <Card
        title="AI 文件整理工具"
        shadows="hover"
        style={{ width: '100%' }}
        headerExtraContent={
          <Button
            icon={<IconRefresh />}
            onClick={() => {
              setAnalysis(undefined);
              setExecution(undefined);
            }}
          >
            清空结果
          </Button>
        }
      >
        <Space vertical spacing={12} style={{ width: '100%' }}>
          <Banner
            type="info"
            title="先分析，再人工确认，再执行"
            description="工具会递归分析整个目录树中的目录和文件，输出细粒度整理计划。AI 分析完成后，后端建议的每一项改动都会先展示在前端，你可以手工勾选需要执行的项，或者一键执行全部变更。"
            fullMode={false}
            closeIcon={null}
          />
          <Space align="end" wrap>
            <Input
              style={{ width: 420 }}
              value={rootPath}
              onChange={setRootPath}
              placeholder="请选择 OpenList 路径"
              showClear
            />
            <Button
              icon={<IconFolder />}
              onClick={() => {
                setSelectedBrowsePath(rootPath || '/');
                setBrowseVisible(true);
              }}
            >
              选择路径
            </Button>
            <Input
              style={{ width: 260 }}
              value={duplicateFolderName}
              onChange={setDuplicateFolderName}
              placeholder="重复复核目录名"
            />
            <Button theme="solid" type="primary" loading={analyzing} onClick={handleAnalyze}>
              开始 AI 分析
            </Button>
          </Space>

          {analysis ? (
            <Descriptions data={[]} row>
              <Descriptions.Item itemKey="扫描目录">{analysis.rootPath}</Descriptions.Item>
              <Descriptions.Item itemKey="重复复核目录">{analysis.duplicateFolderPath}</Descriptions.Item>
              <Descriptions.Item itemKey="顶层项目">{analysis.topLevelItemCount}</Descriptions.Item>
              <Descriptions.Item itemKey="计划节点">{analysis.plannedItemCount}</Descriptions.Item>
              <Descriptions.Item itemKey="递归条目">{analysis.totalEntries}</Descriptions.Item>
              <Descriptions.Item itemKey="有变更项">{analysis.actionCount}</Descriptions.Item>
              <Descriptions.Item itemKey="疑似重复">{analysis.duplicateCount}</Descriptions.Item>
              <Descriptions.Item itemKey="已勾选">{selectedCount}</Descriptions.Item>
            </Descriptions>
          ) : null}

          {analysis?.summary ? <Typography.Text type="secondary">{analysis.summary}</Typography.Text> : null}

          {analysis ? (
            <Card
              title="二次修订"
              shadows="hover"
              bodyStyle={{ padding: 16, background: 'var(--semi-color-fill-0)', borderRadius: 12 }}
            >
              <Space vertical spacing={12} style={{ width: '100%' }}>
                <Typography.Text type="secondary">
                  可以继续告诉 AI
                  你想修改哪部分计划，例如“保留字幕组原名”“不要把同季度不同分辨率判成重复”“把音乐和视频分开目录”。
                </Typography.Text>
                <TextArea
                  value={revisionFeedback}
                  onChange={(value: string) => setRevisionFeedback(value)}
                  maxCount={500}
                  showClear
                  rows={4}
                  placeholder="输入你对这次分析结果的修订要求，系统会基于当前分析任务重新生成一版整理计划。"
                />
                <Space wrap>
                  <Button theme="solid" type="primary" loading={revising} onClick={handleRevise}>
                    让 AI 重新生成计划
                  </Button>
                  {currentTaskDetail?.basedOnTaskId ? (
                    <Tag color="blue">基于任务 {currentTaskDetail.basedOnTaskId} 修订</Tag>
                  ) : (
                    <Tag color="grey">当前为首版分析结果</Tag>
                  )}
                </Space>
              </Space>
            </Card>
          ) : null}
        </Space>
      </Card>

      <Card
        title="最近任务"
        shadows="hover"
        style={{ width: '100%' }}
        headerExtraContent={
          <Space>
            {currentTaskDetail?.status === 'failed' ? (
              <Button
                theme="solid"
                type="secondary"
                loading={retryingTaskId === currentTaskDetail.id}
                onClick={() => handleRetryTask(currentTaskDetail.id)}
              >
                重试当前任务
              </Button>
            ) : null}
            <Button loading={taskListLoading} onClick={() => loadTaskList().catch(() => undefined)}>
              刷新任务
            </Button>
          </Space>
        }
      >
        <Table<OpenlistAiOrganizerTaskSummary>
          rowKey="id"
          size="small"
          pagination={{ pageSize: 6 }}
          dataSource={taskList}
          empty={<Empty title="暂无任务" description="创建分析或执行任务后会显示在这里" />}
          rowSelection={undefined}
          onRow={record => ({
            onClick: () => {
              if (record) {
                setCurrentTaskId(String(record.id));
              }
            },
            style: {
              cursor: record ? 'pointer' : undefined,
              background: record && currentTaskId === record.id ? 'var(--semi-color-fill-0)' : undefined,
            },
          })}
          columns={[
            {
              title: '类型',
              dataIndex: 'type',
              width: 100,
              render: (_: string, record: OpenlistAiOrganizerTaskSummary) => {
                if (record.type !== 'analyze') {
                  return '执行';
                }
                return record.basedOnTaskId ? '修订分析' : '分析';
              },
            },
            {
              title: '状态',
              dataIndex: 'status',
              width: 120,
              render: (value: string) => (
                <Tag
                  color={
                    value === 'succeeded' ? 'green' : value === 'failed' ? 'red' : value === 'running' ? 'blue' : 'grey'
                  }
                >
                  {value}
                </Tag>
              ),
            },
            {
              title: '目录',
              dataIndex: 'rootPath',
              render: (value: string) => renderEllipsis(value, 300),
            },
            {
              title: '阶段',
              dataIndex: 'currentStage',
              render: (value: string) => renderEllipsis(value, 220),
            },
            {
              title: '摘要',
              dataIndex: 'summary',
              render: (value: string) => renderEllipsis(value, 320),
            },
            {
              title: '错误',
              dataIndex: 'errorMessage',
              width: 220,
              render: (value?: string) => renderEllipsis(value || '-', 200),
            },
            {
              title: '来源',
              dataIndex: 'basedOnTaskId',
              width: 160,
              render: (value?: string) => renderEllipsis(value || '-', 140),
            },
            {
              title: '时间',
              dataIndex: 'updatedAt',
              width: 180,
            },
            {
              title: '操作',
              key: 'operation',
              width: 120,
              render: (_: unknown, record: OpenlistAiOrganizerTaskSummary) =>
                record.status === 'failed' ? (
                  <Button
                    size="small"
                    loading={retryingTaskId === record.id}
                    onClick={event => {
                      event.stopPropagation();
                      handleRetryTask(record.id).catch(() => undefined);
                    }}
                  >
                    重试
                  </Button>
                ) : (
                  '-'
                ),
            },
          ]}
        />
      </Card>

      <Card
        title="整理计划确认"
        shadows="hover"
        style={{ width: '100%' }}
        bodyStyle={{ padding: 0 }}
        headerExtraContent={
          analysis ? (
            <Space>
              <Button
                onClick={() => {
                  setSelectedPlanIds((analysis.items || []).filter(item => item.hasChange).map(item => item.id));
                }}
              >
                全选变更项
              </Button>
              <Button onClick={() => setSelectedPlanIds([])}>清空勾选</Button>
              <Button theme="solid" type="secondary" loading={executing} onClick={() => handleExecute('selected')}>
                执行勾选项
              </Button>
              <Button theme="solid" type="primary" loading={executing} onClick={() => handleExecute('all')}>
                一键执行全部变更
              </Button>
            </Space>
          ) : null
        }
      >
        <Space vertical spacing={12} style={{ width: '100%', padding: 16 }}>
          <Space wrap>
            <Checkbox checked={showChangedOnly} onChange={event => setShowChangedOnly(Boolean(event.target.checked))}>
              只看有变更项
            </Checkbox>
            <Checkbox checked={showDirectories} onChange={event => setShowDirectories(Boolean(event.target.checked))}>
              显示目录
            </Checkbox>
            <Checkbox checked={showFiles} onChange={event => setShowFiles(Boolean(event.target.checked))}>
              显示文件
            </Checkbox>
          </Space>
        </Space>
        <Table<OpenlistAiOrganizerPlanItem>
          rowKey="id"
          pagination={{ pageSize: 12 }}
          dataSource={filteredPlanData}
          empty={<Empty title="暂无计划" description="先选择目录并执行 AI 分析" />}
          scroll={{ x: 'max(100%, 1680px)' }}
          rowSelection={{
            selectedRowKeys: selectedPlanIds,
            onChange: selectedKeys => setSelectedPlanIds(selectedKeys as Array<string | number>),
            getCheckboxProps: record => ({
              disabled: !record.hasChange,
            }),
          }}
          columns={[
            {
              title: '节点',
              key: 'node',
              width: 280,
              render: (_: unknown, record: OpenlistAiOrganizerPlanItem) => (
                <div style={{ paddingLeft: Math.max(record.depth - 1, 0) * 18 }}>
                  <Space spacing={6}>
                    <Tag color={record.itemType === 'directory' ? 'cyan' : 'grey'}>
                      {record.itemType === 'directory' ? '目录' : '文件'}
                    </Tag>
                    <Typography.Text strong>{record.sourceName}</Typography.Text>
                  </Space>
                </div>
              ),
            },
            {
              title: '动作',
              dataIndex: 'action',
              key: 'action',
              width: 140,
              render: (value: OpenlistAiOrganizerAction) => (
                <Tag color={actionColorMap[value] || 'grey'}>{actionLabelMap[value] || value}</Tag>
              ),
            },
            {
              title: '变更',
              dataIndex: 'changeFlags',
              key: 'changeFlags',
              width: 180,
              render: (value: string[]) =>
                value && value.length > 0 ? (
                  <Space wrap>
                    {value.map(flag => (
                      <Tag key={flag} color="blue">
                        {flag}
                      </Tag>
                    ))}
                  </Space>
                ) : (
                  <Tag color="grey">无改动</Tag>
                ),
            },
            {
              title: '当前相对路径',
              dataIndex: 'sourceRelativePath',
              key: 'sourceRelativePath',
              width: 320,
              render: (value: string) => renderEllipsis(value, 300),
            },
            {
              title: '建议相对路径',
              dataIndex: 'suggestedRelativePath',
              key: 'suggestedRelativePath',
              width: 320,
              render: (value: string) => renderEllipsis(value, 300),
            },
            {
              title: '分类',
              dataIndex: 'classification',
              key: 'classification',
              width: 120,
            },
            {
              title: '摘要',
              key: 'summary',
              width: 220,
              render: (_: unknown, record: OpenlistAiOrganizerPlanItem) =>
                `${record.totalFiles} 文件 / ${record.totalDirs} 目录 / 深度 ${record.depth}`,
            },
            {
              title: '置信度',
              dataIndex: 'confidence',
              key: 'confidence',
              width: 100,
              render: (value: number) => `${Math.round(Number(value || 0) * 100)}%`,
            },
            {
              title: 'AI 理由',
              dataIndex: 'reason',
              key: 'reason',
              width: 340,
              render: (value: string) => renderEllipsis(value, 320),
            },
            {
              title: '样本路径',
              dataIndex: 'samplePaths',
              key: 'samplePaths',
              width: 340,
              render: (value: string[]) => (
                <Typography.Paragraph ellipsis={{ rows: 3, showTooltip: true }} style={{ margin: 0 }}>
                  {(value || []).join('\n') || '-'}
                </Typography.Paragraph>
              ),
            },
          ]}
        />
      </Card>

      {execution ? (
        <Card title="执行结果" shadows="hover" style={{ width: '100%' }}>
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Descriptions data={[]} row>
              <Descriptions.Item itemKey="已执行">{execution.appliedCount}</Descriptions.Item>
              <Descriptions.Item itemKey="已跳过">{execution.skippedCount}</Descriptions.Item>
              <Descriptions.Item itemKey="失败">{execution.failedCount}</Descriptions.Item>
              <Descriptions.Item itemKey="重复复核目录">{execution.duplicateFolderPath}</Descriptions.Item>
            </Descriptions>
            <Space wrap>
              {!execution.duplicateFolderDeleted && currentTaskDetail?.type === 'execute' ? (
                <Button
                  theme="solid"
                  type="danger"
                  loading={deletingDuplicateFolderTaskId === currentTaskDetail.id}
                  onClick={() => handleDeleteDuplicateFolder(currentTaskDetail.id).catch(() => undefined)}
                >
                  删除重复复核目录
                </Button>
              ) : (
                <Tag color="green">重复复核目录已删除</Tag>
              )}
            </Space>
            <Table<ExecuteOpenlistAiOrganizerResponse['items'][number]>
              rowKey="id"
              pagination={false}
              dataSource={execution.items}
              scroll={{ x: 'max(100%, 1280px)' }}
              columns={[
                {
                  title: '状态',
                  dataIndex: 'status',
                  key: 'status',
                  width: 120,
                  render: (value: string) => (
                    <Tag color={value === 'applied' ? 'green' : value === 'failed' ? 'red' : 'grey'}>{value}</Tag>
                  ),
                },
                {
                  title: '原路径',
                  dataIndex: 'sourcePath',
                  key: 'sourcePath',
                  width: 420,
                  render: (value: string) => renderEllipsis(value, 400),
                },
                {
                  title: '目标路径',
                  dataIndex: 'targetPath',
                  key: 'targetPath',
                  width: 420,
                  render: (value: string) => renderEllipsis(value, 400),
                },
                {
                  title: '说明',
                  dataIndex: 'message',
                  key: 'message',
                },
              ]}
            />
          </Space>
        </Card>
      ) : null}

      <Modal
        title="选择 OpenList 路径"
        visible={browseVisible}
        onCancel={() => setBrowseVisible(false)}
        onOk={() => {
          setRootPath(selectedBrowsePath || '/');
          setBrowseVisible(false);
        }}
        style={{ width: 760, maxWidth: '92vw' }}
        bodyStyle={{ maxHeight: 560, overflow: 'auto', padding: 20 }}
      >
        <Space vertical spacing={12} style={{ width: '100%' }}>
          <Typography.Text type="secondary">当前选择：{selectedBrowsePath || '/'}</Typography.Text>
          <div
            style={{
              width: '100%',
              minHeight: 360,
              maxHeight: 420,
              overflow: 'auto',
              border: '1px solid var(--semi-color-border)',
              borderRadius: 12,
              padding: 12,
              background: 'var(--semi-color-bg-1)',
            }}
          >
            <Tree
              style={{ width: '100%' }}
              blockNode
              treeData={treeData}
              loadData={async node => {
                if (node) {
                  await onLoadTreeData(node);
                }
              }}
              onSelect={selectedKeys => {
                const key = Array.isArray(selectedKeys) ? String(selectedKeys[0] || '/') : String(selectedKeys || '/');
                setSelectedBrowsePath(key);
              }}
              selectedKey={selectedBrowsePath}
              emptyContent={treeLoading ? '加载中...' : '暂无目录'}
            />
          </div>
        </Space>
      </Modal>
    </Space>
  );
}

export default SettingOpenlistAiOrganizerApp;
