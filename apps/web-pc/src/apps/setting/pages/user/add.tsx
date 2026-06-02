import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button, Card, Space, Toast } from '@douyinfe/semi-ui';
import { adminCreateUser } from '@/services/user';
import { uploadLocalFile } from '@/services/file';
import { AppForm } from '@/components';
import { useAppPageContext } from '@/hooks';
import { useI18n } from '@/i18n';
import { UserRole } from '@volix/types';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';

interface UserAddFormValues {
  email: string;
  password: string;
  nickname: string;
  avatar: string;
  role: UserRole;
}

const defaultValues: UserAddFormValues = {
  email: '',
  password: '',
  nickname: '',
  avatar: '',
  role: UserRole.USER,
};

function SettingUserAddApp() {
  const { t } = useI18n();
  const { user, isAdmin, requestNavigate } = useAppPageContext();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formApi, setFormApi] = useState<FormApi<Record<string, unknown>>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!isAdmin) {
      requestNavigate('/setting/user');
    }
  }, [user, isAdmin, requestNavigate]);

  const onSubmit = async (values: unknown) => {
    const payload = values as UserAddFormValues;
    try {
      setSaving(true);
      await adminCreateUser({
        email: payload.email.trim(),
        password: payload.password.trim(),
        nickname: payload.nickname?.trim(),
        avatar: payload.avatar?.trim(),
        role: payload.role,
      });
      Toast.success(t('setting.user.createSuccess'));
      requestNavigate('/setting/user');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('setting.user.createFailed'));
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
      Toast.success(t('setting.info.avatarUploadSuccess'));
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('setting.info.avatarUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card title={t('setting.user.addTitle')} shadows="hover" style={{ width: '100%' }}>
      <Space vertical spacing={16} style={{ width: '100%' }}>
        <AppForm labelPosition="top" initValues={defaultValues} getFormApi={setFormApi} onSubmit={onSubmit}>
          <AppForm.Input field="email" label={t('auth.email.label')} placeholder={t('auth.email.placeholder')} />
          <AppForm.Input
            field="password"
            label={t('auth.password.label')}
            mode="password"
            placeholder={t('auth.password.placeholder')}
          />
          <AppForm.Input
            field="nickname"
            label={t('setting.user.nicknameOptional')}
            placeholder={t('setting.info.nicknamePlaceholder')}
          />
          <AppForm.Input
            field="avatar"
            label={t('setting.user.avatarOptional')}
            placeholder={t('setting.info.avatarUrlPlaceholder')}
          />
          <AppForm.Select
            field="role"
            label={t('setting.user.table.role')}
            optionList={[
              { label: t('admin.role.user'), value: UserRole.USER },
              { label: t('admin.role.admin'), value: UserRole.ADMIN },
            ]}
          />
        </AppForm>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-start', alignItems: 'center' }}>
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
          <Button type="primary" loading={saving} onClick={() => formApi?.submitForm()}>
            {t('setting.user.saveUser')}
          </Button>
          <Button onClick={() => requestNavigate('/setting/user')}>{t('common.action.cancel')}</Button>
        </div>
      </Space>
    </Card>
  );
}

export default SettingUserAddApp;
