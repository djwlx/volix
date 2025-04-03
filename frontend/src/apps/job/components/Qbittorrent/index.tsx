import { pauseQbit, startQbit } from '@/services/job';
import { Button, Card, message, Space } from 'antd';
import { useState } from 'react';

function Qbittorrent() {
  const [loading, setLoading] = useState(false);

  const startAllTask = async () => {
    try {
      setLoading(true);
      const result = await startQbit();
      if (result.data?.data === 'ok') {
        message.success('成功');
      } else {
        message.error('失败');
      }
    } finally {
      setLoading(false);
    }
  };
  const pauseAllTask = async () => {
    try {
      setLoading(true);
      const result = await pauseQbit();
      if (result.data?.data === 'ok') {
        message.success('成功');
      } else {
        message.error('失败');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card title="qBittorrent" hoverable actions={[]}>
      <Space>
        <Button loading={loading} onClick={startAllTask} type="primary">
          开始所有任务
        </Button>
        <Button loading={loading} onClick={pauseAllTask}>
          停止所有任务
        </Button>
      </Space>
    </Card>
  );
}
export default Qbittorrent;
