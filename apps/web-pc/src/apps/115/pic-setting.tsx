import { Button, Descriptions, Form, Popconfirm, Space, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconDelete } from '@douyinfe/semi-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Data } from '@douyinfe/semi-ui/lib/es/descriptions';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { PicCacheFolderItem } from '@volix/types';
import { clear115Pic, get115PicInfo, retry115Pic, set115PicRandomCacheConfig } from '@/services/115';
import { getHttpErrorMessage } from '@/utils/error';
import { useI18n } from '@/i18n';
import { FilePath } from './components';
import { picCacheStatusOrder, renderPicCacheStatusTag } from './pic-cache-status';

const { Text } = Typography;

interface RandomCacheFormValues {
  localWeight: number;
  cloudWeight: number;
  localMaxSizeMb: number;
  randomNoRepeatWindowMinutes: number;
  randomNoRepeatMaxCount: number;
  randomPicEndpoint: string;
  localProxyEnabled: boolean;
}

interface RandomPicEndpointItem {
  key: string;
  label: string;
  url: string;
}

const RANDOM_CACHE_FIELDS: Array<keyof RandomCacheFormValues> = [
  'localWeight',
  'cloudWeight',
  'localMaxSizeMb',
  'randomNoRepeatWindowMinutes',
  'randomNoRepeatMaxCount',
  'randomPicEndpoint',
  'localProxyEnabled',
];

const DEFAULT_RANDOM_CACHE_FORM_VALUES: RandomCacheFormValues = {
  localWeight: 50,
  cloudWeight: 50,
  localMaxSizeMb: 2048,
  randomNoRepeatWindowMinutes: 5,
  randomNoRepeatMaxCount: 50,
  randomPicEndpoint: '',
  localProxyEnabled: false,
};

const RANDOM_CACHE_FIELD_WIDTH = 430;

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

  const hasRandomConfigTouched = () => {
    return RANDOM_CACHE_FIELDS.some(field => Boolean(randomCacheFormApiRef.current?.getTouched(field)));
  };

  const randomPicEndpointList = useMemo<RandomPicEndpointItem[]>(() => {
    const origin = typeof window === 'undefined' ? '' : window.location.origin;
    const withOrigin = (path: string) => `${origin}${path}`;
    return [
      {
        key: 'json',
        label: t('pic115.endpoint.json'),
        url: withOrigin('/api/115/pic?mode=json'),
      },
      {
        key: 'json-proxy',
        label: t('pic115.endpoint.jsonProxy'),
        url: withOrigin('/api/115/pic?mode=json&proxy=1'),
      },
      {
        key: 'direct',
        label: t('pic115.endpoint.direct'),
        url: withOrigin('/api/115/pic?mode=direct'),
      },
    ];
  }, [t]);

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
          randomPicEndpoint?: string;
          localProxyEnabled?: boolean;
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
      randomPicEndpoint: String(
        randomCacheConfig?.randomPicEndpoint ?? DEFAULT_RANDOM_CACHE_FORM_VALUES.randomPicEndpoint
      ).trim(),
      localProxyEnabled: Boolean(
        randomCacheConfig?.localProxyEnabled ?? DEFAULT_RANDOM_CACHE_FORM_VALUES.localProxyEnabled
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
      setCount(result.data.count);
      setIsCaching(result.data.loading);
      if (forceSyncRandomConfig || !hasRandomConfigTouched()) {
        syncRandomCacheFormValues(result.data.randomCacheConfig, forceSyncRandomConfig);
      }
      setLocalCacheFileCount(result.data.randomCacheStats?.localFileCount ?? 0);
      setLocalCacheTotalSizeMb(result.data.randomCacheStats?.localTotalSizeMb ?? 0);
      setLocalCacheLimitExceeded(Boolean(result.data.randomCacheStats?.localLimitExceeded));
      setFolders(
        [...result.data.folders].sort((a, b) => {
          const left = picCacheStatusOrder[a.status];
          const right = picCacheStatusOrder[b.status];
          return left - right || a.cid.localeCompare(b.cid);
        })
      );
    }
  };

  useEffect(() => {
    fetch(true).catch(() => undefined);
    const timer = window.setInterval(() => {
      fetch().catch(() => undefined);
    }, 3000);

    return () => window.clearInterval(timer);
  }, []);

  const onDelete = async () => {
    try {
      await clear115Pic();
      await fetch();
      Toast.success(t('pic115.cache.clearSuccess'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('pic115.cache.clearFailed')));
    }
  };

  const onDeleteByPath = async (path: string) => {
    try {
      await clear115Pic({
        paths: [path],
      });
      await fetch();
      Toast.success(t('pic115.cache.deleteSuccess'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('pic115.cache.deleteFailed')));
    }
  };

  const onRetryByPath = async (path: string) => {
    try {
      await retry115Pic({
        paths: [path],
      });
      await fetch();
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
      randomPicEndpoint: String(values.randomPicEndpoint || '').trim(),
      localProxyEnabled: Boolean(values.localProxyEnabled),
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
        randomPicEndpoint: payload.randomPicEndpoint,
        localProxyEnabled: payload.localProxyEnabled,
      });
      await fetch(true);
      Toast.success(t('pic115.form.saveSuccess'));
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, t('pic115.form.saveFailed')));
    } finally {
      setSavingRandomCacheConfig(false);
    }
  };

  const onCopyEndpoint = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      Toast.success(t('pic115.endpoint.copySuccess'));
    } catch {
      Toast.error(t('common.action.copyFailed'));
    }
  };

  const data: Data[] = useMemo(() => {
    return [
      { key: t('pic115.stats.cacheCount'), value: count },
      { key: t('pic115.stats.cacheFolderCount'), value: folders.length },
      { key: t('pic115.stats.localFileCount'), value: localCacheFileCount },
      { key: t('pic115.stats.localUsage'), value: `${localCacheTotalSizeMb} MB` },
      {
        key: t('pic115.stats.status'),
        value: isCaching ? (
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
      },
      {
        key: t('pic115.stats.localCapacity'),
        value: localCacheLimitExceeded ? (
          <Tag size="small" shape="circle" color="red">
            {t('pic115.status.overLimit')}
          </Tag>
        ) : (
          <Tag size="small" shape="circle" color="green">
            {t('pic115.status.normal')}
          </Tag>
        ),
      },
    ];
  }, [count, folders.length, isCaching, localCacheFileCount, localCacheLimitExceeded, localCacheTotalSizeMb, t]);

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
      <Text strong>{t('pic115.endpoint.sectionTitle')}</Text>
      <Space vertical spacing={8} style={{ width: '100%' }}>
        {randomPicEndpointList.map(item => (
          <Space key={item.key} align="center" style={{ width: '100%' }}>
            <Text style={{ minWidth: 170 }}>{item.label}</Text>
            <Text ellipsis style={{ flex: 1, minWidth: 0 }}>
              {item.url}
            </Text>
            <Button size="small" theme="borderless" type="primary" onClick={() => onCopyEndpoint(item.url)}>
              {t('common.action.copy')}
            </Button>
          </Space>
        ))}
      </Space>
      <Text strong>{t('pic115.cache.sectionTitle')}</Text>
      <Form<RandomCacheFormValues>
        labelPosition="top"
        initValues={DEFAULT_RANDOM_CACHE_FORM_VALUES}
        getFormApi={formApi => {
          randomCacheFormApiRef.current = formApi;
        }}
        onSubmit={onSaveRandomCacheConfig}
      >
        {({ values }) => {
          const totalWeight = Number(values.localWeight || 0) + Number(values.cloudWeight || 0);

          return (
            <Space vertical spacing={12} style={{ width: '100%' }}>
              <Form.InputNumber
                field="localWeight"
                label={t('pic115.form.localWeight')}
                min={0}
                max={100}
                style={{ width: RANDOM_CACHE_FIELD_WIDTH }}
              />
              <Form.InputNumber
                field="cloudWeight"
                label={t('pic115.form.cloudWeight')}
                min={0}
                max={100}
                style={{ width: RANDOM_CACHE_FIELD_WIDTH }}
              />
              <Text type={totalWeight === 100 ? 'secondary' : 'danger'}>
                {t('pic115.form.weightSummary', { totalWeight })}
              </Text>
              <Form.InputNumber
                field="localMaxSizeMb"
                label={t('pic115.form.localMaxSizeMb')}
                min={100}
                max={102400}
                style={{ width: RANDOM_CACHE_FIELD_WIDTH }}
              />
              <Form.Input
                field="randomPicEndpoint"
                label={t('pic115.form.randomEndpoint')}
                placeholder="https://your-domain/api/115/pic?mode=json&proxy=1"
                style={{ width: RANDOM_CACHE_FIELD_WIDTH }}
              />
              <div style={{ width: RANDOM_CACHE_FIELD_WIDTH }}>
                <Form.Switch field="localProxyEnabled" label={t('pic115.form.localProxyEnabled')} />
              </div>
              <Form.InputNumber
                field="randomNoRepeatWindowMinutes"
                label={t('pic115.form.noRepeatWindow')}
                min={0}
                max={1440}
                style={{ width: RANDOM_CACHE_FIELD_WIDTH }}
              />
              <Text type="tertiary" size="small">
                {t('pic115.form.noRepeatWindowHint')}
              </Text>
              <Form.InputNumber
                field="randomNoRepeatMaxCount"
                label={t('pic115.form.noRepeatMaxCount')}
                min={1}
                max={10000}
                style={{ width: RANDOM_CACHE_FIELD_WIDTH }}
              />
              <Button
                type="primary"
                loading={savingRandomCacheConfig}
                onClick={() => randomCacheFormApiRef.current?.submitForm()}
              >
                {t('pic115.form.save')}
              </Button>
            </Space>
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
