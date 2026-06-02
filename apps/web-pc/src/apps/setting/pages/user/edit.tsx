import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button, Card, Empty, Space, Toast } from '@douyinfe/semi-ui';
import { adminUpdateUser, getUserDetail } from '@/services/user';
import { uploadLocalFile } from '@/services/file';
import { AppForm } from '@/components';
import { useParams } from 'react-router';
import { useAppPageContext } from '@/hooks';
import { useI18n } from '@/i18n';
import { UserRole } from '@volix/types';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { UserInfoResponse } from '@volix/types';

interface UserEditFormValues {
  email: string;
  nickname: string;
  avatar: string;
  role: UserRole;
}

function SettingUserEditApp() {
  const { t } = useI18n();
  const { user, isAdmin, requestNavigate } = useAppPageContext();
  const { id = '' } = useParams();
  const [origin, setOrigin] = useState<UserInfoResponse>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formApi, setFormApi] = useState<FormApi<Record<string, unknown>>>();
  const [formInitValues, setFormInitValues] = useState<UserEditFormValues>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const userRes = await getUserDetail(id);
    setOrigin(userRes.data);
    setFormInitValues({
      email: userRes.data.email || '',
      nickname: userRes.data.nickname || '',
      avatar: userRes.data.avatar || '',
      role: userRes.data.role,
    });
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!isAdmin) {
      requestNavigate('/setting/user');
      return;
    }
    loadData().catch(() => Toast.error(t('setting.user.loadFailed')));
  }, [user, isAdmin, id, requestNavigate]);

  const onSubmit = async (values: unknown) => {
    const payload = values as UserEditFormValues;
    try {
      setSaving(true);
      await adminUpdateUser(id, {
        nickname: payload.nickname,
        avatar: payload.avatar,
        role: payload.role,
      });
      Toast.success(t('setting.user.updateSuccess'));
      requestNavigate('/setting/user');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || t('admin.error.updateFailed'));
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

  if (!origin || !formInitValues) {
    return (
      <Card title={t('setting.user.editTitle')} shadows="hover">
        <Empty title={t('common.status.loading')} />
      </Card>
    );
  }

  return (
    <Card
      title={t('setting.user.editTitleWithEmail', { email: origin.email })}
      shadows="hover"
      style={{ width: '100%' }}
    >
      <Space vertical spacing={16} style={{ width: '100%' }}>
        <AppForm
          key={`${origin.id}`}
          labelPosition="top"
          initValues={formInitValues}
          getFormApi={setFormApi}
          onSubmit={onSubmit}
        >
          <AppForm.Input field="email" label={t('auth.email.label')} disabled />
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
            {t('setting.info.save')}
          </Button>
          <Button onClick={() => requestNavigate('/setting/user')}>{t('common.action.cancel')}</Button>
        </div>
      </Space>
    </Card>
  );
}

export default SettingUserEditApp;
