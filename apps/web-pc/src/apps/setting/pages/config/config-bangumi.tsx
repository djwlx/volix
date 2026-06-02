import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { AppForm, Loading } from '@/components';
import { useI18n } from '@/i18n';
import { getAccountConfigs, testAccountConfig, updateAccountConfig } from '@/services/user';
import { useAppPageContext } from '@/hooks';
import { AccountConfigPlatform, UserRole } from '@volix/types';
import type { BangumiAccountConfigItem } from '@volix/types';

const EMPTY_VALUES: BangumiAccountConfigItem = {
  baseUrl: 'https://api.bgm.tv',
  accessToken: '',
};

function SettingConfigBangumiApp() {
  const { t } = useI18n();
  const { user, requestNavigate } = useAppPageContext();
  const [initialValues, setInitialValues] = useState<BangumiAccountConfigItem>(EMPTY_VALUES);
  const [formValues, setFormValues] = useState<BangumiAccountConfigItem>(EMPTY_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

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
        Toast.error(t('setting.account.loadFailed'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, isAdmin, requestNavigate]);

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
      Toast.success(t('setting.account.platformSaveSuccess', { title: 'Bangumi' }));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('common.action.saveFailed'));
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
      Toast.success(res.data?.message || t('setting.account.connectionSuccess'));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('setting.account.connectionFailed'));
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
          <Typography.Text type="secondary">{t('setting.account.bangumi.accessTokenHint')}</Typography.Text>
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
            }}
            onSubmit={onSubmit}
          >
            <AppForm.Input field="baseUrl" label={t('setting.account.baseUrl')} placeholder="https://api.bgm.tv" />
            <AppForm.Input
              field="accessToken"
              label="Access Token"
              mode="password"
              placeholder={t('setting.account.bangumi.accessTokenPlaceholder')}
            />
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                {t('common.action.saveConfig')}
              </Button>
              <Button loading={testing} onClick={onTestConnection}>
                {t('setting.account.testConnection')}
              </Button>
            </Space>
          </AppForm>
        </Space>
      )}
    </Card>
  );
}

export default SettingConfigBangumiApp;
