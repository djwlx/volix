import { IconExit } from '@douyinfe/semi-icons';
import { Card, Avatar, Space, Button } from '@douyinfe/semi-ui';

export function UserInfo() {
  return (
    <Card style={{ width: '100%' }} shadows="hover">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Avatar
            alt="Card meta img"
            size="default"
            src="https://lf3-static.bytednsdoc.com/obj/eden-cn/ptlz_zlp/ljhwZthlaukjlkulzlp/card-meta-avatar-docs-demo.jpg"
          />
          <span style={{ fontWeight: '500' }}>低级亡灵</span>
        </Space>
        <Button icon={<IconExit />} style={{ color: '#E91E63' }} aria-label="退出" />
      </div>
    </Card>
  );
}
