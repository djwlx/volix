import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Toast } from '@douyinfe/semi-ui';
import { createRole } from '@/services/user';
import { AppForm } from '@/components';
import { useOutletContext } from 'react-router';
import { AppFeature } from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';
import { featureLabelMap } from './constants';

interface RoleAddFormValues {
  roleName: string;
  features: AppFeature[];
}

const defaultValues: RoleAddFormValues = {
  roleName: '',
  features: [],
};

function SettingRoleAddApp() {
  const { user, isAdmin, requestNavigate, registerLeaveGuard } = useOutletContext<SettingOutletContext>();
  const [creatingRole, setCreatingRole] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const featureOptions = useMemo(
    () =>
      Object.values(AppFeature).map(feature => ({
        label: featureLabelMap[feature],
        value: feature,
      })),
    []
  );

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!isAdmin) {
      requestNavigate('/setting/role');
    }
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

  const onCreateRole = async (values: unknown) => {
    const payload = values as RoleAddFormValues;
    try {
      setCreatingRole(true);
      await createRole({
        roleName: payload.roleName?.trim(),
        features: payload.features || [],
      });
      registerLeaveGuard(null);
      Toast.success('角色创建成功');
      requestNavigate('/setting/role');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '创建失败');
    } finally {
      setCreatingRole(false);
    }
  };

  return (
    <Card title="添加角色" shadows="hover" style={{ width: '100%' }}>
      <Space vertical spacing={16} style={{ width: '100%' }}>
        <AppForm
          labelPosition="top"
          initValues={defaultValues}
          onValueChange={values => {
            const next = values as RoleAddFormValues;
            const dirty = Boolean(next.roleName?.trim() || (next.features || []).length > 0);
            setIsDirty(dirty);
          }}
          onSubmit={onCreateRole}
        >
          <AppForm.Input field="roleName" label="角色名称" placeholder="例如 编辑角色、运营角色" />
          <AppForm.Select
            field="features"
            label="功能权限"
            multiple
            style={{ width: '100%' }}
            placeholder="选择该角色可访问的功能"
            optionList={featureOptions}
          />
          <Space>
            <Button type="primary" htmlType="submit" loading={creatingRole}>
              保存角色
            </Button>
            <Button onClick={() => requestNavigate('/setting/role')}>取消</Button>
          </Space>
        </AppForm>
      </Space>
    </Card>
  );
}

export default SettingRoleAddApp;
