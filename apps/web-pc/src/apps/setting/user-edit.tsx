import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import { Button, Card, Empty, Space, Toast } from '@douyinfe/semi-ui';
import { adminUpdateUser, getRoleList, getUserDetail } from '@/services/user';
import { uploadLocalFile } from '@/services/file';
import { AppForm } from '@/components';
import { useOutletContext, useParams } from 'react-router';
import { UserRole } from '@volix/types';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { RoleInfoResponse, UserInfoResponse } from '@volix/types';
import type { SettingOutletContext } from './index';

interface UserEditFormValues {
  email: string;
  nickname: string;
  avatar: string;
  role: UserRole;
  roleKey: string;
}

function SettingUserEditApp() {
  const { isAdmin, requestNavigate, registerLeaveGuard } = useOutletContext<SettingOutletContext>();
  const { id = '' } = useParams();
  const [roleList, setRoleList] = useState<RoleInfoResponse[]>([]);
  const [origin, setOrigin] = useState<UserInfoResponse>();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formApi, setFormApi] = useState<FormApi<Record<string, unknown>>>();
  const [formInitValues, setFormInitValues] = useState<UserEditFormValues>();
  const [isDirty, setIsDirty] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const [roleRes, userRes] = await Promise.all([getRoleList(), getUserDetail(id)]);
    setRoleList(roleRes.data);
    setOrigin(userRes.data);
    setFormInitValues({
      email: userRes.data.email || '',
      nickname: userRes.data.nickname || '',
      avatar: userRes.data.avatar || '',
      role: userRes.data.role,
      roleKey: userRes.data.roleKey || 'default',
    });
  };

  useEffect(() => {
    if (!isAdmin) {
      requestNavigate('/setting/user');
      return;
    }
    loadData().catch(() => Toast.error('获取用户信息失败'));
  }, [isAdmin, id, requestNavigate]);

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
    const payload = values as UserEditFormValues;
    try {
      setSaving(true);
      await adminUpdateUser(id, {
        nickname: payload.nickname,
        avatar: payload.avatar,
        role: payload.role,
        roleKey: payload.roleKey,
      });
      registerLeaveGuard(null);
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
          onValueChange={values => {
            const next = values as UserEditFormValues;
            const dirty = Boolean(
              (origin.nickname || '') !== (next.nickname || '') ||
              (origin.avatar || '') !== (next.avatar || '') ||
              origin.role !== next.role ||
              (origin.roleKey || 'default') !== (next.roleKey || 'default')
            );
            setIsDirty(dirty);
          }}
          onSubmit={onSubmit}
        >
          <AppForm.Input field="email" label="邮箱" disabled />
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
            保存修改
          </Button>
          <Button onClick={() => requestNavigate('/setting/user')}>取消</Button>
        </Space>
      </Space>
    </Card>
  );
}

export default SettingUserEditApp;
