import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Avatar, Button, Card, Input, Space, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { sendCurrentUserEmailVerifyCode, updateCurrentUserProfile, verifyCurrentUserEmail } from '@/services/user';
import { uploadLocalFile } from '@/services/file';
import { AppForm } from '@/components';
import { useAppPageContext } from '@/hooks';
import { useI18n } from '@/i18n';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';

interface InfoFormValues {
  email: string;
  nickname: string;
  avatar: string;
}

function SettingInfoApp() {
  const { t } = useI18n();
  const { user, refreshUser } = useAppPageContext();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formApi, setFormApi] = useState<FormApi<Record<string, unknown>>>();
  const [formInitValues, setFormInitValues] = useState<InfoFormValues>();
  const [preview, setPreview] = useState<{ nickname: string; avatar: string }>({ nickname: '', avatar: '' });
  const [sendingCode, setSendingCode] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyCode, setVerifyCode] = useState('');
  const [countdown, setCountdown] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    const nextValues: InfoFormValues = {
      email: user.email || '',
      nickname: user.nickname || '',
      avatar: user.avatar || '',
    };
    setFormInitValues(nextValues);
    setPreview({ nickname: nextValues.nickname, avatar: nextValues.avatar });
  }, [user]);

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = window.setTimeout(() => setCountdown(prev => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  const onSave = async (values: unknown) => {
    const payload = values as InfoFormValues;
    try {
      setSaving(true);
      await updateCurrentUserProfile({
        nickname: payload.nickname,
        avatar: payload.avatar,
      });
      await refreshUser();
      Toast.success(t('setting.info.saveSuccess'));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('common.action.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const onUploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }
    try {
      setUploading(true);
      const res = await uploadLocalFile(file);
      formApi?.setValue('avatar', res.data.path);
      setPreview(prev => ({ ...prev, avatar: res.data.path }));
      Toast.success(t('setting.info.avatarUploadSuccess'));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('setting.info.avatarUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const onSendVerifyCode = async () => {
    try {
      setSendingCode(true);
      await sendCurrentUserEmailVerifyCode();
      setCountdown(60);
      Toast.success(t('auth.register.codeSent'));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('setting.info.verifyCodeSendFailed'));
    } finally {
      setSendingCode(false);
    }
  };

  const onVerifyEmail = async () => {
    if (!verifyCode.trim()) {
      Toast.warning(t('auth.verifyCode.required'));
      return;
    }

    try {
      setVerifyingEmail(true);
      await verifyCurrentUserEmail({
        verifyCode: verifyCode.trim(),
      });
      setVerifyCode('');
      await refreshUser();
      Toast.success(t('setting.info.emailVerifySuccess'));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('setting.info.emailVerifyFailed'));
    } finally {
      setVerifyingEmail(false);
    }
  };

  return (
    <Card title={t('setting.info.title')} shadows="hover" style={{ width: '100%' }}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size="large" src={preview.avatar}>
            {preview.nickname?.slice(0, 1) || user?.email?.slice(0, 1)?.toUpperCase() || 'U'}
          </Avatar>
          <Typography.Text type="secondary">{t('setting.info.avatarHint')}</Typography.Text>
        </div>

        {user && formInitValues ? (
          <AppForm
            key={String(user.id)}
            labelPosition="top"
            initValues={formInitValues}
            getFormApi={setFormApi}
            onValueChange={values => {
              const next = values as InfoFormValues;
              setPreview({
                nickname: next.nickname || '',
                avatar: next.avatar || '',
              });
            }}
            onSubmit={onSave}
          >
            <AppForm.Input field="email" label={t('auth.email.label')} disabled />
            <div style={{ marginBottom: 16 }}>
              <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
                {t('setting.info.emailVerifyStatus')}
              </Typography.Text>
              <Space align="center" wrap>
                {user.emailVerified ? (
                  <Tag color="green">{t('setting.info.verified')}</Tag>
                ) : (
                  <Tag color="orange">{t('setting.info.unverified')}</Tag>
                )}
                {!user.emailVerified ? (
                  <>
                    <Input
                      value={verifyCode}
                      onChange={value => setVerifyCode(value)}
                      placeholder={t('auth.verifyCode.placeholder')}
                      style={{ width: 220 }}
                    />
                    <Button loading={sendingCode} disabled={countdown > 0} onClick={onSendVerifyCode}>
                      {countdown > 0 ? t('auth.verifyCode.resendCountdown', { countdown }) : t('auth.verifyCode.send')}
                    </Button>
                    <Button type="primary" loading={verifyingEmail} onClick={onVerifyEmail}>
                      {t('setting.info.verifyEmail')}
                    </Button>
                  </>
                ) : null}
              </Space>
            </div>
            <AppForm.Input
              field="nickname"
              label={t('setting.info.nickname')}
              maxLength={32}
              placeholder={t('setting.info.nicknamePlaceholder')}
              showClear
            />
            <AppForm.Input
              field="avatar"
              label={t('setting.info.avatarUrl')}
              placeholder={t('setting.info.avatarUrlPlaceholder')}
              showClear
            />
          </AppForm>
        ) : null}
        <Space>
          <Button loading={uploading} onClick={() => fileInputRef.current?.click()}>
            {t('setting.info.uploadAvatar')}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={onUploadAvatar}
          />
        </Space>

        <div>
          <Button type="primary" theme="solid" loading={saving} onClick={() => formApi?.submitForm()}>
            {t('setting.info.save')}
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default SettingInfoApp;
