import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Toast } from '@douyinfe/semi-ui';
import { AppForm, Loading } from '@/components';
import { useI18n } from '@/i18n';
import { getAccountConfigs, testAccountConfig, updateAccountConfig } from '@/services/user';
import { useAppPageContext } from '@/hooks';
import { AccountConfigPlatform, UserRole } from '@volix/types';

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
  const { t } = useI18n();
  const { user, requestNavigate } = useAppPageContext();
  const [initialValues, setInitialValues] = useState<AccountConfigFormValues>(EMPTY_VALUES);
  const [formValues, setFormValues] = useState<AccountConfigFormValues>(EMPTY_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

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
        Toast.error(t({ id: 'setting.account.loadFailed', defaultMessage: '加载账号配置失败' }));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, isAdmin, platform, requestNavigate]);

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
      const nextValues = {
        baseUrl: payload.baseUrl.trim(),
        username: payload.username.trim(),
        password: payload.password.trim(),
      };
      setInitialValues(nextValues);
      setFormValues(nextValues);
      Toast.success(t({ id: 'setting.account.saveSuccess', defaultMessage: '配置保存成功' }));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t({ id: 'common.action.saveFailed', defaultMessage: '保存失败' }));
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
      Toast.success(res.data?.message || t({ id: 'setting.account.connectionSuccess', defaultMessage: '联通成功' }));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t({ id: 'setting.account.connectionFailed', defaultMessage: '联通失败' }));
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
            }}
            onSubmit={onSubmit}
          >
            <AppForm.Input
              field="baseUrl"
              label={t({ id: 'setting.account.baseUrl', defaultMessage: '服务地址' })}
              placeholder={t({ id: 'setting.account.baseUrl.placeholder', defaultMessage: '请输入 http(s) 地址' })}
            />
            <AppForm.Input
              field="username"
              label={t({ id: 'setting.account.username', defaultMessage: '账号' })}
              placeholder={t({ id: 'setting.account.username.placeholder', defaultMessage: '请输入账号' })}
            />
            <AppForm.Input
              field="password"
              label={t({ id: 'setting.account.password', defaultMessage: '密码' })}
              mode="password"
              placeholder={t({ id: 'setting.account.password.placeholder', defaultMessage: '请输入密码' })}
            />
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                {t({ id: 'common.action.saveConfig', defaultMessage: '保存配置' })}
              </Button>
              <Button loading={testing} onClick={onTestConnection}>
                {t({ id: 'setting.account.testConnection', defaultMessage: '测试联通性' })}
              </Button>
            </Space>
          </AppForm>
        </Space>
      )}
    </Card>
  );
}

export default AccountConfigForm;
