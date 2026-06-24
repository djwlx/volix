import { useEffect, useState } from 'react';
import { Button, Input, Space, TagInput, Toast, Typography } from '@douyinfe/semi-ui';
import { PageCard } from '@/components';
import { useI18n } from '@/i18n';
import { testAccountConfig, updateAccountConfig } from '@/services/user';
import { AccountConfigPlatform } from '@volix/types';
import type { AstrbotAccountConfigItem } from '@volix/types';

interface AstrbotAccountCardProps {
  initialConfig?: AstrbotAccountConfigItem;
  onSaved: (config: AstrbotAccountConfigItem) => void;
}

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || fallback;
};

export function AstrbotAccountCard({ initialConfig, onSaved }: AstrbotAccountCardProps) {
  const { t } = useI18n();
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl || 'http://localhost:6185');
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [umos, setUmos] = useState<string[]>(initialConfig?.umos || []);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!initialConfig) {
      return;
    }
    setBaseUrl(initialConfig.baseUrl || '');
    setApiKey(initialConfig.apiKey || '');
    setUmos(initialConfig.umos || []);
  }, [initialConfig]);

  const buildConfig = (): AstrbotAccountConfigItem => {
    const normalizedUmos = Array.from(new Set(umos.map(item => item.trim()).filter(Boolean)));
    return {
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      ...(normalizedUmos.length ? { umos: normalizedUmos } : {}),
    };
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const config = buildConfig();
      await updateAccountConfig({ platform: AccountConfigPlatform.ASTRBOT, config });
      onSaved(config);
      Toast.success(t('setting.account.platformSaveSuccess', { title: 'AstrBot' }));
    } catch (error) {
      Toast.error(getErrorMessage(error, t('setting.account.platformSaveFailed', { title: 'AstrBot' })));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const res = await testAccountConfig({ platform: AccountConfigPlatform.ASTRBOT, config: buildConfig() });
      Toast.success(res.data?.message || t('setting.account.platformConnectionSuccess', { title: 'AstrBot' }));
    } catch (error) {
      Toast.error(getErrorMessage(error, t('setting.account.platformConnectionFailed', { title: 'AstrBot' })));
    } finally {
      setTesting(false);
    }
  };

  return (
    <PageCard title="AstrBot" shadows="hover" style={{ width: '100%' }}>
      <Space vertical spacing={12} align="start" style={{ width: '100%' }}>
        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('setting.account.baseUrl')}</Typography.Text>
          <Input
            value={baseUrl}
            placeholder="http://localhost:6185"
            style={{ marginTop: 4 }}
            onChange={value => setBaseUrl(value)}
          />
        </div>

        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('setting.account.astrbot.apiKey')}</Typography.Text>
          <Input
            value={apiKey}
            mode="password"
            placeholder={t('setting.account.astrbot.apiKey.placeholder')}
            style={{ marginTop: 4 }}
            onChange={value => setApiKey(value)}
          />
        </div>

        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('setting.account.astrbot.umo')}</Typography.Text>
          <TagInput
            value={umos}
            placeholder={t('setting.account.astrbot.umo.placeholder')}
            style={{ marginTop: 4, width: '100%' }}
            onChange={value => setUmos(value)}
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
