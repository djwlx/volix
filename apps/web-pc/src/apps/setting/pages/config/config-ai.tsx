import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Space, Toast } from '@douyinfe/semi-ui';
import { AppForm, Loading } from '@/components';
import { getAccountConfigs, getAiModelList, testAccountConfig, updateAccountConfig } from '@/services/user';
import { useOutletContext } from 'react-router';
import { AccountConfigPlatform, UserRole } from '@volix/types';
import type { AiAccountConfigItem } from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';

const EMPTY_VALUES: AiAccountConfigItem = {
  baseUrl: '',
  apiKey: '',
  model: '',
};

function SettingConfigAiApp() {
  const { user, requestNavigate, registerLeaveGuard } = useOutletContext<SettingOutletContext>();
  const [initialValues, setInitialValues] = useState<AiAccountConfigItem>(EMPTY_VALUES);
  const [formValues, setFormValues] = useState<AiAccountConfigItem>(EMPTY_VALUES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelOptions, setModelOptions] = useState<Array<{ label: string; value: string }>>([]);
  const [modelLoadFailed, setModelLoadFailed] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const isAdmin = user?.role === UserRole.ADMIN;

  const loadModelOptions = async (payload?: Pick<AiAccountConfigItem, 'baseUrl' | 'apiKey'>) => {
    const baseUrl = payload?.baseUrl?.trim() || formValues.baseUrl.trim();
    const apiKey = payload?.apiKey?.trim() || formValues.apiKey.trim();

    if (!baseUrl || !apiKey) {
      setModelOptions([]);
      setModelLoadFailed(true);
      return;
    }

    try {
      setModelsLoading(true);
      const res = await getAiModelList({ baseUrl, apiKey });
      const models = Array.isArray(res.data?.models) ? res.data.models : [];
      setModelOptions(models.map(item => ({ label: item, value: item })));
      setModelLoadFailed(models.length === 0);
      if (models.length === 0) {
        Toast.warning('未获取到可选模型，已切换为手动输入');
      }
    } catch (error) {
      setModelOptions([]);
      setModelLoadFailed(true);
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.warning(message || '获取模型列表失败，已切换为手动输入');
    } finally {
      setModelsLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!isAdmin) {
      requestNavigate('/setting/info');
      return;
    }
    setLoading(true);
    getAccountConfigs()
      .then(res => {
        const ai = res.data?.ai;
        if (!ai) {
          setInitialValues(EMPTY_VALUES);
          setFormValues(EMPTY_VALUES);
          return;
        }
        const nextValues = {
          baseUrl: ai.baseUrl || '',
          apiKey: ai.apiKey || '',
          model: ai.model || '',
        };
        setInitialValues(nextValues);
        setFormValues(nextValues);
        if (nextValues.baseUrl && nextValues.apiKey) {
          void loadModelOptions({
            baseUrl: nextValues.baseUrl,
            apiKey: nextValues.apiKey,
          });
        }
      })
      .catch(() => Toast.error('加载 AI 配置失败'))
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
    const payload = values as AiAccountConfigItem;
    try {
      setSaving(true);
      const nextData: AiAccountConfigItem = {
        baseUrl: payload.baseUrl.trim(),
        apiKey: payload.apiKey.trim(),
        model: payload.model.trim(),
      };
      await updateAccountConfig({
        platform: AccountConfigPlatform.AI,
        config: nextData,
      });
      registerLeaveGuard(null);
      setInitialValues(nextData);
      setFormValues(nextData);
      setIsDirty(false);
      Toast.success('AI 配置保存成功');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const onTestConnection = async () => {
    const payload = formValues;
    try {
      setTesting(true);
      const res = await testAccountConfig({
        platform: AccountConfigPlatform.AI,
        config: {
          baseUrl: payload.baseUrl.trim(),
          apiKey: payload.apiKey.trim(),
          model: payload.model.trim(),
        },
      });
      Toast.success(res.data?.message || '联通成功');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || '联通失败');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card title="AI 服务" shadows="hover" style={{ width: '100%' }}>
      {loading ? (
        <Loading rows={4} />
      ) : (
        <Space vertical spacing={16} style={{ width: '100%' }}>
          <AppForm
            key={initialFingerprint}
            initValues={initialValues}
            onValueChange={values => {
              const next = values as Partial<AiAccountConfigItem>;
              const nextValues = {
                baseUrl: (next.baseUrl || '').trim(),
                apiKey: (next.apiKey || '').trim(),
                model: (next.model || '').trim(),
              };
              setFormValues(nextValues);
              const nextFingerprint = JSON.stringify({
                baseUrl: nextValues.baseUrl,
                apiKey: nextValues.apiKey,
                model: nextValues.model,
              });
              setIsDirty(nextFingerprint !== initialFingerprint);
            }}
            onSubmit={onSubmit}
          >
            <AppForm.Input field="baseUrl" label="Base URL" placeholder="如 https://api.openai.com/v1" />
            <AppForm.Input field="apiKey" mode="password" label="API Key" placeholder="请输入 OpenAI 兼容 API Key" />
            {modelOptions.length > 0 && !modelLoadFailed ? (
              <AppForm.Select
                field="model"
                label="模型"
                optionList={modelOptions}
                placeholder={modelsLoading ? '正在加载模型...' : '请选择模型'}
                filter
              />
            ) : (
              <AppForm.Input field="model" label="模型" placeholder="如 gpt-4.1-mini / deepseek-chat" />
            )}
            <Space>
              <Button type="primary" htmlType="submit" loading={saving}>
                保存配置
              </Button>
              <Button loading={modelsLoading} onClick={() => loadModelOptions()}>
                刷新模型
              </Button>
              <Button loading={testing} onClick={onTestConnection}>
                测试联通性
              </Button>
            </Space>
          </AppForm>
        </Space>
      )}
    </Card>
  );
}

export default SettingConfigAiApp;
