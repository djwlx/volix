import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Avatar, Button, Card, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { updateCurrentUserProfile } from '@/services/user';
import { uploadLocalFile } from '@/services/file';
import { AppForm } from '@/components';
import { useOutletContext } from 'react-router';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { SettingOutletContext } from './index';

interface InfoFormValues {
  email: string;
  nickname: string;
  avatar: string;
}

function SettingInfoApp() {
  const { user, refreshUser } = useOutletContext<SettingOutletContext>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formApi, setFormApi] = useState<FormApi<Record<string, unknown>>>();
  const [formInitValues, setFormInitValues] = useState<InfoFormValues>();
  const [preview, setPreview] = useState<{ nickname: string; avatar: string }>({ nickname: '', avatar: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const nextValues: InfoFormValues = {
      email: user?.email || '',
      nickname: user?.nickname || '',
      avatar: user?.avatar || '',
    };
    setFormInitValues(nextValues);
    setPreview({ nickname: nextValues.nickname, avatar: nextValues.avatar });
  }, [user?.nickname, user?.avatar]);

  const onSave = async (values: unknown) => {
    const payload = values as InfoFormValues;
    try {
      setSaving(true);
      await updateCurrentUserProfile({
        nickname: payload.nickname,
        avatar: payload.avatar,
      });
      await refreshUser();
      Toast.success('个人信息已保存');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '保存失败');
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
      Toast.success('头像上传成功');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card title="个人信息" shadows="hover" style={{ width: '100%' }}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Avatar size="large" src={preview.avatar}>
            {preview.nickname?.slice(0, 1) || user?.email?.slice(0, 1)?.toUpperCase() || 'U'}
          </Avatar>
          <Typography.Text type="secondary">支持填写头像图片 URL，保存后即时生效</Typography.Text>
        </div>

        {formInitValues ? (
          <AppForm
            key={user?.id ? String(user.id) : 'me'}
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
            <AppForm.Input field="email" label="邮箱" disabled />
            <AppForm.Input field="nickname" label="昵称" maxLength={32} placeholder="请输入昵称" showClear />
            <AppForm.Input field="avatar" label="头像 URL" placeholder="请输入头像链接（http/https 或 /file/）" showClear />
          </AppForm>
        ) : null}
        <Space>
          <Button loading={uploading} onClick={() => fileInputRef.current?.click()}>
            上传头像
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
            保存修改
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default SettingInfoApp;
