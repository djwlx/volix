import { useEffect, useState } from 'react';
import { Button, Card, Empty, Space, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import {
  getAnimeSubscriptionItems,
  getAnimeSubscriptionList,
  getAnimeSubscriptionLogs,
  toggleAnimeSubscription,
  triggerAnimeSubscriptionCheck,
} from '@/services/anime-subscription';
import { useOutletContext } from 'react-router';
import {
  AnimeSubscriptionItemStatus,
  AnimeSubscriptionStatus,
  type AnimeSubscriptionItemResponse,
  type AnimeSubscriptionResponse,
} from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';
import type { TagColor } from '@douyinfe/semi-ui/lib/es/tag';

const statusColorMap: Record<AnimeSubscriptionStatus, TagColor> = {
  [AnimeSubscriptionStatus.ACTIVE]: 'green',
  [AnimeSubscriptionStatus.PAUSED]: 'grey',
  [AnimeSubscriptionStatus.ERROR]: 'red',
};

const statusLabelMap: Record<AnimeSubscriptionStatus, string> = {
  [AnimeSubscriptionStatus.ACTIVE]: '运行中',
  [AnimeSubscriptionStatus.PAUSED]: '已暂停',
  [AnimeSubscriptionStatus.ERROR]: '异常',
};

const itemStatusColorMap: Record<AnimeSubscriptionItemStatus, TagColor> = {
  [AnimeSubscriptionItemStatus.PENDING]: 'grey',
  [AnimeSubscriptionItemStatus.SKIPPED]: 'yellow',
  [AnimeSubscriptionItemStatus.QUEUED]: 'blue',
  [AnimeSubscriptionItemStatus.DOWNLOADING]: 'cyan',
  [AnimeSubscriptionItemStatus.DOWNLOADED]: 'green',
  [AnimeSubscriptionItemStatus.ORGANIZED]: 'green',
  [AnimeSubscriptionItemStatus.FAILED]: 'red',
};

const itemStatusLabelMap: Record<AnimeSubscriptionItemStatus, string> = {
  [AnimeSubscriptionItemStatus.PENDING]: '待处理',
  [AnimeSubscriptionItemStatus.SKIPPED]: '已跳过',
  [AnimeSubscriptionItemStatus.QUEUED]: '已投递',
  [AnimeSubscriptionItemStatus.DOWNLOADING]: '下载中',
  [AnimeSubscriptionItemStatus.DOWNLOADED]: '已下载',
  [AnimeSubscriptionItemStatus.ORGANIZED]: '已整理',
  [AnimeSubscriptionItemStatus.FAILED]: '失败',
};

const renderEllipsisText = (
  value?: string | null,
  options?: { type?: 'danger' | 'secondary' | 'tertiary'; width?: number | string }
) => {
  const text = String(value || '').trim();
  if (!text) {
    return '-';
  }
  return (
    <Typography.Text
      type={options?.type}
      ellipsis={{ showTooltip: true }}
      style={{ display: 'block', width: options?.width || '100%' }}
    >
      {text}
    </Typography.Text>
  );
};

const formatSeasonEpisode = (item: AnimeSubscriptionItemResponse) => {
  if (!item.season || !item.episode) {
    return '-';
  }
  return `S${String(item.season).padStart(2, '0')}E${String(item.episode).padStart(2, '0')}`;
};

function SettingAnimeSubscriptionApp() {
  const { isAdmin, requestNavigate } = useOutletContext<SettingOutletContext>();
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<AnimeSubscriptionResponse[]>([]);
  const [expandedRowKeys, setExpandedRowKeys] = useState<Array<string | number>>([]);
  const [detailLoadingMap, setDetailLoadingMap] = useState<Record<string, boolean>>({});
  const [itemMap, setItemMap] = useState<Record<string, AnimeSubscriptionItemResponse[]>>({});
  const [logMap, setLogMap] = useState<Record<string, string[]>>({});
  const [togglingId, setTogglingId] = useState<string | number>();
  const [checkingId, setCheckingId] = useState<string | number>();

  const loadDetail = async (id: string | number) => {
    const key = String(id);
    setDetailLoadingMap(prev => ({ ...prev, [key]: true }));
    try {
      const [itemsRes, logsRes] = await Promise.all([getAnimeSubscriptionItems(id), getAnimeSubscriptionLogs(id)]);
      setItemMap(prev => ({ ...prev, [key]: itemsRes.data }));
      setLogMap(prev => ({ ...prev, [key]: logsRes.data.logs || [] }));
    } catch {
      Toast.error('获取任务详情失败');
    } finally {
      setDetailLoadingMap(prev => ({ ...prev, [key]: false }));
    }
  };

  const loadData = async () => {
    if (!isAdmin) {
      return;
    }
    const res = await getAnimeSubscriptionList();
    setList(res.data);
  };

  useEffect(() => {
    setLoading(true);
    loadData()
      .catch(() => {
        Toast.error('获取追番任务失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <Card title="自动追番" shadows="hover" style={{ width: '100%' }}>
        <Empty title="暂无权限" description="仅管理员可查看自动追番" />
      </Card>
    );
  }

  return (
    <Card
      title="自动追番"
      shadows="hover"
      style={{ width: '100%' }}
      bodyStyle={{ width: '100%' }}
      headerExtraContent={
        <Button type="primary" onClick={() => requestNavigate('/setting/anime-subscription/add')}>
          新建任务
        </Button>
      }
    >
      <Space vertical spacing={12} style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          已支持任务管理、RSS 检测、资源优选、qBittorrent 投递，以及在 OpenList 可访问下载目录时的自动整理。
        </Typography.Text>
        <Table<AnimeSubscriptionResponse>
          rowKey="id"
          pagination={false}
          loading={loading}
          style={{ width: '100%' }}
          tableLayout="fixed"
          scroll={{ x: 'max(100%, 1280px)' }}
          size="small"
          dataSource={list}
          expandedRowKeys={expandedRowKeys}
          onExpand={(expanded, record) => {
            if (!record || !('id' in record)) {
              return;
            }
            const key = record.id;
            setExpandedRowKeys(prev =>
              expanded ? Array.from(new Set([...prev, key])) : prev.filter(item => item !== key)
            );
            if (expanded && !itemMap[String(key)] && !detailLoadingMap[String(key)]) {
              loadDetail(key).catch(() => {
                Toast.error('获取任务详情失败');
              });
            }
          }}
          expandedRowRender={record => {
            if (!record || !('id' in record)) {
              return null;
            }
            const key = String(record.id);
            const items = itemMap[key] || [];
            const logs = logMap[key] || [];
            const loadingDetail = Boolean(detailLoadingMap[key]);

            return (
              <Space vertical spacing={12} style={{ width: '100%' }}>
                <Typography.Title heading={6} style={{ margin: 0 }}>
                  最近判定结果
                </Typography.Title>
                <Table<AnimeSubscriptionItemResponse>
                  rowKey="id"
                  pagination={false}
                  loading={loadingDetail}
                  size="small"
                  dataSource={items.slice(0, 8)}
                  empty={<Empty title="暂无条目" description="还没有生成判定结果" />}
                  columns={[
                    {
                      title: '状态',
                      dataIndex: 'decisionStatus',
                      key: 'decisionStatus',
                      width: 100,
                      render: (value: AnimeSubscriptionItemStatus) => (
                        <Tag color={itemStatusColorMap[value] || 'grey'}>{itemStatusLabelMap[value] || value}</Tag>
                      ),
                    },
                    {
                      title: '季集',
                      key: 'seasonEpisode',
                      width: 110,
                      render: (_: unknown, item: AnimeSubscriptionItemResponse) => formatSeasonEpisode(item),
                    },
                    {
                      title: 'RSS 标题',
                      dataIndex: 'rssTitle',
                      key: 'rssTitle',
                      width: 320,
                      render: (value: string) => renderEllipsisText(value),
                    },
                    {
                      title: 'AI/系统原因',
                      dataIndex: 'reason',
                      key: 'reason',
                      width: 280,
                      render: (value: string | undefined) => renderEllipsisText(value, { type: 'secondary' }),
                    },
                    {
                      title: '目标路径',
                      dataIndex: 'targetPath',
                      key: 'targetPath',
                      width: 320,
                      render: (value: string | undefined) => renderEllipsisText(value),
                    },
                    {
                      title: 'qBit Hash',
                      dataIndex: 'qbitHash',
                      key: 'qbitHash',
                      width: 180,
                      render: (value: string | undefined) => renderEllipsisText(value, { type: 'tertiary' }),
                    },
                    {
                      title: '时间',
                      dataIndex: 'updatedAt',
                      key: 'updatedAt',
                      width: 180,
                      render: (value: string | undefined) => value || '-',
                    },
                  ]}
                />
                <Typography.Title heading={6} style={{ margin: 0 }}>
                  最近运行日志
                </Typography.Title>
                <Card bodyStyle={{ padding: 12 }} loading={loadingDetail}>
                  <Space vertical spacing={6} style={{ width: '100%' }}>
                    {logs.length > 0 ? (
                      logs
                        .slice(-20)
                        .reverse()
                        .map((line, index) => (
                          <Typography.Paragraph
                            key={`${key}-log-${index}`}
                            style={{
                              margin: 0,
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-all',
                            }}
                          >
                            {line}
                          </Typography.Paragraph>
                        ))
                    ) : (
                      <Empty title="暂无日志" description="还没有可展示的运行日志" />
                    )}
                  </Space>
                </Card>
              </Space>
            );
          }}
          columns={[
            {
              title: '番剧',
              dataIndex: 'name',
              key: 'name',
              width: 220,
              render: (_: unknown, record: AnimeSubscriptionResponse) => (
                <Space vertical spacing={4} align="start">
                  <Typography.Text strong>{record.name}</Typography.Text>
                  <Typography.Text type="tertiary" size="small">
                    {(record.aliases || []).join(' / ') || '无别名'}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: 'RSS',
              dataIndex: 'rssUrl',
              key: 'rssUrl',
              width: 240,
              ellipsis: {
                showTitle: true,
              },
            },
            {
              title: '3 个路径',
              key: 'paths',
              width: 340,
              render: (_: unknown, record: AnimeSubscriptionResponse) => (
                <Space vertical spacing={4} align="start">
                  <Typography.Text type="secondary" size="small">
                    最终番剧目录: {record.seriesRootPath || '未设置'}
                  </Typography.Text>
                  <Typography.Text type="secondary" size="small">
                    qBit 下载: {record.qbitSavePath}
                  </Typography.Text>
                  <Typography.Text type="secondary" size="small">
                    OpenList 下载: {record.openlistDownloadPath}
                  </Typography.Text>
                </Space>
              ),
            },
            {
              title: '周期',
              dataIndex: 'checkIntervalMinutes',
              key: 'checkIntervalMinutes',
              width: 110,
              render: (value: number) => `${value} 分钟`,
            },
            {
              title: 'AI',
              dataIndex: 'useAi',
              key: 'useAi',
              width: 90,
              render: (value: boolean) => (value ? <Tag color="blue">开启</Tag> : <Tag>关闭</Tag>),
            },
            {
              title: '状态',
              dataIndex: 'status',
              key: 'status',
              width: 110,
              render: (value: AnimeSubscriptionStatus) => (
                <Tag color={statusColorMap[value] || 'grey'}>{statusLabelMap[value] || value}</Tag>
              ),
            },
            {
              title: '运行阶段',
              dataIndex: 'currentStage',
              key: 'currentStage',
              width: 150,
              render: (value: string | null | undefined) => value || '-',
            },
            {
              title: '上一次检查',
              dataIndex: 'lastCheckedAt',
              key: 'lastCheckedAt',
              width: 180,
              render: (value: string | null | undefined) => value || '-',
            },
            {
              title: '最新集数',
              dataIndex: 'latestEpisode',
              key: 'latestEpisode',
              width: 110,
              render: (value: string | null | undefined) => value || '-',
            },
            {
              title: '错误原因',
              dataIndex: 'errorReason',
              key: 'errorReason',
              width: 260,
              render: (value: string | null | undefined) => renderEllipsisText(value, { type: 'danger' }),
            },
            {
              title: '操作',
              key: 'action',
              width: 220,
              render: (_: unknown, record: AnimeSubscriptionResponse) => (
                <Space>
                  <Button
                    theme="borderless"
                    type="primary"
                    onClick={() => requestNavigate(`/setting/anime-subscription/edit/${record.id}`)}
                  >
                    编辑
                  </Button>
                  <Button
                    theme="borderless"
                    loading={checkingId === record.id}
                    onClick={async () => {
                      try {
                        setCheckingId(record.id);
                        const res = await triggerAnimeSubscriptionCheck(record.id);
                        Toast.success(res.data.message || '已发起检查');
                        await loadData();
                      } catch (error) {
                        const message = (error as { response?: { data?: { message?: string } } })?.response?.data
                          ?.message;
                        Toast.error(message || '立即检查失败');
                      } finally {
                        setCheckingId(undefined);
                      }
                    }}
                  >
                    立即检查
                  </Button>
                  <Button
                    theme="borderless"
                    type={record.enabled ? 'danger' : 'tertiary'}
                    loading={togglingId === record.id}
                    onClick={async () => {
                      try {
                        setTogglingId(record.id);
                        await toggleAnimeSubscription(record.id);
                        Toast.success(record.enabled ? '任务已停用' : '任务已启用');
                        await loadData();
                      } catch (error) {
                        const message = (error as { response?: { data?: { message?: string } } })?.response?.data
                          ?.message;
                        Toast.error(message || '切换状态失败');
                      } finally {
                        setTogglingId(undefined);
                      }
                    }}
                  >
                    {record.enabled ? '停用' : '启用'}
                  </Button>
                </Space>
              ),
            },
          ]}
        />
      </Space>
    </Card>
  );
}

export default SettingAnimeSubscriptionApp;
