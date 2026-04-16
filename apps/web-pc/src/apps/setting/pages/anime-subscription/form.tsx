import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Empty, Space, Toast, Typography } from '@douyinfe/semi-ui';
import { AppForm } from '@/components';
import {
  createAnimeSubscription,
  getAnimeSubscriptionDetail,
  updateAnimeSubscription,
} from '@/services/anime-subscription';
import { useOutletContext, useParams } from 'react-router';
import type {
  AnimeSubscriptionResponse,
  CreateAnimeSubscriptionPayload,
  UpdateAnimeSubscriptionPayload,
} from '@volix/types';
import type { SettingOutletContext } from '@/apps/setting/types';

interface AnimeSubscriptionFormValues {
  name: string;
  aliasesText: string;
  rssUrl: string;
  seriesRootPath: string;
  qbitSavePath: string;
  openlistDownloadPath: string;
  matchKeywordsText: string;
  checkIntervalMinutes: number;
  renamePattern: string;
  enabled: boolean;
  useAi: boolean;
}

const DEFAULT_VALUES: AnimeSubscriptionFormValues = {
  name: '',
  aliasesText: '',
  rssUrl: '',
  seriesRootPath: '',
  qbitSavePath: '',
  openlistDownloadPath: '',
  matchKeywordsText: '',
  checkIntervalMinutes: 10,
  renamePattern: '{{series}}/S{{season}}/E{{episode}}',
  enabled: true,
  useAi: true,
};

const parseTextList = (value: string) => {
  return Array.from(
    new Set(
      value
        .split(/[\n,，]/)
        .map(item => item.trim())
        .filter(Boolean)
    )
  );
};

const toFormValues = (data: AnimeSubscriptionResponse): AnimeSubscriptionFormValues => {
  return {
    name: data.name || '',
    aliasesText: (data.aliases || []).join('\n'),
    rssUrl: data.rssUrl || '',
    seriesRootPath: data.seriesRootPath || '',
    qbitSavePath: data.qbitSavePath || '',
    openlistDownloadPath: data.openlistDownloadPath || '',
    matchKeywordsText: (data.matchKeywords || []).join('\n'),
    checkIntervalMinutes: data.checkIntervalMinutes || 10,
    renamePattern: data.renamePattern || '{{series}}/S{{season}}/E{{episode}}',
    enabled: data.enabled,
    useAi: data.useAi,
  };
};

const buildPayload = (
  values: AnimeSubscriptionFormValues
): CreateAnimeSubscriptionPayload | UpdateAnimeSubscriptionPayload => {
  return {
    name: values.name.trim(),
    aliases: parseTextList(values.aliasesText || ''),
    rssUrl: values.rssUrl.trim(),
    seriesRootPath: values.seriesRootPath.trim(),
    qbitSavePath: values.qbitSavePath.trim(),
    openlistDownloadPath: values.openlistDownloadPath.trim(),
    matchKeywords: parseTextList(values.matchKeywordsText || ''),
    checkIntervalMinutes: Number(values.checkIntervalMinutes) || 10,
    renamePattern: values.renamePattern.trim() || '{{series}}/S{{season}}/E{{episode}}',
    enabled: Boolean(values.enabled),
    useAi: Boolean(values.useAi),
  };
};

function AnimeSubscriptionForm({ mode }: { mode: 'create' | 'edit' }) {
  const { user, isAdmin, requestNavigate, registerLeaveGuard } = useOutletContext<SettingOutletContext>();
  const { id = '' } = useParams();
  const [origin, setOrigin] = useState<AnimeSubscriptionResponse>();
  const [initialValues, setInitialValues] = useState<AnimeSubscriptionFormValues>(DEFAULT_VALUES);
  const [loading, setLoading] = useState(mode === 'edit');
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const initialFingerprint = useMemo(() => JSON.stringify(initialValues), [initialValues]);

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!isAdmin) {
      requestNavigate('/setting/info');
      return;
    }
    if (mode !== 'edit') {
      return;
    }
    setLoading(true);
    getAnimeSubscriptionDetail(id)
      .then(res => {
        setOrigin(res.data);
        setInitialValues(toFormValues(res.data));
      })
      .catch(() => {
        Toast.error('加载追番任务失败');
        requestNavigate('/setting/anime-subscription');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [user, isAdmin, requestNavigate, id, mode]);

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
    const payload = buildPayload(values as AnimeSubscriptionFormValues);
    try {
      setSaving(true);
      if (mode === 'create') {
        await createAnimeSubscription(payload as CreateAnimeSubscriptionPayload);
        Toast.success('追番任务创建成功');
      } else {
        await updateAnimeSubscription(id, payload as UpdateAnimeSubscriptionPayload);
        Toast.success('追番任务更新成功');
      }
      registerLeaveGuard(null);
      setIsDirty(false);
      requestNavigate('/setting/anime-subscription');
    } catch (error) {
      const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
      Toast.error(message || (mode === 'create' ? '创建失败' : '更新失败'));
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <Card title="自动追番" shadows="hover">
        <Empty title="暂无权限" description="仅管理员可配置自动追番" />
      </Card>
    );
  }

  if (loading) {
    return (
      <Card title={mode === 'create' ? '新建追番任务' : '编辑追番任务'} shadows="hover">
        <Empty title="加载中" />
      </Card>
    );
  }

  return (
    <Card
      title={mode === 'create' ? '新建追番任务' : `编辑追番任务：${origin?.name || ''}`}
      shadows="hover"
      style={{ width: '100%' }}
    >
      <Space vertical spacing={16} style={{ width: '100%' }}>
        <AppForm
          key={mode === 'edit' ? `${id}-${initialFingerprint}` : mode}
          labelPosition="top"
          initValues={initialValues}
          onValueChange={values => {
            const nextFingerprint = JSON.stringify(values as AnimeSubscriptionFormValues);
            setIsDirty(nextFingerprint !== initialFingerprint);
          }}
          onSubmit={onSubmit}
        >
          <AppForm.Input field="name" label="番剧名称" placeholder="例如 咒术回战" />
          <AppForm.TextArea
            field="aliasesText"
            label="别名"
            placeholder={'每行一个，例如：\nJujutsu Kaisen\n前灭回游 => S03'}
            autosize
          />
          <Typography.Text type="tertiary" size="small">
            可写“别名 =&gt; S03”指定季数。命中该别名且标题没明确写季数时，会按这里的季数入库。
          </Typography.Text>
          <AppForm.Input field="rssUrl" label="RSS 地址" placeholder="请输入 RSS 链接" />
          <AppForm.Input
            field="seriesRootPath"
            label="最终番剧目录"
            placeholder="例如 /115网盘/动漫/咒术回战，可留空"
          />
          <Typography.Text type="tertiary" size="small">
            这里填番剧最终整理到的 OpenList 目录。可以留空；如果目录已存在，检查时会先递归扫描并尝试校正规范命名，再结合
            RSS 交给 AI 判断缺哪些集。
          </Typography.Text>
          <AppForm.Input field="qbitSavePath" label="qBittorrent 下载目录" placeholder="例如 /downloads/anime" />
          <AppForm.Input field="openlistDownloadPath" label="OpenList 下载目录" placeholder="例如 /Downloads/anime" />
          <AppForm.TextArea
            field="matchKeywordsText"
            label="匹配关键词"
            placeholder={'每行一个，用于名称模糊匹配，例如：\n死灭回游 => S03'}
            autosize
          />
          <AppForm.Input field="checkIntervalMinutes" label="检查周期（分钟）" type="number" placeholder="默认 10" />
          <AppForm.Input field="renamePattern" label="命名规则" placeholder="{{series}}/S{{season}}/E{{episode}}" />
          <AppForm.Checkbox field="enabled" noLabel>
            启用任务
          </AppForm.Checkbox>
          <AppForm.Checkbox field="useAi" noLabel>
            启用 AI 辅助匹配
          </AppForm.Checkbox>
          <Space>
            <Button type="primary" htmlType="submit" loading={saving}>
              {mode === 'create' ? '创建任务' : '保存修改'}
            </Button>
            <Button onClick={() => requestNavigate('/setting/anime-subscription')}>取消</Button>
          </Space>
        </AppForm>
      </Space>
    </Card>
  );
}

export default AnimeSubscriptionForm;
