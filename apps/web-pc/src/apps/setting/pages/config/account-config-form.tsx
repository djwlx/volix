import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Toast } from '@douyinfe/semi-ui';
import { AppForm, Loading } from '@/components';
import { getAccountConfigs, testAccountConfig, updateAccountConfig } from '@/services/user';
import { useOutletContext } from 'react-router';
import { AccountConfigPlatform, UserRole } from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';

interface AccountConfigFormValues {
  baseUrl: string;
  username: string;
  password: string;
}

interface AccountConfigFormProps {
  platform: AccountConfigPlatform.QBITTORRENT | AccountConfigPlatform.OPENLIST;
  title: string;
}

const EMPTY_VALUES: AccountConfigFormValues = {
  baseUrl: '',
  username: '',
  password: '',
};

function AccountConfigForm({ platform, title }: AccountConfigFormProps) {
  const { user, requestNavigate, registerLeaveGuard } = useOutletContext<SettingOutletContext>();
  const [initialValues, setInitialValues] = useState<AccountConfigFormValues>(EMPTY_VALUES);
  const [formValues, setFormValues] = useState<AccountConfigFormValues>(EMPTY_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const loadConfig = async () => {
    const res = await getAccountConfigs();
    const config = res.data?.[platform];
    const nextValues = {
      baseUrl: config?.baseUrl || '',
      username: config?.username || '',
      password: config?.password || '',
    };
    setInitialValues(nextValues);
    setFormValues(nextValues);
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!isAdmin) {
      requestNavigate('/setting/info');
      return;
    }
    setLoading(true);
    loadConfig()
      .catch(() => {
        Toast.error('加载账号配置失败');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, isAdmin, platform, requestNavigate]);

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
    const payload = values as AccountConfigFormValues;
    try {
      setSaving(true);
      await updateAccountConfig({
        platform,
        config: {
          baseUrl: payload.baseUrl.trim(),
          username: payload.username.trim(),
          password: payload.password.trim(),
        },
      });
      registerLeaveGuard(null);
      const nextValues = {
        baseUrl: payload.baseUrl.trim(),
        username: payload.username.trim(),
        password: payload.password.trim(),
      };
      setInitialValues(nextValues);
      setFormValues(nextValues);
      setIsDirty(false);
      Toast.success('配置保存成功');
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
        platform,
        config: {
          baseUrl: formValues.baseUrl.trim(),
          username: formValues.username.trim(),
          password: formValues.password.trim(),
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
    <Card title={title} shadows="hover" style={{ width: '100%' }}>
      {loading ? (
        <Loading rows={5} />
      ) : (
        <Space vertical spacing={16} style={{ width: '100%' }}>
          <AppForm
            key={initialFingerprint}
            initValues={initialValues}
            onValueChange={values => {
              const next = values as AccountConfigFormValues;
              const nextValues = {
                baseUrl: next.baseUrl || '',
                username: next.username || '',
                password: next.password || '',
              };
              setFormValues(nextValues);
              const nextFingerprint = JSON.stringify({
                baseUrl: nextValues.baseUrl,
                username: nextValues.username,
                password: nextValues.password,
              });
              setIsDirty(nextFingerprint !== initialFingerprint);
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
        </Space>
      )}
    </Card>
  );
}

export default AccountConfigForm;
