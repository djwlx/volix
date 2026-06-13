import { useEffect, useMemo, useState } from 'react';
import { Button, Space, Toast } from '@douyinfe/semi-ui';
import { AppForm, Loading, PageCard } from '@/components';
import { useI18n } from '@/i18n';
import { getSystemConfig, getUserList, updateSystemConfig } from '@/services/user';
import { useAppPageContext } from '@/hooks';
import type { SmtpAccountConfigItem } from '@volix/types';
import { UserRole } from '@volix/types';

interface SystemConfigFormValues {
  registerEmailVerifyEnabled: boolean;
  randomPicDefaultUserId: string;
  registerEmailVerifySmtp: SmtpAccountConfigItem;
}

const DEFAULT_VALUES: SystemConfigFormValues = {
  registerEmailVerifyEnabled: false,
  randomPicDefaultUserId: '',
  registerEmailVerifySmtp: {
    host: '',
    port: 587,
    secure: false,
    username: '',
    password: '',
    fromEmail: '',
  },
};

function SettingSystemApp() {
  const { t } = useI18n();
  const { user, requestNavigate } = useAppPageContext();
  const [initialValues, setInitialValues] = useState<SystemConfigFormValues>(DEFAULT_VALUES);
  const [userOptions, setUserOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [showSmtpFields, setShowSmtpFields] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const toFormValues = (params: {
    registerEmailVerifyEnabled?: boolean;
    randomPicDefaultUserId?: string | number;
    registerEmailVerifySmtp?: SmtpAccountConfigItem;
  }): SystemConfigFormValues => {
    const smtp = params.registerEmailVerifySmtp;
    return {
      registerEmailVerifyEnabled: Boolean(params.registerEmailVerifyEnabled),
      randomPicDefaultUserId: String(params.randomPicDefaultUserId || ''),
      registerEmailVerifySmtp: {
        host: smtp?.host || '',
        port: smtp?.port || 587,
        secure: Boolean(smtp?.secure),
        username: smtp?.username || '',
        password: smtp?.password || '',
        fromEmail: smtp?.fromEmail || '',
      },
    };
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
    Promise.all([getSystemConfig(), getUserList()])
      .then(([systemRes, usersRes]) => {
        setInitialValues(
          toFormValues({
            registerEmailVerifyEnabled: systemRes.data?.registerEmailVerifyEnabled,
            randomPicDefaultUserId: systemRes.data?.randomPicDefaultUserId,
            registerEmailVerifySmtp: systemRes.data?.registerEmailVerifySmtp,
          })
        );
        setShowSmtpFields(Boolean(systemRes.data?.registerEmailVerifyEnabled));
        const options = (usersRes.data || []).map(item => ({
          label: `${item.nickname || item.email} (${item.email})`,
          value: String(item.id),
        }));
        setUserOptions(options);
      })
      .catch(() => Toast.error(t({ id: 'setting.system.loadFailed', defaultMessage: '加载系统配置失败' })))
      .finally(() => setLoading(false));
  }, [user, isAdmin, requestNavigate]);

  const initialFingerprint = useMemo(() => JSON.stringify(initialValues), [initialValues]);

  const onSubmit = async (values: unknown) => {
    const payload = values as SystemConfigFormValues;
    const normalizedSmtp = {
      host: payload.registerEmailVerifySmtp?.host?.trim() || '',
      port: Number(payload.registerEmailVerifySmtp?.port || 0),
      secure: Boolean(payload.registerEmailVerifySmtp?.secure),
      username: payload.registerEmailVerifySmtp?.username?.trim() || '',
      password: payload.registerEmailVerifySmtp?.password?.trim() || '',
      fromEmail: payload.registerEmailVerifySmtp?.fromEmail?.trim() || '',
    };
    if (payload.registerEmailVerifyEnabled) {
      if (
        !normalizedSmtp.host ||
        !normalizedSmtp.username ||
        !normalizedSmtp.password ||
        !normalizedSmtp.fromEmail ||
        !Number.isFinite(normalizedSmtp.port) ||
        normalizedSmtp.port <= 0 ||
        normalizedSmtp.port > 65535
      ) {
        Toast.error(
          t({ id: 'setting.system.smtpIncomplete', defaultMessage: '开启注册邮箱验证码时，请完整填写系统 SMTP 配置' })
        );
        return;
      }
    }

    try {
      setSaving(true);
      const nextData = {
        registerEmailVerifyEnabled: Boolean(payload.registerEmailVerifyEnabled),
        randomPicDefaultUserId: String(payload.randomPicDefaultUserId || ''),
        registerEmailVerifySmtp: payload.registerEmailVerifyEnabled ? normalizedSmtp : undefined,
      };
      await updateSystemConfig(nextData);
      const latest = await getSystemConfig();
      const savedValues = toFormValues({
        registerEmailVerifyEnabled: latest.data?.registerEmailVerifyEnabled,
        randomPicDefaultUserId: latest.data?.randomPicDefaultUserId,
        registerEmailVerifySmtp: latest.data?.registerEmailVerifySmtp,
      });
      setInitialValues(savedValues);
      setShowSmtpFields(savedValues.registerEmailVerifyEnabled);
      Toast.success(t({ id: 'setting.system.saveSuccess', defaultMessage: '系统配置保存成功' }));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t({ id: 'common.action.saveFailed', defaultMessage: '保存失败' }));
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageCard
      title={t({ id: 'setting.system.title', defaultMessage: '系统配置' })}
      shadows="hover"
      style={{ width: '100%' }}
    >
      {loading ? (
        <Loading rows={4} />
      ) : (
        <Space vertical spacing={16} style={{ width: '100%' }}>
          <AppForm
            key={initialFingerprint}
            initValues={initialValues}
            onValueChange={values => {
              setShowSmtpFields(Boolean((values as Partial<SystemConfigFormValues>)?.registerEmailVerifyEnabled));
            }}
            onSubmit={onSubmit}
          >
            <AppForm.Select
              field="randomPicDefaultUserId"
              label={t({ id: 'setting.system.randomPicUser', defaultMessage: '未登录随机图默认用户' })}
              placeholder={t({
                id: 'setting.system.randomPicUser.placeholder',
                defaultMessage: '请选择用户（未登录访问 /api/115/pic 时生效）',
              })}
              optionList={userOptions}
              showClear
            />
            <AppForm.RadioGroup
              field="registerEmailVerifyEnabled"
              label={t({ id: 'setting.system.registerEmailVerify', defaultMessage: '注册是否需要邮箱验证码' })}
              type="button"
            >
              <AppForm.Radio value={true}>{t({ id: 'common.toggle.on', defaultMessage: '开启' })}</AppForm.Radio>
              <AppForm.Radio value={false}>{t({ id: 'common.toggle.off', defaultMessage: '关闭' })}</AppForm.Radio>
            </AppForm.RadioGroup>
            {showSmtpFields ? (
              <>
                <AppForm.Input
                  field="registerEmailVerifySmtp.host"
                  label="SMTP Host"
                  placeholder={t({ id: 'setting.system.smtp.host.placeholder', defaultMessage: '如 smtp.gmail.com' })}
                />
                <AppForm.Input
                  field="registerEmailVerifySmtp.port"
                  label="SMTP Port"
                  placeholder={t({ id: 'setting.system.smtp.port.placeholder', defaultMessage: '如 465 / 587' })}
                />
                <AppForm.RadioGroup
                  field="registerEmailVerifySmtp.secure"
                  label={t({ id: 'setting.system.smtp.secure', defaultMessage: '连接方式' })}
                  type="button"
                >
                  <AppForm.Radio value={true}>SSL/TLS</AppForm.Radio>
                  <AppForm.Radio value={false}>STARTTLS/Plain</AppForm.Radio>
                </AppForm.RadioGroup>
                <AppForm.Input
                  field="registerEmailVerifySmtp.username"
                  label={t({ id: 'setting.system.smtp.username', defaultMessage: 'SMTP 用户名' })}
                  placeholder={t({
                    id: 'setting.system.smtp.username.placeholder',
                    defaultMessage: '请输入 SMTP 用户名',
                  })}
                />
                <AppForm.Input
                  field="registerEmailVerifySmtp.password"
                  mode="password"
                  label={t({ id: 'setting.system.smtp.password', defaultMessage: 'SMTP 密码' })}
                  placeholder={t({
                    id: 'setting.system.smtp.password.placeholder',
                    defaultMessage: '请输入 SMTP 密码',
                  })}
                />
                <AppForm.Input
                  field="registerEmailVerifySmtp.fromEmail"
                  label={t({ id: 'setting.system.smtp.fromEmail', defaultMessage: '发件邮箱' })}
                  placeholder={t({
                    id: 'setting.system.smtp.fromEmail.placeholder',
                    defaultMessage: '验证码邮件显示的发件人邮箱',
                  })}
                />
              </>
            ) : null}
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                {t({ id: 'common.action.saveConfig', defaultMessage: '保存配置' })}
              </Button>
            </Space>
          </AppForm>
        </Space>
      )}
    </PageCard>
  );
}

export default SettingSystemApp;
