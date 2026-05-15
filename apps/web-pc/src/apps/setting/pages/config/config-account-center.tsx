import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { AppForm, Loading } from '@/components';
import { getAccountConfigs, testAccountConfig, updateAccountConfig } from '@/services/user';
import { useAppPageContext } from '@/hooks';
import { AccountConfigPlatform } from '@volix/types';
import type { AccountConfigMap, BangumiAccountConfigItem, ServiceAccountConfigItem } from '@volix/types';

interface ServiceCardProps {
  title: string;
  platform: AccountConfigPlatform.QBITTORRENT | AccountConfigPlatform.OPENLIST;
  initialConfig?: ServiceAccountConfigItem;
  onSaved: (config: ServiceAccountConfigItem) => void;
}

interface BangumiCardProps {
  initialConfig?: BangumiAccountConfigItem;
  onSaved: (config: BangumiAccountConfigItem) => void;
}

interface ServiceFormValues {
  baseUrl: string;
  username: string;
  password: string;
}

const EMPTY_SERVICE_VALUES: ServiceFormValues = {
  baseUrl: '',
  username: '',
  password: '',
};

const EMPTY_BANGUMI_VALUES: BangumiAccountConfigItem = {
  baseUrl: 'https://api.bgm.tv',
  accessToken: '',
};

function ServiceAccountCard({ title, platform, initialConfig, onSaved }: ServiceCardProps) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const initialValues = useMemo<ServiceFormValues>(
    () => ({
      baseUrl: initialConfig?.baseUrl || '',
      username: initialConfig?.username || '',
      password: initialConfig?.password || '',
    }),
    [initialConfig]
  );
  const [formValues, setFormValues] = useState<ServiceFormValues>(initialValues);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  const onSubmit = async (values: unknown) => {
    const payload = values as ServiceFormValues;
    const nextData: ServiceAccountConfigItem = {
      baseUrl: payload.baseUrl.trim(),
      username: payload.username.trim(),
      password: payload.password.trim(),
    };
    try {
      setSaving(true);
      await updateAccountConfig({
        platform,
        config: nextData,
      });
      onSaved(nextData);
      Toast.success(`${title} 配置保存成功`);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || `${title} 配置保存失败`);
    } finally {
      setSaving(false);
    }
  };

  const onTestConnection = async () => {
    try {
      setTesting(true);
      const res = await testAccountConfig({
        platform,
        config: {
          baseUrl: formValues.baseUrl.trim(),
          username: formValues.username.trim(),
          password: formValues.password.trim(),
        },
      });
      Toast.success(res.data?.message || `${title} 联通成功`);
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || `${title} 联通失败`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card title={title} shadows="hover" style={{ width: '100%' }}>
      <AppForm
        key={JSON.stringify(initialValues)}
        initValues={initialValues}
        onValueChange={values => {
          const next = values as Partial<ServiceFormValues>;
          setFormValues({
            baseUrl: next.baseUrl || '',
            username: next.username || '',
            password: next.password || '',
          });
        }}
        onSubmit={onSubmit}
      >
        <AppForm.Input field="baseUrl" label="服务地址" placeholder="请输入 http(s) 地址" />
        <AppForm.Input field="username" label="账号" placeholder="请输入账号" />
        <AppForm.Input field="password" label="密码" mode="password" placeholder="请输入密码" />
        <Space>
          <Button type="primary" htmlType="submit" loading={saving}>
            保存配置
          </Button>
          <Button loading={testing} onClick={onTestConnection}>
            测试联通性
          </Button>
        </Space>
      </AppForm>
    </Card>
  );
}

function BangumiAccountCard({ initialConfig, onSaved }: BangumiCardProps) {
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const initialValues = useMemo<BangumiAccountConfigItem>(
    () => ({
      baseUrl: initialConfig?.baseUrl || 'https://api.bgm.tv',
      accessToken: initialConfig?.accessToken || '',
    }),
    [initialConfig]
  );
  const [formValues, setFormValues] = useState<BangumiAccountConfigItem>(initialValues);

  useEffect(() => {
    setFormValues(initialValues);
  }, [initialValues]);

  const onSubmit = async (values: unknown) => {
    const payload = values as BangumiAccountConfigItem;
    const nextData: BangumiAccountConfigItem = {
      baseUrl: payload.baseUrl.trim() || 'https://api.bgm.tv',
      accessToken: payload.accessToken.trim(),
    };
    try {
      setSaving(true);
      await updateAccountConfig({
        platform: AccountConfigPlatform.BANGUMI,
        config: nextData,
      });
      onSaved(nextData);
      Toast.success('Bangumi 配置保存成功');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || 'Bangumi 配置保存失败');
    } finally {
      setSaving(false);
    }
  };

  const onTestConnection = async () => {
    try {
      setTesting(true);
      const res = await testAccountConfig({
        platform: AccountConfigPlatform.BANGUMI,
        config: {
          baseUrl: formValues.baseUrl.trim(),
          accessToken: formValues.accessToken.trim(),
        },
      });
      Toast.success(res.data?.message || 'Bangumi 联通成功');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || 'Bangumi 联通失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card title="Bangumi" shadows="hover" style={{ width: '100%' }}>
      <Space vertical spacing={12} style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          Access Token 可在 Bangumi 开发者页面生成。请求会优先使用当前浏览器的 User-Agent。
        </Typography.Text>
        <AppForm
          key={JSON.stringify(initialValues)}
          initValues={initialValues}
          onValueChange={values => {
            const next = values as Partial<BangumiAccountConfigItem>;
            setFormValues({
              baseUrl: (next.baseUrl || '').trim(),
              accessToken: (next.accessToken || '').trim(),
            });
          }}
          onSubmit={onSubmit}
        >
          <AppForm.Input field="baseUrl" label="服务地址" placeholder="https://api.bgm.tv" />
          <AppForm.Input field="accessToken" label="Access Token" mode="password" placeholder="请输入 Bangumi Token" />
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存配置
            </Button>
            <Button loading={testing} onClick={onTestConnection}>
              测试联通性
            </Button>
          </Space>
        </AppForm>
      </Space>
    </Card>
  );
}

function SettingConfigAccountCenterApp() {
  const { user, requestNavigate } = useAppPageContext();
  const [loading, setLoading] = useState(true);
  const [accountConfigs, setAccountConfigs] = useState<AccountConfigMap>({
    qbittorrent: EMPTY_SERVICE_VALUES,
    openlist: EMPTY_SERVICE_VALUES,
    bangumi: EMPTY_BANGUMI_VALUES,
  });

  useEffect(() => {
    if (!user) {
      requestNavigate('/auth');
      return;
    }
    setLoading(true);
    getAccountConfigs()
      .then(res => {
        setAccountConfigs({
          qbittorrent: res.data?.qbittorrent || EMPTY_SERVICE_VALUES,
          openlist: res.data?.openlist || EMPTY_SERVICE_VALUES,
          bangumi: res.data?.bangumi || EMPTY_BANGUMI_VALUES,
        });
      })
      .catch(() => {
        Toast.error('加载账号配置失败');
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return null;
  }

  return (
    <Card title="账号管理" shadows="hover" style={{ width: '100%' }}>
      {loading ? (
        <Loading rows={8} />
      ) : (
        <Space vertical spacing={16} style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            这里的账号配置是用户级别，每个用户拥有自己独立的服务凭据与测试结果。
          </Typography.Text>
          <Typography.Text type="secondary">SMTP 已迁移到「系统配置」，由管理员统一维护。</Typography.Text>
          <div
            style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 16,
            }}
          >
            <ServiceAccountCard
              title="qBittorrent"
              platform={AccountConfigPlatform.QBITTORRENT}
              initialConfig={accountConfigs.qbittorrent}
              onSaved={config => {
                setAccountConfigs(prev => ({
                  ...prev,
                  qbittorrent: config,
                }));
              }}
            />
            <ServiceAccountCard
              title="OpenList"
              platform={AccountConfigPlatform.OPENLIST}
              initialConfig={accountConfigs.openlist}
              onSaved={config => {
                setAccountConfigs(prev => ({
                  ...prev,
                  openlist: config,
                }));
              }}
            />
            <BangumiAccountCard
              initialConfig={accountConfigs.bangumi}
              onSaved={config => {
                setAccountConfigs(prev => ({
                  ...prev,
                  bangumi: config,
                }));
              }}
            />
          </div>
        </Space>
      )}
    </Card>
  );
}

export default SettingConfigAccountCenterApp;
