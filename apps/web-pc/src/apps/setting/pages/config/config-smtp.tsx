import { useEffect, useMemo, useState } from 'react';
import { Button, Space, Toast } from '@douyinfe/semi-ui';
import { AppForm, Loading, PageCard } from '@/components';
import { useI18n } from '@/i18n';
import { getAccountConfigs, testAccountConfig, updateAccountConfig } from '@/services/user';
import { useAppPageContext } from '@/hooks';
import { AccountConfigPlatform, UserRole } from '@volix/types';
import type { SmtpAccountConfigItem } from '@volix/types';

const EMPTY_VALUES: SmtpAccountConfigItem = {
  host: '',
  port: 587,
  secure: false,
  username: '',
  password: '',
  fromEmail: '',
};

function SettingConfigSmtpApp() {
  const { t } = useI18n();
  const { user, requestNavigate } = useAppPageContext();
  const [initialValues, setInitialValues] = useState<SmtpAccountConfigItem>(EMPTY_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formValues, setFormValues] = useState<SmtpAccountConfigItem>(EMPTY_VALUES);

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
        const smtp = res.data?.smtp;
        if (!smtp) {
          setInitialValues(EMPTY_VALUES);
          setFormValues(EMPTY_VALUES);
          return;
        }
        const nextValues = {
          host: smtp.host || '',
          port: smtp.port || 587,
          secure: Boolean(smtp.secure),
          username: smtp.username || '',
          password: smtp.password || '',
          fromEmail: smtp.fromEmail || '',
        };
        setInitialValues(nextValues);
        setFormValues(nextValues);
      })
      .catch(() => Toast.error(t({ id: 'setting.smtp.loadFailed', defaultMessage: '加载 SMTP 配置失败' })))
      .finally(() => setLoading(false));
  }, [user, isAdmin, requestNavigate]);

  const initialFingerprint = useMemo(() => JSON.stringify(initialValues), [initialValues]);

  const onSubmit = async (values: unknown) => {
    const payload = values as SmtpAccountConfigItem;
    try {
      setSaving(true);
      const nextData: SmtpAccountConfigItem = {
        host: payload.host.trim(),
        port: Number(payload.port),
        secure: Boolean(payload.secure),
        username: payload.username.trim(),
        password: payload.password.trim(),
        fromEmail: payload.fromEmail.trim(),
      };
      await updateAccountConfig({
        platform: AccountConfigPlatform.SMTP,
        config: nextData,
      });
      setInitialValues(nextData);
      setFormValues(nextData);
      Toast.success(t({ id: 'setting.smtp.saveSuccess', defaultMessage: 'SMTP 配置保存成功' }));
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
        platform: AccountConfigPlatform.SMTP,
        config: {
          host: formValues.host.trim(),
          port: Number(formValues.port),
          secure: Boolean(formValues.secure),
          username: formValues.username.trim(),
          password: formValues.password.trim(),
          fromEmail: formValues.fromEmail.trim(),
        },
      });
      Toast.success(res.data?.message || t({ id: 'setting.smtp.connectionSuccess', defaultMessage: 'SMTP 联通成功' }));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t({ id: 'setting.smtp.connectionFailed', defaultMessage: 'SMTP 联通失败' }));
    } finally {
      setTesting(false);
    }
  };

  return (
    <PageCard title="SMTP" shadows="hover" style={{ width: '100%' }}>
      {loading ? (
        <Loading rows={6} />
      ) : (
        <Space vertical spacing={16} style={{ width: '100%' }}>
          <AppForm
            key={initialFingerprint}
            initValues={initialValues}
            onValueChange={values => {
              const next = values as Partial<SmtpAccountConfigItem>;
              const nextValues: SmtpAccountConfigItem = {
                host: (next.host || '').trim(),
                port: Number(next.port || 0),
                secure: Boolean(next.secure),
                username: (next.username || '').trim(),
                password: (next.password || '').trim(),
                fromEmail: (next.fromEmail || '').trim(),
              };
              setFormValues(nextValues);
            }}
            onSubmit={onSubmit}
          >
            <AppForm.Input
              field="host"
              label="SMTP Host"
              placeholder={t({ id: 'setting.smtp.host.placeholder', defaultMessage: '如 smtp.gmail.com' })}
            />
            <AppForm.Input
              field="port"
              label="SMTP Port"
              placeholder={t({ id: 'setting.smtp.port.placeholder', defaultMessage: '如 465 / 587' })}
            />
            <AppForm.RadioGroup
              field="secure"
              label={t({ id: 'setting.smtp.secure', defaultMessage: '连接方式' })}
              type="button"
            >
              <AppForm.Radio value={true}>SSL/TLS</AppForm.Radio>
              <AppForm.Radio value={false}>STARTTLS/Plain</AppForm.Radio>
            </AppForm.RadioGroup>
            <AppForm.Input
              field="username"
              label={t({ id: 'setting.smtp.username', defaultMessage: 'SMTP 用户名' })}
              placeholder={t({ id: 'setting.smtp.username.placeholder', defaultMessage: '请输入 SMTP 用户名' })}
            />
            <AppForm.Input
              field="password"
              mode="password"
              label={t({ id: 'setting.smtp.password', defaultMessage: 'SMTP 密码' })}
              placeholder={t({ id: 'setting.smtp.password.placeholder', defaultMessage: '请输入 SMTP 密码' })}
            />
            <AppForm.Input
              field="fromEmail"
              label={t({ id: 'setting.smtp.fromEmail', defaultMessage: '发件邮箱' })}
              placeholder={t({
                id: 'setting.smtp.fromEmail.placeholder',
                defaultMessage: '验证码邮件显示的发件人邮箱',
              })}
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
    </PageCard>
  );
}

export default SettingConfigSmtpApp;
