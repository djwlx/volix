import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Select, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { PageCard } from '@/components';
import { useI18n } from '@/i18n';
import { listAiModels, testAccountConfig, updateAccountConfig } from '@/services/user';
import { AccountConfigPlatform, AiProvider } from '@volix/types';
import type { AiAccountConfigItem } from '@volix/types';

interface AiAccountCardProps {
  initialConfig?: AiAccountConfigItem;
  onSaved: (config: AiAccountConfigItem) => void;
}

interface ProviderPreset {
  value: AiProvider;
  label: string;
  baseUrl: string;
}

const PROVIDER_PRESETS: ProviderPreset[] = [
  { value: AiProvider.OPENAI, label: 'OpenAI', baseUrl: 'https://api.openai.com/v1' },
  { value: AiProvider.GEMINI, label: 'Gemini', baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai' },
  { value: AiProvider.DEEPSEEK, label: 'DeepSeek', baseUrl: 'https://api.deepseek.com/v1' },
  { value: AiProvider.CUSTOM, label: '', baseUrl: '' },
];

const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
  return message || fallback;
};

export function AiAccountCard({ initialConfig, onSaved }: AiAccountCardProps) {
  const { t } = useI18n();
  const [provider, setProvider] = useState<AiProvider>(initialConfig?.provider || AiProvider.OPENAI);
  const [baseUrl, setBaseUrl] = useState(initialConfig?.baseUrl || PROVIDER_PRESETS[0].baseUrl);
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey || '');
  const [model, setModel] = useState(initialConfig?.model || '');
  const [models, setModels] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);

  useEffect(() => {
    if (!initialConfig) {
      return;
    }
    setProvider(initialConfig.provider || AiProvider.OPENAI);
    setBaseUrl(initialConfig.baseUrl || '');
    setApiKey(initialConfig.apiKey || '');
    setModel(initialConfig.model || '');
  }, [initialConfig]);

  const providerOptions = useMemo(
    () =>
      PROVIDER_PRESETS.map(preset => ({
        value: preset.value,
        label: preset.value === AiProvider.CUSTOM ? t('setting.account.ai.provider.custom') : preset.label,
      })),
    [t]
  );

  const modelOptions = useMemo(() => {
    const merged = new Set(models);
    if (model) {
      merged.add(model);
    }
    return Array.from(merged).map(item => ({ value: item, label: item }));
  }, [models, model]);

  const handleProviderChange = (value: AiProvider) => {
    setProvider(value);
    const preset = PROVIDER_PRESETS.find(item => item.value === value);
    if (preset && preset.value !== AiProvider.CUSTOM) {
      setBaseUrl(preset.baseUrl);
    }
  };

  const handleFetchModels = async () => {
    if (!baseUrl.trim() || !apiKey.trim()) {
      Toast.warning(t('setting.account.ai.connectionRequired'));
      return;
    }
    try {
      setFetchingModels(true);
      const res = await listAiModels({ baseUrl: baseUrl.trim(), apiKey: apiKey.trim() });
      const nextModels = res.data?.models || [];
      setModels(nextModels);
      Toast.success(t('setting.account.ai.fetchModelsSuccess', { count: nextModels.length }));
    } catch (error) {
      Toast.error(getErrorMessage(error, t('setting.account.ai.fetchModelsFailed')));
    } finally {
      setFetchingModels(false);
    }
  };

  const buildConfig = (): AiAccountConfigItem => ({
    provider,
    baseUrl: baseUrl.trim(),
    apiKey: apiKey.trim(),
    model: model.trim(),
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const config = buildConfig();
      await updateAccountConfig({ platform: AccountConfigPlatform.AI, config });
      onSaved(config);
      Toast.success(t('setting.account.platformSaveSuccess', { title: 'AI' }));
    } catch (error) {
      Toast.error(getErrorMessage(error, t('setting.account.platformSaveFailed', { title: 'AI' })));
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      const res = await testAccountConfig({ platform: AccountConfigPlatform.AI, config: buildConfig() });
      Toast.success(res.data?.message || t('setting.account.platformConnectionSuccess', { title: 'AI' }));
    } catch (error) {
      Toast.error(getErrorMessage(error, t('setting.account.platformConnectionFailed', { title: 'AI' })));
    } finally {
      setTesting(false);
    }
  };

  return (
    <PageCard title={t('setting.account.ai.title')} shadows="hover" style={{ width: '100%' }}>
      <Space vertical spacing={12} align="start" style={{ width: '100%' }}>
        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('setting.account.ai.provider')}</Typography.Text>
          <Select<AiProvider>
            value={provider}
            optionList={providerOptions}
            style={{ width: '100%', marginTop: 4 }}
            onChange={value => handleProviderChange(value as AiProvider)}
          />
        </div>

        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('setting.account.baseUrl')}</Typography.Text>
          <Input
            value={baseUrl}
            placeholder={t('setting.account.baseUrl.placeholder')}
            style={{ marginTop: 4 }}
            onChange={value => setBaseUrl(value)}
          />
        </div>

        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('setting.account.ai.apiKey')}</Typography.Text>
          <Input
            value={apiKey}
            mode="password"
            placeholder={t('setting.account.ai.apiKey.placeholder')}
            style={{ marginTop: 4 }}
            onChange={value => setApiKey(value)}
          />
        </div>

        <div style={{ width: '100%' }}>
          <Typography.Text type="secondary">{t('setting.account.ai.model')}</Typography.Text>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <Select<string>
              key={`model-${models.join('|')}`}
              filter
              allowCreate
              value={model || undefined}
              optionList={modelOptions}
              style={{ flex: 1, minWidth: 0 }}
              placeholder={t('setting.account.ai.model.placeholder')}
              onChange={value => setModel(String(value ?? ''))}
            />
            <Button loading={fetchingModels} onClick={handleFetchModels}>
              {t('setting.account.ai.fetchModels')}
            </Button>
          </div>
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
