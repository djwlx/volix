import { useEffect, useMemo, useState } from 'react';
import { Button, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { AppForm, Loading, PageCard } from '@/components';
import { useI18n } from '@/i18n';
import { getAccountConfigs, testAccountConfig, updateAccountConfig } from '@/services/user';
import { useAppPageContext } from '@/hooks';
import { AccountConfigPlatform } from '@volix/types';
import type {
  AccountConfigMap,
  AiAccountConfigItem,
  AstrbotAccountConfigItem,
  BangumiAccountConfigItem,
  KomgaAccountConfigItem,
  ServiceAccountConfigItem,
} from '@volix/types';
import { AiAccountCard } from './ai-account-card';
import { AstrbotAccountCard } from './astrbot-account-card';
import { KomgaAccountCard } from './komga-account-card';

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
  const { t } = useI18n();
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
      Toast.success(t('setting.account.platformSaveSuccess', { title }));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('setting.account.platformSaveFailed', { title }));
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
      Toast.success(res.data?.message || t('setting.account.platformConnectionSuccess', { title }));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('setting.account.platformConnectionFailed', { title }));
    } finally {
      setTesting(false);
    }
  };

  return (
    <PageCard title={title} shadows="hover" style={{ width: '100%' }}>
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
        <AppForm.Input
          field="baseUrl"
          label={t('setting.account.baseUrl')}
          placeholder={t('setting.account.baseUrl.placeholder')}
        />
        <AppForm.Input
          field="username"
          label={t('setting.account.username')}
          placeholder={t('setting.account.username.placeholder')}
        />
        <AppForm.Input
          field="password"
          label={t('setting.account.password')}
          mode="password"
          placeholder={t('setting.account.password.placeholder')}
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
    </PageCard>
  );
}

function BangumiAccountCard({ initialConfig, onSaved }: BangumiCardProps) {
  const { t } = useI18n();
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
      Toast.success(t('setting.account.platformSaveSuccess', { title: 'Bangumi' }));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('setting.account.platformSaveFailed', { title: 'Bangumi' }));
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
      Toast.success(res.data?.message || t('setting.account.platformConnectionSuccess', { title: 'Bangumi' }));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('setting.account.platformConnectionFailed', { title: 'Bangumi' }));
    } finally {
      setTesting(false);
    }
  };

  return (
    <PageCard title="Bangumi" shadows="hover" style={{ width: '100%' }}>
      <Space vertical spacing={12} style={{ width: '100%' }}>
        <Typography.Text type="secondary">{t('setting.account.bangumi.accessTokenHint')}</Typography.Text>
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
    </PageCard>
  );
}

function SettingConfigAccountCenterApp() {
  const { t } = useI18n();
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
          ai: res.data?.ai,
          astrbot: res.data?.astrbot,
          komga: res.data?.komga,
        });
      })
      .catch(() => {
        Toast.error(t('setting.account.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [user, requestNavigate]);

  if (!user) {
    return null;
  }

  return (
    <PageCard title={t('route.settingAccount.title')} shadows="hover" style={{ width: '100%' }}>
      {loading ? (
        <Loading rows={8} />
      ) : (
        <Space vertical spacing={16} style={{ width: '100%' }}>
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
            <AiAccountCard
              initialConfig={accountConfigs.ai}
              onSaved={(config: AiAccountConfigItem) => {
                setAccountConfigs(prev => ({
                  ...prev,
                  ai: config,
                }));
              }}
            />
            <AstrbotAccountCard
              initialConfig={accountConfigs.astrbot}
              onSaved={(config: AstrbotAccountConfigItem) => {
                setAccountConfigs(prev => ({
                  ...prev,
                  astrbot: config,
                }));
              }}
            />
            <KomgaAccountCard
              initialConfig={accountConfigs.komga}
              onSaved={(config: KomgaAccountConfigItem) => {
                setAccountConfigs(prev => ({
                  ...prev,
                  komga: config,
                }));
              }}
            />
          </div>
        </Space>
      )}
    </PageCard>
  );
}

export default SettingConfigAccountCenterApp;
