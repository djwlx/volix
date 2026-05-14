import { useEffect, useState } from 'react';
import { Button, Card, Empty, Input, InputNumber, Space, Toast, Typography } from '@douyinfe/semi-ui';
import {
  addUserRssSubscription,
  getRssFeedHistory,
  getUserRssSetting,
  getUserRssSubscriptions,
  removeUserRssSubscription,
  updateUserRssSetting,
} from '@/services/rss';
import { getHttpErrorMessage } from '@/utils/error';
import { parseFeed } from '@/apps/rss/feed-parser';
import type { UserRssSubscriptionItem } from '@volix/types';

const DEFAULT_HOST = 'https://rsshub.app';
const DEFAULT_RESOURCE_CACHE_SIZE_MB = 512;

function SettingConfigRsshubApp() {
  const [loading, setLoading] = useState(true);
  const [savingHost, setSavingHost] = useState(false);
  const [addingRoute, setAddingRoute] = useState(false);
  const [host, setHost] = useState(DEFAULT_HOST);
  const [routeInput, setRouteInput] = useState('');
  const [resourceProxyBaseUrl, setResourceProxyBaseUrl] = useState('');
  const [resourceCacheMaxSizeMb, setResourceCacheMaxSizeMb] = useState(DEFAULT_RESOURCE_CACHE_SIZE_MB);
  const [subscriptions, setSubscriptions] = useState<UserRssSubscriptionItem[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingRes, subscriptionRes] = await Promise.all([getUserRssSetting(), getUserRssSubscriptions()]);
      setHost(settingRes.data?.host || DEFAULT_HOST);
      setResourceProxyBaseUrl(String(settingRes.data?.resourceProxyBaseUrl || ''));
      setResourceCacheMaxSizeMb(Number(settingRes.data?.resourceCacheMaxSizeMb || DEFAULT_RESOURCE_CACHE_SIZE_MB));
      const nextSubscriptions = subscriptionRes.data || [];
      setSubscriptions(nextSubscriptions);

      const needResolveName = nextSubscriptions.filter(item => !String(item.name || '').trim());
      if (needResolveName.length > 0) {
        const resolvedNameEntries = await Promise.all(
          needResolveName.map(async item => {
            try {
              const feedRes = await getRssFeedHistory({ route: item.route });
              const parsed = parseFeed(feedRes.data.page);
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

  useEffect(() => {
    loadData().catch(() => undefined);
  }, []);

  const saveHost = async () => {
    setSavingHost(true);
    try {
      const res = await updateUserRssSetting({
        host,
        resourceProxyBaseUrl,
        resourceCacheMaxSizeMb,
      });
      setHost(res.data.host || DEFAULT_HOST);
      setResourceProxyBaseUrl(String(res.data.resourceProxyBaseUrl || ''));
      setResourceCacheMaxSizeMb(Number(res.data.resourceCacheMaxSizeMb || DEFAULT_RESOURCE_CACHE_SIZE_MB));
      Toast.success('RSSHub Host 已保存');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '保存 Host 失败'));
    } finally {
      setSavingHost(false);
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
      Toast.success('订阅已移除');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '移除订阅失败'));
    }
  };

  return (
    <Card title="RSS 账号配置" shadows="hover" style={{ width: '100%' }} loading={loading}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 8 }}>RSSHub Host</Typography.Text>
          <Space align="start" wrap>
            <Input
              style={{ width: 420, maxWidth: '100%' }}
              value={host}
              placeholder="例如：https://rsshub.app"
              onChange={value => setHost(String(value || ''))}
            />
            <Input
              style={{ width: 420, maxWidth: '100%' }}
              value={resourceProxyBaseUrl}
              placeholder="资源请求代理地址（可空），例如：http://127.0.0.1:7890"
              onChange={value => setResourceProxyBaseUrl(String(value || ''))}
            />
            <InputNumber
              min={50}
              max={102400}
              value={resourceCacheMaxSizeMb}
              onChange={value => setResourceCacheMaxSizeMb(Number(Array.isArray(value) ? value[0] : value) || 50)}
              style={{ width: 220 }}
              suffix="MB"
            />
            <Button type="primary" loading={savingHost} onClick={() => saveHost()}>
              保存 Host
            </Button>
          </Space>
          <Typography.Text type="tertiary" style={{ display: 'block', marginTop: 8 }}>
            路由请求时会自动拼接这个 Host，比如 route=`/zhihu/daily`。
          </Typography.Text>
          <Typography.Text type="tertiary" style={{ display: 'block', marginTop: 8 }}>
            资源请求代理地址仅用于后端拉取远程图片时走代理，不会改写返回链接前缀；缓存命中时返回站内相对路径。
          </Typography.Text>
        </div>

        <div>
          <Typography.Text style={{ display: 'block', marginBottom: 8 }}>我的订阅（自动读取名称）</Typography.Text>
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
            <Button
              onClick={() => {
                setHost(DEFAULT_HOST);
              }}
            >
              使用默认 Host
            </Button>
          </Space>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          {subscriptions.length === 0 ? (
            <Empty title="暂无订阅" description="先添加几个 route，首页 RSS 面板就会自动使用。" />
          ) : (
            subscriptions.map(item => (
              <div
                key={item.id || item.route}
                style={{
                  border: '1px solid var(--app-border)',
                  borderRadius: 12,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'grid', gap: 4 }}>
                  <Typography.Text strong>{item.name || item.route}</Typography.Text>
                  <Typography.Text type="tertiary">{item.route}</Typography.Text>
                </div>
                <Button theme="borderless" type="danger" onClick={() => onDeleteRoute(item.route)}>
                  删除
                </Button>
              </div>
            ))
          )}
        </div>
      </div>
    </Card>
  );
}

export default SettingConfigRsshubApp;
