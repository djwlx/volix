import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button, Card, Empty, Space, Toast } from '@douyinfe/semi-ui';
import { adminUpdateUser, getUserDetail } from '@/services/user';
import { uploadLocalFile } from '@/services/file';
import { AppForm } from '@/components';
import { useParams } from 'react-router';
import { useAppPageContext } from '@/hooks';
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
    loadData().catch(() => Toast.error('获取用户信息失败'));
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
      Toast.success('用户信息已更新');
      requestNavigate('/setting/user');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '更新失败');
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

  if (!origin || !formInitValues) {
    return (
      <Card title="编辑用户" shadows="hover">
        <Empty title="加载中" />
      </Card>
    );
  }

  return (
    <Card title={`编辑用户：${origin.email}`} shadows="hover" style={{ width: '100%' }}>
      <Space vertical spacing={16} style={{ width: '100%' }}>
        <AppForm
          key={`${origin.id}`}
          labelPosition="top"
          initValues={formInitValues}
          getFormApi={setFormApi}
          onSubmit={onSubmit}
        >
          <AppForm.Input field="email" label="邮箱" disabled />
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
            保存修改
          </Button>
          <Button onClick={() => requestNavigate('/setting/user')}>取消</Button>
        </div>
      </Space>
    </Card>
  );
}

export default SettingUserEditApp;
