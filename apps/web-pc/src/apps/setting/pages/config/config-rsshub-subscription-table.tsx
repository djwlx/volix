import { useMemo } from 'react';
import { Button, Popconfirm, Space, Table, Tag, Typography } from '@douyinfe/semi-ui';
import type { UserRssSubscriptionItem } from '@volix/types';

interface RouteStat {
  pendingCount: number;
  itemCount: number;
  lastUpdatedAt: string;
  nextUpdateAt: string;
  storageSizeBytes: number;
  storageFileCount: number;
}

interface SubscriptionTableProps {
  subscriptions: UserRssSubscriptionItem[];
  routeStatsMap: Map<string, RouteStat>;
  clearingRouteHistory: string;
  onDeleteRoute: (route: string) => void;
  onOpenClearRouteHistoryModal: (route: string) => void;
  formatBytes: (value: number) => string;
  formatTime: (value: string) => string;
}

type SubscriptionRow = {
  key: string | number;
  route: string;
  title: string;
  itemCount: number;
  pendingCount: number;
  storageFileCount: number;
  storageSizeBytes: number;
  lastUpdatedAt: string;
  nextUpdateAt: string;
};

export function RssSubscriptionTable({
  subscriptions,
  routeStatsMap,
  clearingRouteHistory,
  onDeleteRoute,
  onOpenClearRouteHistoryModal,
  formatBytes,
  formatTime,
}: SubscriptionTableProps) {
  const tableMinWidth = 1200;

  const rows = useMemo<SubscriptionRow[]>(() => {
    return subscriptions.map(item => {
      const routeStat = routeStatsMap.get(item.route);
      return {
        key: item.id || item.route,
        route: item.route,
        title: item.name || item.route,
        itemCount: routeStat?.itemCount || 0,
        pendingCount: routeStat?.pendingCount || 0,
        storageFileCount: routeStat?.storageFileCount || 0,
        storageSizeBytes: routeStat?.storageSizeBytes || 0,
        lastUpdatedAt: routeStat?.lastUpdatedAt || '',
        nextUpdateAt: routeStat?.nextUpdateAt || '',
      };
    });
  }, [routeStatsMap, subscriptions]);

  const columns = useMemo(() => {
    return [
      {
        title: '订阅',
        dataIndex: 'route',
        width: 380,
        render: (_: unknown, record: SubscriptionRow) => (
          <div style={{ display: 'grid', gap: 4 }}>
            <Space spacing={8} align="center" wrap>
              <Typography.Text strong>{record.title}</Typography.Text>
              <Tag size="small" color={record.pendingCount > 0 ? 'orange' : 'green'}>
                {record.pendingCount > 0 ? `待处理 ${record.pendingCount}` : '状态正常'}
              </Tag>
            </Space>
            <Typography.Text
              type="tertiary"
              style={{
                wordBreak: 'break-all',
                fontFamily:
                  "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
              }}
            >
              {record.route}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: '数据概览',
        dataIndex: 'stats',
        width: 320,
        render: (_: unknown, record: SubscriptionRow) => (
          <Space spacing={6} wrap>
            <Tag size="small" color="blue">{`已入库 ${record.itemCount}`}</Tag>
            <Tag size="small" color="orange">{`待处理 ${record.pendingCount}`}</Tag>
            <Tag size="small" color="cyan">{`文件 ${record.storageFileCount}`}</Tag>
            <Tag size="small" color="indigo">{`占用 ${formatBytes(record.storageSizeBytes)}`}</Tag>
          </Space>
        ),
      },
      {
        title: '更新时间',
        dataIndex: 'schedule',
        width: 320,
        render: (_: unknown, record: SubscriptionRow) => (
          <div style={{ display: 'grid', gap: 2 }}>
            <Typography.Text size="small" type="tertiary">
              上次更新：{formatTime(record.lastUpdatedAt)}
            </Typography.Text>
            <Typography.Text size="small" type="tertiary">
              下次更新：{formatTime(record.nextUpdateAt)}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: '操作',
        dataIndex: 'actions',
        align: 'right' as const,
        width: 180,
        render: (_: unknown, record: SubscriptionRow) => (
          <Space spacing={8}>
            <Popconfirm
              title="确定删除该订阅？"
              content="删除后不会再自动拉取此 route。"
              onConfirm={() => onDeleteRoute(record.route)}
            >
              <Button theme="borderless" type="danger" size="small">
                删除
              </Button>
            </Popconfirm>
            <Button
              theme="borderless"
              size="small"
              loading={clearingRouteHistory === record.route}
              onClick={() => onOpenClearRouteHistoryModal(record.route)}
            >
              清理历史
            </Button>
          </Space>
        ),
      },
    ];
  }, [clearingRouteHistory, formatBytes, formatTime, onDeleteRoute, onOpenClearRouteHistoryModal]);

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <Table
        rowKey="key"
        size="small"
        style={{ width: '100%' }}
        tableLayout="fixed"
        columns={columns}
        dataSource={rows}
        pagination={false}
        bordered
        scroll={{ x: tableMinWidth }}
      />
    </div>
  );
}
