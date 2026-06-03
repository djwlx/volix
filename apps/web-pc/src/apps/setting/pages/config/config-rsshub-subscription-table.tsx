import { useMemo } from 'react';
import { Button, Popconfirm, Space, Table, Tag, Typography } from '@douyinfe/semi-ui';
import type { UserRssSubscriptionItem } from '@volix/types';
import { useI18n } from '@/i18n';

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
  togglingRouteEnabled: string;
  onDeleteRoute: (route: string) => void;
  onOpenClearRouteHistoryModal: (route: string) => void;
  onToggleRouteEnabled: (route: string, enabled: boolean) => void;
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
  enabled: boolean;
};

export function RssSubscriptionTable({
  subscriptions,
  routeStatsMap,
  clearingRouteHistory,
  togglingRouteEnabled,
  onDeleteRoute,
  onOpenClearRouteHistoryModal,
  onToggleRouteEnabled,
  formatBytes,
  formatTime,
}: SubscriptionTableProps) {
  const { t } = useI18n();
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
        enabled: item.enabled !== false,
      };
    });
  }, [routeStatsMap, subscriptions]);

  const columns = useMemo(() => {
    return [
      {
        title: t('setting.rss.table.subscription'),
        dataIndex: 'route',
        width: 380,
        render: (_: unknown, record: SubscriptionRow) => (
          <div style={{ display: 'grid', gap: 4 }}>
            <Space spacing={8} align="center" wrap>
              <Typography.Text strong>{record.title}</Typography.Text>
              <Tag size="small" color={!record.enabled ? 'grey' : record.pendingCount > 0 ? 'orange' : 'green'}>
                {!record.enabled
                  ? t('setting.rss.table.statusPaused')
                  : record.pendingCount > 0
                  ? t('setting.rss.table.pendingCount', { count: record.pendingCount })
                  : t('setting.rss.table.statusNormal')}
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
        title: t('setting.rss.table.overview'),
        dataIndex: 'stats',
        width: 320,
        render: (_: unknown, record: SubscriptionRow) => (
          <Space spacing={6} wrap>
            <Tag size="small" color="blue">
              {t('setting.rss.table.itemCount', { count: record.itemCount })}
            </Tag>
            <Tag size="small" color="orange">
              {t('setting.rss.table.pendingCount', { count: record.pendingCount })}
            </Tag>
            <Tag size="small" color="cyan">
              {t('setting.rss.table.fileCount', { count: record.storageFileCount })}
            </Tag>
            <Tag size="small" color="indigo">
              {t('setting.rss.table.storageSize', { size: formatBytes(record.storageSizeBytes) })}
            </Tag>
          </Space>
        ),
      },
      {
        title: t('setting.rss.table.updatedAt'),
        dataIndex: 'schedule',
        width: 320,
        render: (_: unknown, record: SubscriptionRow) => (
          <div style={{ display: 'grid', gap: 2 }}>
            <Typography.Text size="small" type="tertiary">
              {t('setting.rss.table.lastUpdatedAt', { time: formatTime(record.lastUpdatedAt) })}
            </Typography.Text>
            <Typography.Text size="small" type="tertiary">
              {record.enabled
                ? t('setting.rss.table.nextUpdatedAt', { time: formatTime(record.nextUpdateAt) })
                : t('setting.rss.table.nextUpdatePaused')}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: t('sqliteAdmin.table.action'),
        dataIndex: 'actions',
        align: 'right' as const,
        width: 180,
        render: (_: unknown, record: SubscriptionRow) => (
          <Space spacing={8}>
            <Button
              theme="borderless"
              size="small"
              loading={togglingRouteEnabled === record.route}
              onClick={() => onToggleRouteEnabled(record.route, !record.enabled)}
            >
              {record.enabled ? t('setting.rss.table.pause') : t('setting.rss.table.enable')}
            </Button>
            <Popconfirm
              title={t('setting.rss.table.deleteConfirmTitle')}
              content={t('setting.rss.table.deleteConfirmDescription')}
              onConfirm={() => onDeleteRoute(record.route)}
            >
              <Button theme="borderless" type="danger" size="small">
                {t('common.action.delete')}
              </Button>
            </Popconfirm>
            <Button
              theme="borderless"
              size="small"
              loading={clearingRouteHistory === record.route}
              onClick={() => onOpenClearRouteHistoryModal(record.route)}
            >
              {t('setting.rss.table.clearHistory')}
            </Button>
          </Space>
        ),
      },
    ];
  }, [
    clearingRouteHistory,
    formatBytes,
    formatTime,
    onDeleteRoute,
    onOpenClearRouteHistoryModal,
    onToggleRouteEnabled,
    togglingRouteEnabled,
  ]);

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
