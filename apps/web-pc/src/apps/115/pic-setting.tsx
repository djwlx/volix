import { Button, Descriptions, Form, Popconfirm, Space, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconDelete } from '@douyinfe/semi-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Data } from '@douyinfe/semi-ui/lib/es/descriptions';
import type { FormApi } from '@douyinfe/semi-ui/lib/es/form';
import type { PicCacheFolderItem } from '@volix/types';
import { clear115Pic, get115PicInfo, retry115Pic, set115PicRandomCacheConfig } from '@/services/115';
import { getHttpErrorMessage } from '@/utils/error';
import { FilePath } from './components';
import { picCacheStatusOrder, renderPicCacheStatusTag } from './pic-cache-status';

const { Text } = Typography;

interface RandomCacheFormValues {
  localWeight: number;
  cloudWeight: number;
  localMaxSizeMb: number;
  randomNoRepeatWindowMinutes: number;
  randomNoRepeatMaxCount: number;
}

const RANDOM_CACHE_FIELDS: Array<keyof RandomCacheFormValues> = [
  'localWeight',
  'cloudWeight',
  'localMaxSizeMb',
  'randomNoRepeatWindowMinutes',
  'randomNoRepeatMaxCount',
];

const DEFAULT_RANDOM_CACHE_FORM_VALUES: RandomCacheFormValues = {
  localWeight: 50,
  cloudWeight: 50,
  localMaxSizeMb: 2048,
  randomNoRepeatWindowMinutes: 5,
  randomNoRepeatMaxCount: 50,
};

export function PicSetting() {
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
      Toast.success('清理成功');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '清理失败'));
    }
  };

  const onDeleteByPath = async (path: string) => {
    try {
      await clear115Pic({
        paths: [path],
      });
      await fetch();
      Toast.success('删除成功');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '删除失败'));
    }
  };

  const onRetryByPath = async (path: string) => {
    try {
      await retry115Pic({
        paths: [path],
      });
      await fetch();
      Toast.success('已加入重试队列');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '重试失败'));
    }
  };

  const onSaveRandomCacheConfig = async (values: RandomCacheFormValues) => {
    const payload: RandomCacheFormValues = {
      localWeight: Number(values.localWeight || 0),
      cloudWeight: Number(values.cloudWeight || 0),
      localMaxSizeMb: Number(values.localMaxSizeMb || 100),
      randomNoRepeatWindowMinutes: Number(values.randomNoRepeatWindowMinutes || 0),
      randomNoRepeatMaxCount: Number(values.randomNoRepeatMaxCount || 50),
    };
    const sum = payload.localWeight + payload.cloudWeight;
    if (sum !== 100) {
      Toast.error('随机来源权重总和必须等于100');
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
      });
      await fetch(true);
      Toast.success('随机缓存配置已保存');
    } catch (error) {
      Toast.error(getHttpErrorMessage(error, '保存随机缓存配置失败'));
    } finally {
      setSavingRandomCacheConfig(false);
    }
  };

  const data: Data[] = useMemo(() => {
    return [
      { key: '缓存数量', value: count },
      { key: '缓存目录', value: folders.length },
      { key: '本地缓存文件', value: localCacheFileCount },
      { key: '本地缓存占用', value: `${localCacheTotalSizeMb} MB` },
      {
        key: '状态',
        value: isCaching ? (
          <Tag size="small" shape="circle" color="amber">
            缓存中
          </Tag>
        ) : count ? (
          <Tag size="small" shape="circle" color="green">
            已缓存
          </Tag>
        ) : (
          <Tag size="small" shape="circle" color="orange">
            未缓存
          </Tag>
        ),
      },
      {
        key: '本地缓存容量',
        value: localCacheLimitExceeded ? (
          <Tag size="small" shape="circle" color="red">
            已超上限
          </Tag>
        ) : (
          <Tag size="small" shape="circle" color="green">
            正常
          </Tag>
        ),
      },
    ];
  }, [count, folders.length, isCaching, localCacheFileCount, localCacheLimitExceeded, localCacheTotalSizeMb]);

  return (
    <Space vertical align="start" spacing={16} style={{ width: '100%' }}>
      <div style={{ width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
        <Popconfirm title="确定清理所有缓存？" content="此修改将不可逆" onConfirm={onDelete}>
          <Button icon={<IconDelete style={{ color: 'red' }} />} aria-label="清理" />
        </Popconfirm>
      </div>
      <Descriptions data={data} />
      <Text strong>随机图片本地缓存</Text>
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
              <Form.InputNumber field="localWeight" label="本地文件来源权重（%）" min={0} max={100} />
              <Form.InputNumber field="cloudWeight" label="115云来源权重（%）" min={0} max={100} />
              <Text type={totalWeight === 100 ? 'secondary' : 'danger'}>
                当前权重总和：{totalWeight}（必须等于100）
              </Text>
              <Form.InputNumber field="localMaxSizeMb" label="本地缓存上限（MB）" min={100} max={102400} />
              <Form.InputNumber field="randomNoRepeatWindowMinutes" label="随机去重窗口（分钟）" min={0} max={1440} />
              <Text type="tertiary" size="small">
                设为 0 表示关闭不重复限制
              </Text>
              <Form.InputNumber field="randomNoRepeatMaxCount" label="随机去重次数上限" min={1} max={10000} />
              <Button
                type="primary"
                loading={savingRandomCacheConfig}
                onClick={() => randomCacheFormApiRef.current?.submitForm()}
              >
                保存随机缓存配置
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
            title: '目录',
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
            title: '状态',
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
            title: '缓存数量',
            dataIndex: 'count',
            key: 'count',
            width: 120,
            render: (value: number | undefined) => value || 0,
          },
          {
            title: '操作',
            key: 'action',
            width: 180,
            render: (_: unknown, record: PicCacheFolderItem) => (
              <Space>
                {record.status === 'failed' ? (
                  <Button theme="borderless" type="primary" onClick={() => onRetryByPath(record.cid)}>
                    重试
                  </Button>
                ) : null}
                {record.status === 'cached' || record.status === 'failed' || record.status === 'partial' ? (
                  <Popconfirm
                    title="确定删除该路径缓存？"
                    content="此修改将不可逆"
                    onConfirm={() => onDeleteByPath(record.cid)}
                  >
                    <Button theme="borderless" type="danger">
                      删除
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
