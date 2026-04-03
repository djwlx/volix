import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Toast } from '@douyinfe/semi-ui';
import { AppForm, Loading } from '@/components';
import { getSystemConfig, updateSystemConfig } from '@/services/user';
import { useOutletContext } from 'react-router';
import { UserRole } from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';

interface SystemConfigFormValues {
  registerEmailVerifyEnabled: boolean;
}

const DEFAULT_VALUES: SystemConfigFormValues = {
  registerEmailVerifyEnabled: false,
};

function SettingSystemApp() {
  const { user, requestNavigate, registerLeaveGuard } = useOutletContext<SettingOutletContext>();
  const [initialValues, setInitialValues] = useState<SystemConfigFormValues>(DEFAULT_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!isAdmin) {
      requestNavigate('/setting/info');
      return;
    }
    setLoading(true);
    getSystemConfig()
      .then(res => {
        setInitialValues({
          registerEmailVerifyEnabled: Boolean(res.data?.registerEmailVerifyEnabled),
        });
      })
      .catch(() => Toast.error('加载系统配置失败'))
      .finally(() => setLoading(false));
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

  const initialFingerprint = useMemo(() => JSON.stringify(initialValues), [initialValues]);

  const onSubmit = async (values: unknown) => {
    const payload = values as SystemConfigFormValues;
    try {
      setSaving(true);
      const nextData = {
        registerEmailVerifyEnabled: Boolean(payload.registerEmailVerifyEnabled),
      };
      await updateSystemConfig(nextData);
      registerLeaveGuard(null);
      setInitialValues(nextData);
      setIsDirty(false);
      Toast.success('系统配置保存成功');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="系统配置" shadows="hover" style={{ width: '100%' }}>
      {loading ? <Loading rows={4} /> : <Space vertical spacing={16} style={{ width: '100%' }}>
        <AppForm
          key={initialFingerprint}
          initValues={initialValues}
          onValueChange={values => {
            const next = values as Partial<SystemConfigFormValues>;
            setIsDirty(Boolean(next.registerEmailVerifyEnabled) !== initialValues.registerEmailVerifyEnabled);
          }}
          onSubmit={onSubmit}
        >
          <AppForm.RadioGroup field="registerEmailVerifyEnabled" label="注册是否需要邮箱验证码" type="button">
            <AppForm.Radio value={true}>开启</AppForm.Radio>
            <AppForm.Radio value={false}>关闭</AppForm.Radio>
          </AppForm.RadioGroup>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              保存配置
            </Button>
          </Space>
        </AppForm>
      </Space>}
    </Card>
  );
}

export default SettingSystemApp;
