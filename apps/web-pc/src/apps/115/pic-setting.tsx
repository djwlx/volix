import { Button, Card, Descriptions, Popconfirm, Space, Table, Tag, Toast, Typography } from '@douyinfe/semi-ui';
import { IconDelete } from '@douyinfe/semi-icons';
import { useEffect, useMemo, useState } from 'react';
import type { Data } from '@douyinfe/semi-ui/lib/es/descriptions';
import type { PicCacheFolderItem } from '@volix/types';
import { clear115Pic, get115PicInfo, retry115Pic } from '@/services/115';
import { getHttpErrorMessage } from '@/utils/error';
import { FilePath } from './components';
import { picCacheStatusOrder, renderPicCacheStatusTag } from './pic-cache-status';

const { Text } = Typography;

export function PicSetting() {
  const [count, setCount] = useState(0);
  const [isCaching, setIsCaching] = useState(false);
  const [folders, setFolders] = useState<PicCacheFolderItem[]>([]);

  const fetch = async () => {
    const result = await get115PicInfo();
    if (result.code === 0) {
      setCount(result.data.count);
      setIsCaching(result.data.loading);
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
    fetch().catch(() => undefined);
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

  const data: Data[] = useMemo(() => {
    return [
      { key: '缓存数量', value: count },
      { key: '缓存目录', value: folders.length },
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
    ];
  }, [count, folders.length, isCaching]);

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
      <Space vertical spacing={16} style={{ width: '100%' }}>
        <Descriptions data={data} />
        <Table<PicCacheFolderItem>
          rowKey="cid"
          pagination={false}
          size="small"
          dataSource={folders}
          columns={[
            {
              title: '目录',
              dataIndex: 'cid',
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
                  {record.status === 'cached' || record.status === 'failed' ? (
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
