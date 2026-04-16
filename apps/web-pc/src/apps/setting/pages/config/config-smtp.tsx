import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Toast } from '@douyinfe/semi-ui';
import { AppForm, Loading } from '@/components';
import { getAccountConfigs, testAccountConfig, updateAccountConfig } from '@/services/user';
import { useOutletContext } from 'react-router';
import { AccountConfigPlatform, UserRole } from '@volix/types';
import type { SmtpAccountConfigItem } from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';

const EMPTY_VALUES: SmtpAccountConfigItem = {
  host: '',
  port: 587,
  secure: false,
  username: '',
  password: '',
  fromEmail: '',
};

function SettingConfigSmtpApp() {
  const { user, requestNavigate, registerLeaveGuard } = useOutletContext<SettingOutletContext>();
  const [initialValues, setInitialValues] = useState<SmtpAccountConfigItem>(EMPTY_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
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
      .catch(() => Toast.error('加载 SMTP 配置失败'))
      .finally(() => setLoading(false));
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
      registerLeaveGuard(null);
      setInitialValues(nextData);
      setFormValues(nextData);
      setIsDirty(false);
      Toast.success('SMTP 配置保存成功');
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
      Toast.success(res.data?.message || 'SMTP 联通成功');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || 'SMTP 联通失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card title="SMTP" shadows="hover" style={{ width: '100%' }}>
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
              const nextFingerprint = JSON.stringify({
                host: nextValues.host,
                port: nextValues.port,
                secure: nextValues.secure,
                username: nextValues.username,
                password: nextValues.password,
                fromEmail: nextValues.fromEmail,
              });
              setIsDirty(nextFingerprint !== initialFingerprint);
            }}
            onSubmit={onSubmit}
          >
            <AppForm.Input field="host" label="SMTP Host" placeholder="如 smtp.gmail.com" />
            <AppForm.Input field="port" label="SMTP Port" placeholder="如 465 / 587" />
            <AppForm.RadioGroup field="secure" label="连接方式" type="button">
              <AppForm.Radio value={true}>SSL/TLS</AppForm.Radio>
              <AppForm.Radio value={false}>STARTTLS/Plain</AppForm.Radio>
            </AppForm.RadioGroup>
            <AppForm.Input field="username" label="SMTP 用户名" placeholder="请输入 SMTP 用户名" />
            <AppForm.Input field="password" mode="password" label="SMTP 密码" placeholder="请输入 SMTP 密码" />
            <AppForm.Input field="fromEmail" label="发件邮箱" placeholder="验证码邮件显示的发件人邮箱" />
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

export default SettingConfigSmtpApp;
