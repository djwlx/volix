import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { AppForm, Loading } from '@/components';
import { getAccountConfigs, testAccountConfig, updateAccountConfig } from '@/services/user';
import { useOutletContext } from 'react-router';
import { AccountConfigPlatform, UserRole } from '@volix/types';
import type { BangumiAccountConfigItem } from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';

const EMPTY_VALUES: BangumiAccountConfigItem = {
  baseUrl: 'https://api.bgm.tv',
  accessToken: '',
};

function SettingConfigBangumiApp() {
  const { user, requestNavigate, registerLeaveGuard } = useOutletContext<SettingOutletContext>();
  const [initialValues, setInitialValues] = useState<BangumiAccountConfigItem>(EMPTY_VALUES);
  const [formValues, setFormValues] = useState<BangumiAccountConfigItem>(EMPTY_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!isAdmin) {
      requestNavigate('/setting/info');
      return;
    }
    setLoading(true);
    getAccountConfigs()
      .then(res => {
        const config = res.data?.bangumi;
        const nextValues = {
          baseUrl: config?.baseUrl || 'https://api.bgm.tv',
          accessToken: config?.accessToken || '',
        };
        setInitialValues(nextValues);
        setFormValues(nextValues);
      })
      .catch(() => {
        Toast.error('加载 Bangumi 配置失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, isAdmin, requestNavigate]);

  useEffect(() => {
    if (!isDirty) {
      registerLeaveGuard(null);
      return;
    }
    const confirmLeave = () => window.confirm('当前有未保存内容，确定离开吗？');
    registerLeaveGuard(confirmLeave);
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => {
      registerLeaveGuard(null);
      window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [isDirty, registerLeaveGuard]);

  const initialFingerprint = useMemo(() => JSON.stringify(initialValues), [initialValues]);

  const onSubmit = async (values: unknown) => {
    const payload = values as BangumiAccountConfigItem;
    try {
      setSaving(true);
      const nextValues = {
        baseUrl: payload.baseUrl.trim() || 'https://api.bgm.tv',
        accessToken: payload.accessToken.trim(),
      };
      await updateAccountConfig({
        platform: AccountConfigPlatform.BANGUMI,
        config: nextValues,
      });
      setInitialValues(nextValues);
      setFormValues(nextValues);
      setIsDirty(false);
      registerLeaveGuard(null);
      Toast.success('Bangumi 配置保存成功');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '保存失败');
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
      Toast.success(res.data?.message || '联通成功');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '联通失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card title="Bangumi" shadows="hover" style={{ width: '100%' }}>
      {loading ? (
        <Loading rows={4} />
      ) : (
        <Space vertical spacing={16} style={{ width: '100%' }}>
          <Typography.Text type="secondary">
            Access Token 可在 Bangumi 开发者页面生成。请求会优先使用当前浏览器的 User-Agent。
          </Typography.Text>
          <AppForm
            key={initialFingerprint}
            initValues={initialValues}
            onValueChange={values => {
              const next = values as Partial<BangumiAccountConfigItem>;
              const nextValues = {
                baseUrl: (next.baseUrl || '').trim(),
                accessToken: (next.accessToken || '').trim(),
              };
              setFormValues(nextValues);
              setIsDirty(JSON.stringify(nextValues) !== initialFingerprint);
            }}
            onSubmit={onSubmit}
          >
            <AppForm.Input field="baseUrl" label="服务地址" placeholder="https://api.bgm.tv" />
            <AppForm.Input
              field="accessToken"
              label="Access Token"
              mode="password"
              placeholder="请输入 Bangumi Token"
            />
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
      )}
    </Card>
  );
}

export default SettingConfigBangumiApp;
