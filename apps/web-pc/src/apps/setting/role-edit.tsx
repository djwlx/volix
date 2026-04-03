import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Space, Toast } from '@douyinfe/semi-ui';
import { getRoleList, updateRoleInfo } from '@/services/user';
import { AppForm } from '@/components';
import { useOutletContext, useParams } from 'react-router';
import { AppFeature } from '@volix/types';
import type { RoleInfoResponse } from '@volix/types';
import type { SettingOutletContext } from './index';
import { featureLabelMap } from './constants';

interface RoleEditFormValues {
  features: AppFeature[];
}

function SettingRoleEditApp() {
  const { isAdmin, requestNavigate, registerLeaveGuard } = useOutletContext<SettingOutletContext>();
  const { roleKey = '' } = useParams();
  const [roleInfo, setRoleInfo] = useState<RoleInfoResponse>();
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isDefaultRole = roleKey === 'default';

  const loadRole = async () => {
    const res = await getRoleList();
    const find = res.data.find(item => item.roleKey === roleKey);
    if (!find) {
      Toast.error('角色不存在');
      requestNavigate('/setting/role');
      return;
    }
    setRoleInfo(find);
  };

  const featureOptions = useMemo(
    () =>
      Object.values(AppFeature).map(feature => ({
        label: featureLabelMap[feature],
        value: feature,
      })),
    []
  );

  useEffect(() => {
    if (!isAdmin) {
      requestNavigate('/setting/role');
      return;
    }
    loadRole().catch(() => {
      Toast.error('获取角色信息失败');
    });
  }, [isAdmin, roleKey]);

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

  const onSave = async (values: unknown) => {
    const payload = values as RoleEditFormValues;
    try {
      setSaving(true);
      await updateRoleInfo(roleKey, { features: payload.features || [] });
      registerLeaveGuard(null);
      Toast.success('角色权限已更新');
      requestNavigate('/setting/role');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '更新失败');
    } finally {
      setSaving(false);
    }
  };

  if (!roleInfo) {
    return (
      <Card title="编辑角色" shadows="hover">
        <Empty title="加载中" />
      </Card>
    );
  }

  return (
    <Card title={`编辑角色：${roleInfo.roleName}`} shadows="hover" style={{ width: '100%' }}>
      <Space vertical spacing={16} style={{ width: '100%' }}>
        {isDefaultRole ? (
          <Empty title="内置角色不可编辑" description="default 角色暂不支持编辑" />
        ) : (
          <>
            <AppForm
              labelPosition="top"
              initValues={{ features: roleInfo.features || [] }}
              onValueChange={values => {
                const next = values as RoleEditFormValues;
                const dirty = JSON.stringify(next.features || []) !== JSON.stringify(roleInfo.features || []);
                setIsDirty(dirty);
              }}
              onSubmit={onSave}
            >
              <AppForm.Select
                field="features"
                label="功能权限"
                multiple
                style={{ width: '100%' }}
                optionList={featureOptions}
              />
              <Space>
                <Button type="primary" htmlType="submit" loading={saving}>
                  保存修改
                </Button>
                <Button onClick={() => requestNavigate('/setting/role')}>取消</Button>
              </Space>
            </AppForm>
          </>
        )}
      </Space>
    </Card>
  );
}

export default SettingRoleEditApp;
