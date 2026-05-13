import {
  Button,
  Card,
  Descriptions,
  InputNumber,
  Popconfirm,
  Space,
  Table,
  Tag,
  Toast,
  Typography,
} from '@douyinfe/semi-ui';
import { IconDelete } from '@douyinfe/semi-icons';
import { useEffect, useMemo, useState } from 'react';
import type { Data } from '@douyinfe/semi-ui/lib/es/descriptions';
import type { PicCacheFolderItem } from '@volix/types';
import { clear115Pic, get115PicInfo, retry115Pic, set115PicRandomCacheConfig } from '@/services/115';
import { getHttpErrorMessage } from '@/utils/error';
import { FilePath } from './components';
import { picCacheStatusOrder, renderPicCacheStatusTag } from './pic-cache-status';

const { Text } = Typography;

export function PicSetting() {
  const [count, setCount] = useState(0);
  const [isCaching, setIsCaching] = useState(false);
  const [folders, setFolders] = useState<PicCacheFolderItem[]>([]);
  const [memoryWeight, setMemoryWeight] = useState(20);
  const [localWeight, setLocalWeight] = useState(30);
  const [cloudWeight, setCloudWeight] = useState(50);
  const [memoryMaxSizeMb, setMemoryMaxSizeMb] = useState(512);
  const [localMaxSizeMb, setLocalMaxSizeMb] = useState(2048);
  const [memoryCacheFileCount, setMemoryCacheFileCount] = useState(0);
  const [memoryCacheTotalSizeMb, setMemoryCacheTotalSizeMb] = useState(0);
  const [memoryCacheLimitExceeded, setMemoryCacheLimitExceeded] = useState(false);
  const [localCacheFileCount, setLocalCacheFileCount] = useState(0);
  const [localCacheTotalSizeMb, setLocalCacheTotalSizeMb] = useState(0);
  const [localCacheLimitExceeded, setLocalCacheLimitExceeded] = useState(false);
  const [savingRandomCacheConfig, setSavingRandomCacheConfig] = useState(false);
  const [randomConfigDirty, setRandomConfigDirty] = useState(false);

  const fetch = async (forceSyncRandomConfig = false) => {
    const result = await get115PicInfo();
    if (result.code === 0) {
      setCount(result.data.count);
      setIsCaching(result.data.loading);
      if (forceSyncRandomConfig || !randomConfigDirty) {
        setMemoryWeight(result.data.randomCacheConfig?.sourceWeights?.memory ?? 20);
        setLocalWeight(result.data.randomCacheConfig?.sourceWeights?.local ?? 30);
        setCloudWeight(result.data.randomCacheConfig?.sourceWeights?.cloud ?? 50);
        setMemoryMaxSizeMb(result.data.randomCacheConfig?.memoryMaxSizeMb ?? 512);
        setLocalMaxSizeMb(result.data.randomCacheConfig?.localMaxSizeMb ?? 2048);
      }
      setMemoryCacheFileCount(result.data.randomCacheStats?.memoryFileCount ?? 0);
      setMemoryCacheTotalSizeMb(result.data.randomCacheStats?.memoryTotalSizeMb ?? 0);
      setMemoryCacheLimitExceeded(Boolean(result.data.randomCacheStats?.memoryLimitExceeded));
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
  }, [randomConfigDirty]);

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

  const onSaveRandomCacheConfig = async () => {
    const sum = memoryWeight + localWeight + cloudWeight;
    if (sum !== 100) {
      Toast.error('随机来源权重总和必须等于100');
      return;
    }

    try {
      setSavingRandomCacheConfig(true);
      await set115PicRandomCacheConfig({
        sourceWeights: {
          memory: memoryWeight,
          local: localWeight,
          cloud: cloudWeight,
        },
        memoryMaxSizeMb,
        localMaxSizeMb,
      });
      setRandomConfigDirty(false);
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
      { key: '内存缓存文件', value: memoryCacheFileCount },
      { key: '内存缓存占用', value: `${memoryCacheTotalSizeMb} MB` },
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
        key: '内存缓存容量',
        value: memoryCacheLimitExceeded ? (
          <Tag size="small" shape="circle" color="red">
            已超上限
          </Tag>
        ) : (
          <Tag size="small" shape="circle" color="green">
            正常
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
  }, [
    count,
    folders.length,
    isCaching,
    localCacheFileCount,
    localCacheLimitExceeded,
    localCacheTotalSizeMb,
    memoryCacheFileCount,
    memoryCacheLimitExceeded,
    memoryCacheTotalSizeMb,
  ]);

  const totalWeight = memoryWeight + localWeight + cloudWeight;

  return (
    <Card
      style={{ width: '100%' }}
      shadows="hover"
      headerExtraContent={
        <Popconfirm title="确定清理所有缓存？" content="此修改将不可逆" onConfirm={onDelete}>
          <Button icon={<IconDelete style={{ color: 'red' }} />} aria-label="清理" />
        </Popconfirm>
      }
    >
      <Space vertical align="start" spacing={16} style={{ width: '100%' }}>
        <Descriptions data={data} />
        <Card style={{ width: '100%' }} title="随机图片本地缓存">
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Space spacing={16} align="center">
              <Text>内存来源权重（%）</Text>
              <InputNumber
                min={0}
                max={100}
                value={memoryWeight}
                onChange={value => {
                  setRandomConfigDirty(true);
                  setMemoryWeight(Number(value || 0));
                }}
              />
            </Space>
            <Space spacing={16} align="center">
              <Text>本地文件来源权重（%）</Text>
              <InputNumber
                min={0}
                max={100}
                value={localWeight}
                onChange={value => {
                  setRandomConfigDirty(true);
                  setLocalWeight(Number(value || 0));
                }}
              />
            </Space>
            <Space spacing={16} align="center">
              <Text>115云来源权重（%）</Text>
              <InputNumber
                min={0}
                max={100}
                value={cloudWeight}
                onChange={value => {
                  setRandomConfigDirty(true);
                  setCloudWeight(Number(value || 0));
                }}
              />
            </Space>
            <Text type={totalWeight === 100 ? 'secondary' : 'danger'}>当前权重总和：{totalWeight}（必须等于100）</Text>
            <Space spacing={16} align="center">
              <Text>内存缓存上限（MB）</Text>
              <InputNumber
                min={100}
                max={102400}
                value={memoryMaxSizeMb}
                onChange={value => {
                  const next = Number(Array.isArray(value) ? value[0] : value);
                  setRandomConfigDirty(true);
                  setMemoryMaxSizeMb(Number.isFinite(next) ? next : 100);
                }}
              />
            </Space>
            <Space spacing={16} align="center">
              <Text>本地缓存上限（MB）</Text>
              <InputNumber
                min={100}
                max={102400}
                value={localMaxSizeMb}
                onChange={value => {
                  const next = Number(Array.isArray(value) ? value[0] : value);
                  setRandomConfigDirty(true);
                  setLocalMaxSizeMb(Number.isFinite(next) ? next : 100);
                }}
              />
            </Space>
            <Button type="primary" loading={savingRandomCacheConfig} onClick={onSaveRandomCacheConfig}>
              保存随机缓存配置
            </Button>
          </Space>
        </Card>
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
    </Card>
  );
}
