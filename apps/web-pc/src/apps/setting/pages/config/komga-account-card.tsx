import { useEffect, useState } from 'react';
import { Button, Input, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { PageCard } from '@/components';
import { useI18n } from '@/i18n';
import { testAccountConfig, updateAccountConfig } from '@/services/user';
import { AccountConfigPlatform } from '@volix/types';
import type { KomgaAccountConfigItem } from '@volix/types';

interface KomgaAccountCardProps {
  initialConfig?: KomgaAccountConfigItem;
  onSaved: (config: KomgaAccountConfigItem) => void;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || fallback;
};

export function KomgaAccountCard({ initialConfig, onSaved }: KomgaAccountCardProps) {
  const { t } = useI18n();
  const title = t('setting.account.komga.title');
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl || 'http://localhost:25600');
  const [username, setUsername] = useState(initialConfig?.username || '');
  const [password, setPassword] = useState(initialConfig?.password || '');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!initialConfig) {
      return;
    }
    setBaseUrl(initialConfig.baseUrl || '');
    setUsername(initialConfig.username || '');
    setPassword(initialConfig.password || '');
    setApiKey(initialConfig.apiKey || '');
  }, [initialConfig]);

  const buildConfig = (): KomgaAccountConfigItem => ({
    baseUrl: baseUrl.trim(),
    ...(username.trim() ? { username: username.trim() } : {}),
    ...(password.trim() ? { password: password.trim() } : {}),
    ...(apiKey.trim() ? { apiKey: apiKey.trim() } : {}),
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const config = buildConfig();
      await updateAccountConfig({ platform: AccountConfigPlatform.KOMGA, config });
      onSaved(config);
      Toast.success(t('setting.account.platformSaveSuccess', { title }));
    } catch (error) {
      Toast.error(getErrorMessage(error, t('setting.account.platformSaveFailed', { title })));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const res = await testAccountConfig({ platform: AccountConfigPlatform.KOMGA, config: buildConfig() });
      Toast.success(res.data?.message || t('setting.account.platformConnectionSuccess', { title }));
    } catch (error) {
      Toast.error(getErrorMessage(error, t('setting.account.platformConnectionFailed', { title })));
    } finally {
      setTesting(false);
    }
  };

  return (
    <PageCard title={title} shadows="hover" style={{ width: '100%' }}>
      <Space vertical spacing={12} align="start" style={{ width: '100%' }}>
        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('setting.account.baseUrl')}</Typography.Text>
          <Input
            value={baseUrl}
            placeholder="http://localhost:25600"
            style={{ marginTop: 4 }}
            onChange={value => setBaseUrl(value)}
          />
        </div>

        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('setting.account.username')}</Typography.Text>
          <Input
            value={username}
            placeholder={t('setting.account.username.placeholder')}
            style={{ marginTop: 4 }}
            onChange={value => setUsername(value)}
          />
        </div>

        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('setting.account.password')}</Typography.Text>
          <Input
            value={password}
            mode="password"
            placeholder={t('setting.account.password.placeholder')}
            style={{ marginTop: 4 }}
            onChange={value => setPassword(value)}
          />
        </div>

        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('setting.account.komga.apiKey')}</Typography.Text>
          <Input
            value={apiKey}
            mode="password"
            placeholder={t('setting.account.komga.apiKey.placeholder')}
            style={{ marginTop: 4 }}
            onChange={value => setApiKey(value)}
          />
        </div>

        <Space>
          <Button type="primary" loading={saving} onClick={handleSave}>
            {t('common.action.saveConfig')}
          </Button>
          <Button loading={testing} onClick={handleTest}>
            {t('setting.account.testConnection')}
          </Button>
        </Space>
      </Space>
    </PageCard>
  );
}
