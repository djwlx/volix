import { Button, Card, Descriptions, DescriptionsProps, Popover, Space, Spin } from 'antd';
import StartModal from './StartModal';
import { useModalHook } from '@/hooks';
import { useEffect, useState } from 'react';
import { get115PicInfo } from '@/services/115';
import CidPath from '../cid-path';

function Picture() {
  const { setModalData, ...rest } = useModalHook();
  const [loading, setLoading] = useState(false);
  const [picInfo, setPicInfo] = useState<any>();

  const items: DescriptionsProps['items'] = [
    {
      key: '1',
      label: '当前图片总数',
      children: picInfo?.count || 0,
    },
    {
      key: '2',
      label: '当前随机文件夹路径',
      children: (
        <Space direction="vertical">
          {(picInfo?.paths || [])?.map((pathItem: string) => {
            return <CidPath key={pathItem} cid={pathItem} />;
          })}
        </Space>
      ),
    },
  ];

  const getInfo = async () => {
    try {
      const result = await get115PicInfo();
      setPicInfo(result.data?.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getInfo();
  }, []);

  return (
    <Card
      title="图片信息"
      extra={
        <Space>
          {picInfo?.loading ? (
            <Popover content="正在缓存。。。">
              <Button type="primary" disabled>
                开始缓存
              </Button>
            </Popover>
          ) : (
            <Button
              type="primary"
              onClick={() => {
                setModalData('open', {
                  paths: picInfo?.paths,
                });
              }}
            >
              开始缓存
            </Button>
          )}
        </Space>
      }
    >
      <Spin spinning={loading}>
        <Descriptions items={items} />
      </Spin>
      <StartModal reload={getInfo} {...rest} />
    </Card>
  );
}

export default Picture;
