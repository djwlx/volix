import { IconDelete, IconPlus } from '@douyinfe/semi-icons';
import { Button, Card, Descriptions, Space, List } from '@douyinfe/semi-ui';

export function PicSetting() {
  const listdata = ['C:/Users/username/Pictures/Wallpapers', 'D:/Downloads/Images', 'E:/Photos/Vacation'];
  const data = [
    { key: '缓存数量', value: '1,480,000' },
    {
      key: '缓存文件夹',
      value: (
        <List size="small" split={false} dataSource={listdata} renderItem={item => <List.Item>{item}</List.Item>} />
      ),
    },
  ];
  return (
    <Card style={{ width: '100%' }} shadows="hover">
      <div style={{ display: 'flex', alignItems: 'start' }}>
        <Descriptions data={data} style={{ flex: 1 }} />
        <Space style={{ margin: '10px 0' }}>
          <Button icon={<IconPlus />} aria-label="下一张" />
          <Button icon={<IconDelete style={{ color: 'red' }} />} aria-label="喜欢" />
        </Space>
      </div>
    </Card>
  );
}
