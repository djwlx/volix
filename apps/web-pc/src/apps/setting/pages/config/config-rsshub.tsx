import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Input, InputNumber, Modal, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { AppForm } from '@/components';
import {
  addUserRssSubscription,
  clearRssStorage,
  getRssFeed,
  getRssStorageStatus,
  getUserRssSetting,
  getUserRssSubscriptions,
  removeUserRssSubscription,
  updateUserRssSetting,
} from '@/services/rss';
import { getHttpErrorMessage } from '@/utils/error';
import { parseFeed } from '@/apps/rss/feed-parser';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { RssStorageStatus, UserRssSubscriptionItem } from '@volix/types';
import { RssSubscriptionTable } from './config-rsshub-subscription-table';

const DEFAULT_HOST = 'https://rsshub.app';
const DEFAULT_REFRESH_INTERVAL_MINUTES = 5;

interface RssSettingFormValues {
  host: string;
  resourceProxyBaseUrl: string;
  refreshIntervalMinutes: number;
}

const formatBytes = (value: number) => {
  const size = Number(value || 0);
  if (!Number.isFinite(size) || size <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let unitIndex = 0;
  let current = size;
  while (current >= 1024 && unitIndex < units.length - 1) {
    current /= 1024;
    unitIndex += 1;
  }
  return `${current >= 10 || unitIndex === 0 ? current.toFixed(0) : current.toFixed(1)} ${units[unitIndex]}`;
};

const formatTime = (value: string) => {
  const text = String(value || '').trim();
  if (!text) {
    return '未知';
  }
  const timestamp = Date.parse(text);
  if (Number.isNaN(timestamp)) {
    return '未知';
  }
  return new Date(timestamp).toLocaleString();
};

function SettingConfigRsshubApp() {
  const [loading, setLoading] = useState(true);
  const [savingSetting, setSavingSetting] = useState(false);
  const [addingRoute, setAddingRoute] = useState(false);
  const [clearingRouteHistory, setClearingRouteHistory] = useState('');
  const [routeInput, setRouteInput] = useState('');
  const [subscriptions, setSubscriptions] = useState<UserRssSubscriptionItem[]>([]);
  const [formApi, setFormApi] = useState<FormApi<Record<string, unknown>>>();
  const [formInitValues, setFormInitValues] = useState<RssSettingFormValues>();
  const [storageStatus, setStorageStatus] = useState<RssStorageStatus>();
  const [clearHistoryModalState, setClearHistoryModalState] = useState<{
    visible: boolean;
    route: string;
    maxKeepLatestItems: number;
    keepLatestItems: number;
  }>({
    visible: false,
    route: '',
    maxKeepLatestItems: 1,
    keepLatestItems: 1,
  });

  const routeStatsMap = useMemo(() => {
    const map = new Map<
      string,
      {
        pendingCount: number;
        itemCount: number;
        lastUpdatedAt: string;
        lastNewCount: number;
        nextUpdateAt: string;
        storageSizeBytes: number;
        storageFileCount: number;
      }
    >();
    (storageStatus?.routes || []).forEach(item => {
      map.set(String(item.route || ''), {
        pendingCount: Number(item.pendingCount || 0),
        itemCount: Number(item.itemCount || 0),
        lastUpdatedAt: String(item.lastUpdatedAt || ''),
        lastNewCount: Number(item.lastNewCount || 0),
        nextUpdateAt: String(item.nextUpdateAt || ''),
        storageSizeBytes: Number(item.storageSizeBytes || 0),
        storageFileCount: Number(item.storageFileCount || 0),
      });
    });
    return map;
  }, [storageStatus?.routes]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingRes, subscriptionRes, storageRes] = await Promise.all([
        getUserRssSetting(),
        getUserRssSubscriptions(),
        getRssStorageStatus(),
      ]);
      setFormInitValues({
        host: settingRes.data?.host || DEFAULT_HOST,
        resourceProxyBaseUrl: String(settingRes.data?.resourceProxyBaseUrl || ''),
        refreshIntervalMinutes: Number(settingRes.data?.refreshIntervalMinutes || DEFAULT_REFRESH_INTERVAL_MINUTES),
      });
      const nextSubscriptions = subscriptionRes.data || [];
      setSubscriptions(nextSubscriptions);
      setStorageStatus(storageRes.data);

      const needResolveName = nextSubscriptions.filter(item => !String(item.name || '').trim());
      if (needResolveName.length > 0) {
        const resolvedNameEntries = await Promise.all(
          needResolveName.map(async item => {
            try {
              const feedRes = await getRssFeed({ route: item.route });
              const parsed = parseFeed(feedRes.data);
              const resolvedName = String(parsed.title || '').trim();
              if (!resolvedName) {
                return [item.route, item.route] as const;
              }
              return [item.route, resolvedName] as const;
            } catch {
              return [item.route, item.route] as const;
            }
          })
        );
        const resolvedNameMap = new Map<string, string>(resolvedNameEntries);
        setSubscriptions(prev =>
          prev.map(item => ({
            ...item,
            name: item.name || resolvedNameMap.get(item.route) || item.route,
          }))
        );
      }
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '加载 RSS 配置失败'));
    } finally {
      setLoading(false);
    }
  };

  const refreshStorage = async () => {
    try {
      const res = await getRssStorageStatus();
      setStorageStatus(res.data);
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '刷新存储状态失败'));
    }
  };

  useEffect(() => {
    loadData().catch(() => undefined);
  }, []);

  useEffect(() => {
    const hasPending = (storageStatus?.routes || []).some(item => Number(item.pendingCount || 0) > 0);
    if (!hasPending) {
      return;
    }
    const timer = window.setInterval(() => {
      refreshStorage().catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [storageStatus?.routes]);

  const onSaveSetting = async (values: unknown) => {
    const payload = values as RssSettingFormValues;
    setSavingSetting(true);
    try {
      const res = await updateUserRssSetting({
        host: String(payload.host || ''),
        resourceProxyBaseUrl: String(payload.resourceProxyBaseUrl || ''),
        refreshIntervalMinutes: Math.max(1, Number(payload.refreshIntervalMinutes || DEFAULT_REFRESH_INTERVAL_MINUTES)),
      });
      const nextValues: RssSettingFormValues = {
        host: res.data.host || DEFAULT_HOST,
        resourceProxyBaseUrl: String(res.data.resourceProxyBaseUrl || ''),
        refreshIntervalMinutes: Number(res.data.refreshIntervalMinutes || DEFAULT_REFRESH_INTERVAL_MINUTES),
      };
      setFormInitValues(nextValues);
      formApi?.setValues(nextValues as unknown as Partial<Record<string, unknown>>);
      Toast.success('RSS 配置已保存');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '保存 RSS 配置失败'));
    } finally {
      setSavingSetting(false);
    }
  };

  const onAddRoute = async () => {
    setAddingRoute(true);
    try {
      const res = await addUserRssSubscription({ route: routeInput });
      setRouteInput('');
      setSubscriptions(prev => {
        const exists = prev.some(item => item.route === res.data.route);
        if (exists) {
          return prev;
        }
        return [res.data, ...prev];
      });
      Toast.success('订阅已添加');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '添加订阅失败'));
    } finally {
      setAddingRoute(false);
    }
  };

  const onDeleteRoute = async (route: string) => {
    try {
      await removeUserRssSubscription(route);
      setSubscriptions(prev => prev.filter(item => item.route !== route));
      await refreshStorage();
      Toast.success('订阅已移除');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '移除订阅失败'));
    }
  };

  const onOpenClearRouteHistoryModal = (route: string) => {
    const routeItemCount = Number(routeStatsMap.get(route)?.itemCount || 0);
    if (routeItemCount <= 1) {
      Toast.warning('该订阅至少需要 2 条以上历史数据，才支持按保留条数清理');
      return;
    }
    const maxKeepLatestItems = routeItemCount - 1;
    setClearHistoryModalState({
      visible: true,
      route,
      maxKeepLatestItems,
      keepLatestItems: Math.min(20, maxKeepLatestItems),
    });
  };

  const onConfirmClearRouteHistory = async () => {
    const route = clearHistoryModalState.route;
    const keepLatestItems = Math.floor(Number(clearHistoryModalState.keepLatestItems || 0));
    const maxKeepLatestItems = clearHistoryModalState.maxKeepLatestItems;
    if (!route) {
      return;
    }
    if (!Number.isFinite(keepLatestItems) || keepLatestItems <= 0 || keepLatestItems > maxKeepLatestItems) {
      Toast.error(`请输入有效数字，且必须大于 0 并小于等于 ${maxKeepLatestItems}`);
      return;
    }

    setClearingRouteHistory(route);
    try {
      const res = await clearRssStorage({
        scope: 'history',
        route,
        keepLatestItems,
      });
      setStorageStatus(res.data);
      Toast.success(`已清理，保留最新 ${keepLatestItems} 条`);
      setClearHistoryModalState(prev => ({
        ...prev,
        visible: false,
        route: '',
      }));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '清理订阅历史失败'));
    } finally {
      setClearingRouteHistory('');
    }
  };

  return (
    <Card title="RSS 配置" shadows="hover" style={{ width: '100%' }} loading={loading}>
      <div style={{ display: 'grid', gap: 16 }}>
        {formInitValues ? (
          <AppForm
            key={formInitValues.host}
            labelPosition="top"
            initValues={formInitValues}
            getFormApi={setFormApi}
            onSubmit={onSaveSetting}
          >
            <AppForm.Input field="host" label="RSSHub Host" />
            <AppForm.Input field="resourceProxyBaseUrl" label="静态资源代理地址（可空）" />
            <AppForm.Input field="refreshIntervalMinutes" label="订阅刷新间隔（分钟）" />
          </AppForm>
        ) : null}

        <Space>
          <Button type="primary" loading={savingSetting} onClick={() => formApi?.submitForm()}>
            保存配置
          </Button>
          <Button
            onClick={() => {
              formApi?.setValue('host', DEFAULT_HOST);
            }}
          >
            使用默认 Host
          </Button>
        </Space>

        <div style={{ display: 'grid', gap: 8 }}>
          <Typography.Text strong>订阅管理</Typography.Text>
          <Space align="start" wrap>
            <Input
              style={{ width: 420, maxWidth: '100%' }}
              value={routeInput}
              placeholder="例如：/zhihu/daily"
              onChange={value => setRouteInput(String(value || ''))}
            />
            <Button type="primary" loading={addingRoute} onClick={() => onAddRoute()}>
              新增订阅
            </Button>
          </Space>
          {subscriptions.length === 0 ? (
            <Empty title="暂无订阅" description="添加 route 后，阅读页会自动聚合订阅内容。" />
          ) : (
            <RssSubscriptionTable
              subscriptions={subscriptions}
              routeStatsMap={routeStatsMap}
              clearingRouteHistory={clearingRouteHistory}
              onDeleteRoute={onDeleteRoute}
              onOpenClearRouteHistoryModal={onOpenClearRouteHistoryModal}
              formatBytes={formatBytes}
              formatTime={formatTime}
            />
          )}
        </div>
      </div>
      <Modal
        title="清理订阅历史"
        visible={clearHistoryModalState.visible}
        okText="确认清理"
        cancelText="取消"
        okButtonProps={{
          type: 'danger',
          loading: clearingRouteHistory === clearHistoryModalState.route,
        }}
        onCancel={() =>
          setClearHistoryModalState(prev => ({
            ...prev,
            visible: false,
            route: '',
          }))
        }
        onOk={() => onConfirmClearRouteHistory().catch(() => undefined)}
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <Typography.Text>
            当前订阅：<Typography.Text strong>{clearHistoryModalState.route}</Typography.Text>
          </Typography.Text>
          <Typography.Text type="secondary">
            请输入要保留的最新条数（1 - {clearHistoryModalState.maxKeepLatestItems}）。
          </Typography.Text>
          <InputNumber
            min={1}
            max={Math.max(1, clearHistoryModalState.maxKeepLatestItems)}
            value={clearHistoryModalState.keepLatestItems}
            onChange={value => {
              const nextValue = Number(Array.isArray(value) ? value[0] : value);
              setClearHistoryModalState(prev => ({
                ...prev,
                keepLatestItems: Number.isFinite(nextValue) ? nextValue : 1,
              }));
            }}
          />
        </div>
      </Modal>
    </Card>
  );
}

export default SettingConfigRsshubApp;
