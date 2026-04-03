import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button, Card, Space, Toast } from '@douyinfe/semi-ui';
import { adminCreateUser, getRoleList } from '@/services/user';
import { uploadLocalFile } from '@/services/file';
import { AppForm } from '@/components';
import { useOutletContext } from 'react-router';
import { UserRole } from '@volix/types';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { RoleInfoResponse } from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';

interface UserAddFormValues {
  email: string;
  password: string;
  nickname: string;
  avatar: string;
  role: UserRole;
  roleKey: string;
}

const defaultValues: UserAddFormValues = {
  email: '',
  password: '',
  nickname: '',
  avatar: '',
  role: UserRole.USER,
  roleKey: 'default',
};

function SettingUserAddApp() {
  const { user, isAdmin, requestNavigate, registerLeaveGuard } = useOutletContext<SettingOutletContext>();
  const [roleList, setRoleList] = useState<RoleInfoResponse[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [formApi, setFormApi] = useState<FormApi<Record<string, unknown>>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!isAdmin) {
      requestNavigate('/setting/user');
      return;
    }
    getRoleList()
      .then(res => setRoleList(res.data))
      .catch(() => Toast.error('获取角色列表失败'));
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
        roleKey: payload.roleKey,
      });
      registerLeaveGuard(null);
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
        <AppForm
          labelPosition="top"
          initValues={defaultValues}
          getFormApi={setFormApi}
          onValueChange={values => {
            const next = values as UserAddFormValues;
            const dirty = Boolean(
              next.email?.trim() ||
              next.password?.trim() ||
              next.nickname?.trim() ||
              next.avatar?.trim() ||
              next.role !== UserRole.USER ||
              next.roleKey !== 'default'
            );
            setIsDirty(dirty);
          }}
          onSubmit={onSubmit}
        >
          <AppForm.Input
            field="email"
            label="邮箱"
            placeholder="请输入邮箱"
          />
          <AppForm.Input
            field="password"
            label="密码"
            mode="password"
            placeholder="请输入密码"
          />
          <AppForm.Input
            field="nickname"
            label="昵称（可选）"
            placeholder="请输入昵称"
          />
          <AppForm.Input
            field="avatar"
            label="头像URL（可选）"
            placeholder="请输入头像URL（http/https 或 /file/）"
          />
          <AppForm.Select
            field="role"
            label="系统角色"
            optionList={[
              { label: '普通用户', value: UserRole.USER },
              { label: '管理员', value: UserRole.ADMIN },
            ]}
          />
          <AppForm.Select
            field="roleKey"
            label="角色组"
            optionList={roleList.map(item => ({
              label: item.roleName,
              value: item.roleKey,
            }))}
          />
        </AppForm>
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
        <Space>
          <Button type="primary" loading={saving} onClick={() => formApi?.submitForm()}>
            保存用户
          </Button>
          <Button onClick={() => requestNavigate('/setting/user')}>取消</Button>
        </Space>
      </Space>
    </Card>
  );
}

export default SettingUserAddApp;
