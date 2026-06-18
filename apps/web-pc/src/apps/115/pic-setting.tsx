import { Button, Descriptions, Form, Popconfirm, Space, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconDelete } from '@douyinfe/semi-icons';
import { useEffect, useRef, useState } from 'react';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { PicCacheFolderItem } from '@volix/types';
import { clear115Pic, get115PicInfo, retry115Pic, set115PicRandomCacheConfig } from '@/services/115';
import { getHttpErrorMessage } from '@/utils/error';
import { useI18n } from '@/i18n';
import { websocketEventBus } from '@/services/websocket-event-bus';
import { FilePath } from './components';
import { picCacheStatusOrder, renderPicCacheStatusTag } from './pic-cache-status';
import { buildPicSettingStatsData } from './pic-setting-stats';
import { subscribeToPic115InfoEvents } from './pic-realtime';

const { Text } = Typography;

interface RandomCacheFormValues {
  localWeight: number;
  cloudWeight: number;
  localMaxSizeMb: number;
  randomNoRepeatWindowMinutes: number;
  randomNoRepeatMaxCount: number;
  cloudProxyUrl: string;
  autoPlayIntervalSeconds: number;
}

const RANDOM_CACHE_FIELDS: Array<keyof RandomCacheFormValues> = [
  'localWeight',
  'cloudWeight',
  'localMaxSizeMb',
  'randomNoRepeatWindowMinutes',
  'randomNoRepeatMaxCount',
  'cloudProxyUrl',
  'autoPlayIntervalSeconds',
];

const DEFAULT_RANDOM_CACHE_FORM_VALUES: RandomCacheFormValues = {
  localWeight: 50,
  cloudWeight: 50,
  localMaxSizeMb: 2048,
  randomNoRepeatWindowMinutes: 5,
  randomNoRepeatMaxCount: 50,
  cloudProxyUrl: '',
  autoPlayIntervalSeconds: 10,
};

const RANDOM_CACHE_FIELD_STYLE = {
  width: '100%',
  maxWidth: 'none',
} as const;

export function PicSetting() {
  const { t } = useI18n();
  const [count, setCount] = useState(0);
  const [isCaching, setIsCaching] = useState(false);
  const [folders, setFolders] = useState<PicCacheFolderItem[]>([]);
  const [localCacheFileCount, setLocalCacheFileCount] = useState(0);
  const [localCacheTotalSizeMb, setLocalCacheTotalSizeMb] = useState(0);
  const [localCacheLimitExceeded, setLocalCacheLimitExceeded] = useState(false);
  const [savingRandomCacheConfig, setSavingRandomCacheConfig] = useState(false);
  const randomCacheFormApiRef = useRef<FormApi<RandomCacheFormValues>>();

  const applyPicInfo = (
    data:
      | {
          count?: number;
          loading?: boolean;
          folders?: PicCacheFolderItem[];
          randomCacheConfig?: {
            sourceWeights?: { local?: number; cloud?: number };
            localMaxSizeMb?: number;
            randomNoRepeatWindowMinutes?: number;
            randomNoRepeatMaxCount?: number;
            cloudProxyUrl?: string;
            autoPlayIntervalSeconds?: number;
          };
          randomCacheStats?: {
            localFileCount?: number;
            localTotalSizeMb?: number;
            localLimitExceeded?: boolean;
          };
        }
      | undefined,
    forceSyncRandomConfig = false
  ) => {
    if (!data) {
      return;
    }
    setCount(Number(data.count || 0));
    setIsCaching(Boolean(data.loading));
    if (forceSyncRandomConfig || !hasRandomConfigTouched()) {
      syncRandomCacheFormValues(data.randomCacheConfig, forceSyncRandomConfig);
    }
    setLocalCacheFileCount(data.randomCacheStats?.localFileCount ?? 0);
    setLocalCacheTotalSizeMb(data.randomCacheStats?.localTotalSizeMb ?? 0);
    setLocalCacheLimitExceeded(Boolean(data.randomCacheStats?.localLimitExceeded));
    setFolders(
      [...(data.folders || [])].sort((a, b) => {
        const left = picCacheStatusOrder[a.status];
        const right = picCacheStatusOrder[b.status];
        return left - right || a.cid.localeCompare(b.cid);
      })
    );
  };

  const hasRandomConfigTouched = () => {
    return RANDOM_CACHE_FIELDS.some(field => Boolean(randomCacheFormApiRef.current?.getTouched(field)));
  };

  const syncRandomCacheFormValues = (
    randomCacheConfig:
      | {
          sourceWeights?: {
            local?: number;
            cloud?: number;
          };
          localMaxSizeMb?: number;
          randomNoRepeatWindowMinutes?: number;
          randomNoRepeatMaxCount?: number;
          cloudProxyUrl?: string;
          autoPlayIntervalSeconds?: number;
        }
      | null
      | undefined,
    resetTouched = false
  ) => {
    const nextValues: RandomCacheFormValues = {
      localWeight: Number(randomCacheConfig?.sourceWeights?.local ?? DEFAULT_RANDOM_CACHE_FORM_VALUES.localWeight),
      cloudWeight: Number(randomCacheConfig?.sourceWeights?.cloud ?? DEFAULT_RANDOM_CACHE_FORM_VALUES.cloudWeight),
      localMaxSizeMb: Number(randomCacheConfig?.localMaxSizeMb ?? DEFAULT_RANDOM_CACHE_FORM_VALUES.localMaxSizeMb),
      randomNoRepeatWindowMinutes: Number(
        randomCacheConfig?.randomNoRepeatWindowMinutes ?? DEFAULT_RANDOM_CACHE_FORM_VALUES.randomNoRepeatWindowMinutes
      ),
      randomNoRepeatMaxCount: Number(
        randomCacheConfig?.randomNoRepeatMaxCount ?? DEFAULT_RANDOM_CACHE_FORM_VALUES.randomNoRepeatMaxCount
      ),
      cloudProxyUrl: String(randomCacheConfig?.cloudProxyUrl ?? DEFAULT_RANDOM_CACHE_FORM_VALUES.cloudProxyUrl),
      autoPlayIntervalSeconds: Number(
        randomCacheConfig?.autoPlayIntervalSeconds ?? DEFAULT_RANDOM_CACHE_FORM_VALUES.autoPlayIntervalSeconds
      ),
    };
    randomCacheFormApiRef.current?.setValues(nextValues);
    if (resetTouched) {
      RANDOM_CACHE_FIELDS.forEach(field => {
        randomCacheFormApiRef.current?.setTouched(field, false);
      });
    }
  };

  const fetch = async (forceSyncRandomConfig = false) => {
    const result = await get115PicInfo();
    if (result.code === 0) {
      applyPicInfo(result.data, forceSyncRandomConfig);
    }
  };

  useEffect(() => {
    fetch(true).catch(() => undefined);
    const unsubscribe = subscribeToPic115InfoEvents({
      onChanged: () => {
        fetch().catch(() => undefined);
      },
      onReconnect: () => {
        fetch(true).catch(() => undefined);
      },
    });
    void websocketEventBus.connect();

    return () => {
      unsubscribe();
    };
  }, []);

  const onDelete = async () => {
    try {
      const response = await clear115Pic();
      if (response.code === 0 && response.data && typeof response.data === 'object') {
        applyPicInfo(response.data as Parameters<typeof applyPicInfo>[0]);
      }
      Toast.success(t('pic115.cache.clearSuccess'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('pic115.cache.clearFailed')));
    }
  };

  const onDeleteByPath = async (path: string) => {
    try {
      const response = await clear115Pic({
        paths: [path],
      });
      if (response.code === 0 && response.data && typeof response.data === 'object') {
        applyPicInfo(response.data as Parameters<typeof applyPicInfo>[0]);
      }
      Toast.success(t('pic115.cache.deleteSuccess'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('pic115.cache.deleteFailed')));
    }
  };

  const onRetryByPath = async (path: string) => {
    try {
      const response = await retry115Pic({
        paths: [path],
      });
      if (response.code === 0) {
        applyPicInfo(response.data as Parameters<typeof applyPicInfo>[0]);
      }
      Toast.success(t('pic115.cache.retrySuccess'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('pic115.cache.retryFailed')));
    }
  };

  const onSaveRandomCacheConfig = async (values: RandomCacheFormValues) => {
    const payload: RandomCacheFormValues = {
      localWeight: Number(values.localWeight || 0),
      cloudWeight: Number(values.cloudWeight || 0),
      localMaxSizeMb: Number(values.localMaxSizeMb || 100),
      randomNoRepeatWindowMinutes: Number(values.randomNoRepeatWindowMinutes || 0),
      randomNoRepeatMaxCount: Number(values.randomNoRepeatMaxCount || 50),
      cloudProxyUrl: String(values.cloudProxyUrl || '').trim(),
      autoPlayIntervalSeconds: Number(values.autoPlayIntervalSeconds || 10),
    };
    const sum = payload.localWeight + payload.cloudWeight;
    if (sum !== 100) {
      Toast.error(t('pic115.form.weightInvalid'));
      return;
    }

    try {
      setSavingRandomCacheConfig(true);
      await set115PicRandomCacheConfig({
        sourceWeights: {
          local: payload.localWeight,
          cloud: payload.cloudWeight,
        },
        localMaxSizeMb: payload.localMaxSizeMb,
        randomNoRepeatWindowMinutes: payload.randomNoRepeatWindowMinutes,
        randomNoRepeatMaxCount: payload.randomNoRepeatMaxCount,
        cloudProxyUrl: payload.cloudProxyUrl,
        autoPlayIntervalSeconds: payload.autoPlayIntervalSeconds,
      });
      const latest = await get115PicInfo();
      if (latest.code === 0) {
        applyPicInfo(latest.data, true);
      }
      Toast.success(t('pic115.form.saveSuccess'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('pic115.form.saveFailed')));
    } finally {
      setSavingRandomCacheConfig(false);
    }
  };

  const data = buildPicSettingStatsData({
    count,
    folderCount: folders.length,
    localCacheFileCount,
    localCacheTotalSizeMb,
    labels: {
      cacheCount: t('pic115.stats.cacheCount'),
      cacheFolderCount: t('pic115.stats.cacheFolderCount'),
      localFileCount: t('pic115.stats.localFileCount'),
      localUsage: t('pic115.stats.localUsage'),
      status: t('pic115.stats.status'),
      localCapacity: t('pic115.stats.localCapacity'),
    },
    statusTag: isCaching ? (
      <Tag size="small" shape="circle" color="amber">
        {t('pic115.status.caching')}
      </Tag>
    ) : count ? (
      <Tag size="small" shape="circle" color="green">
        {t('pic115.status.cached')}
      </Tag>
    ) : (
      <Tag size="small" shape="circle" color="orange">
        {t('pic115.status.notCached')}
      </Tag>
    ),
    localCapacityTag: localCacheLimitExceeded ? (
      <Tag size="small" shape="circle" color="red">
        {t('pic115.status.overLimit')}
      </Tag>
    ) : (
      <Tag size="small" shape="circle" color="green">
        {t('pic115.status.normal')}
      </Tag>
    ),
  });

  return (
    <Space vertical align="start" spacing={16} style={{ width: '100%' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <Popconfirm
          title={t('pic115.cache.clearConfirm.title')}
          content={t('pic115.cache.clearConfirm.description')}
          onConfirm={onDelete}
        >
          <Button icon={<IconDelete style={{ color: 'red' }} />} aria-label={t('pic115.action.clear')} />
        </Popconfirm>
      </div>
      <Descriptions data={data} />
      <Text strong>{t('pic115.cache.sectionTitle')}</Text>
      <Form<RandomCacheFormValues>
        labelPosition="top"
        initValues={DEFAULT_RANDOM_CACHE_FORM_VALUES}
        style={{ width: '100%' }}
        getFormApi={formApi => {
          randomCacheFormApiRef.current = formApi;
        }}
        onSubmit={onSaveRandomCacheConfig}
      >
        {() => {
          return (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Form.InputNumber
                field="localWeight"
                label={t('pic115.form.localWeight')}
                min={0}
                max={100}
                style={RANDOM_CACHE_FIELD_STYLE}
              />
              <Form.InputNumber
                field="cloudWeight"
                label={t('pic115.form.cloudWeight')}
                min={0}
                max={100}
                style={RANDOM_CACHE_FIELD_STYLE}
              />
              <Form.InputNumber
                field="localMaxSizeMb"
                label={t('pic115.form.localMaxSizeMb')}
                min={100}
                max={102400}
                style={RANDOM_CACHE_FIELD_STYLE}
              />
              <Form.Input
                field="cloudProxyUrl"
                label={t('pic115.form.cloudProxyUrl')}
                placeholder={t('pic115.form.cloudProxyUrlPlaceholder')}
                showClear
                style={RANDOM_CACHE_FIELD_STYLE}
              />
              <Form.InputNumber
                field="randomNoRepeatWindowMinutes"
                label={t('pic115.form.noRepeatWindow')}
                min={0}
                max={1440}
                style={RANDOM_CACHE_FIELD_STYLE}
              />
              <Form.InputNumber
                field="randomNoRepeatMaxCount"
                label={t('pic115.form.noRepeatMaxCount')}
                min={1}
                max={10000}
                style={RANDOM_CACHE_FIELD_STYLE}
              />
              <Form.InputNumber
                field="autoPlayIntervalSeconds"
                label={t('pic115.form.autoPlayIntervalSeconds')}
                min={1}
                max={3600}
                style={RANDOM_CACHE_FIELD_STYLE}
              />
              <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-start' }}>
                <Button
                  type="primary"
                  loading={savingRandomCacheConfig}
                  onClick={() => randomCacheFormApiRef.current?.submitForm()}
                >
                  {t('pic115.form.save')}
                </Button>
              </div>
            </div>
          );
        }}
      </Form>
      <Table<PicCacheFolderItem>
        rowKey="cid"
        pagination={false}
        size="small"
        dataSource={folders}
        columns={[
          {
            title: t('pic115.table.directory'),
            dataIndex: 'cid',
            width: 300,
            key: 'cid',
            render: (cid: string) => <FilePath dir={cid} />,
          },
          {
            title: 'CID',
            dataIndex: 'cid',
            key: 'cidText',
            width: 180,
            render: (cid: string) => <Text>{cid}</Text>,
          },
          {
            title: t('pic115.table.status'),
            dataIndex: 'status',
            key: 'status',
            width: 220,
            render: (_: unknown, record: PicCacheFolderItem) => (
              <Space vertical spacing={4} align="start">
                {renderPicCacheStatusTag(record)}
                {record.errorMessage ? (
                  <Text type="danger" size="small">
                    {record.errorMessage}
                  </Text>
                ) : null}
              </Space>
            ),
          },
          {
            title: t('pic115.table.cacheCount'),
            dataIndex: 'count',
            key: 'count',
            width: 120,
            render: (value: number | undefined) => value || 0,
          },
          {
            title: t('pic115.table.action'),
            key: 'action',
            width: 180,
            render: (_: unknown, record: PicCacheFolderItem) => (
              <Space>
                {record.status === 'failed' ? (
                  <Button theme="borderless" type="primary" onClick={() => onRetryByPath(record.cid)}>
                    {t('pic115.action.retry')}
                  </Button>
                ) : null}
                {record.status === 'cached' || record.status === 'failed' || record.status === 'partial' ? (
                  <Popconfirm
                    title={t('pic115.cache.deleteConfirm.title')}
                    content={t('pic115.cache.deleteConfirm.description')}
                    onConfirm={() => onDeleteByPath(record.cid)}
                  >
                    <Button theme="borderless" type="danger">
                      {t('common.action.delete')}
                    </Button>
                  </Popconfirm>
                ) : (
                  <Text type="tertiary">-</Text>
                )}
              </Space>
            ),
          },
        ]}
      />
    </Space>
  );
}
