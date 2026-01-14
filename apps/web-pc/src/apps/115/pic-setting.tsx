import { IconDelete, IconPlus } from '@douyinfe/semi-icons';
import { Button, Card, Descriptions, Space, List } from '@douyinfe/semi-ui';
import { FilePath } from './components';

export function PicSetting() {
  // const listdata = ['3330079363427206525', '3334701358114669825', '3335504946713855652'];
  const data = [
    { key: '缓存数量', value: '1,480,000' },
    {
      key: '缓存文件夹',
      value: (
        <List
          size="small"
          split={false}
          dataSource={[]}
          renderItem={item => (
            <List.Item>
              <FilePath dir={item} />
            </List.Item>
          )}
        />
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
