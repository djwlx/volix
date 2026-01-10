import { IconExit } from '@douyinfe/semi-icons';
import { Card, Avatar, Space, Button } from '@douyinfe/semi-ui';
import type { Account115UserInfo } from '@volix/types';

interface UserInfoProps {
  info?: Account115UserInfo;
}
export function UserInfo({ info }: UserInfoProps) {
  return (
    <Card style={{ width: '100%' }} shadows="hover">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Avatar alt="Card meta img" size="default" src={info?.face} />
          <span style={{ fontWeight: '500' }}>{info?.user_name}</span>
        </Space>
        <Button icon={<IconExit />} style={{ color: 'red' }} aria-label="退出" />
      </div>
    </Card>
  );
}
