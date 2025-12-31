import { changeJob, getJob, pauseQbit, startQbit } from '@/services/job';
import { Button, Card, message, Space, Switch } from 'antd';
import { useEffect, useState } from 'react';

function Qbittorrent() {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [switchLoading, setSwitchLoading] = useState(false);

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

  const swtichChange = async (value: boolean) => {
    try {
      setSwitchLoading(true);
      const result = await changeJob({ qbit: value });
      console.log(result, 'result');

      setIsOpen(value);
    } catch (e) {
    } finally {
      setSwitchLoading(false);
    }
  };

  useEffect(() => {
    setSwitchLoading(true);
    getJob()
      .then((res) => {
        if (res.data?.code === 0) {
          setIsOpen(res.data?.data?.qbit);
        }
      })
      .finally(() => {
        setSwitchLoading(false);
      });
  }, []);

  return (
    <Card title="qBittorrent" hoverable actions={[]}>
      <Space>
        <Switch
          checkedChildren="自动任务开启"
          checked={isOpen}
          loading={switchLoading}
          unCheckedChildren="自动任务关闭"
          onChange={swtichChange}
        />
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
