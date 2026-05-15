import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button, Card, Space, Toast } from '@douyinfe/semi-ui';
import { adminCreateUser } from '@/services/user';
import { uploadLocalFile } from '@/services/file';
import { AppForm } from '@/components';
import { useAppPageContext } from '@/hooks';
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
      Toast.success('用户创建成功');
      requestNavigate('/setting/user');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '创建失败');
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
      Toast.success('头像上传成功');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '头像上传失败');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card title="添加用户" shadows="hover" style={{ width: '100%' }}>
      <Space vertical spacing={16} style={{ width: '100%' }}>
        <AppForm labelPosition="top" initValues={defaultValues} getFormApi={setFormApi} onSubmit={onSubmit}>
          <AppForm.Input field="email" label="邮箱" placeholder="请输入邮箱" />
          <AppForm.Input field="password" label="密码" mode="password" placeholder="请输入密码" />
          <AppForm.Input field="nickname" label="昵称（可选）" placeholder="请输入昵称" />
          <AppForm.Input field="avatar" label="头像URL（可选）" placeholder="请输入头像URL（http/https 或 /file/）" />
          <AppForm.Select
            field="role"
            label="系统角色"
            optionList={[
              { label: '普通用户', value: UserRole.USER },
              { label: '管理员', value: UserRole.ADMIN },
            ]}
          />
        </AppForm>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'flex-start', alignItems: 'center' }}>
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
          <Button type="primary" loading={saving} onClick={() => formApi?.submitForm()}>
            保存用户
          </Button>
          <Button onClick={() => requestNavigate('/setting/user')}>取消</Button>
        </div>
      </Space>
    </Card>
  );
}

export default SettingUserAddApp;
