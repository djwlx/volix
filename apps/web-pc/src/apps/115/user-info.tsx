import { exit115 } from '@/services/115';
import { IconExit } from '@douyinfe/semi-icons';
import { Card, Avatar, Space, Button, Popconfirm } from '@douyinfe/semi-ui';
import type { Account115UserInfo } from '@volix/types';

interface UserInfoProps {
  info?: Account115UserInfo;
}
export function UserInfo({ info }: UserInfoProps) {
  const onConfirm = async () => {
    await exit115();
    window.location.reload();
  };

  const onCancel = () => {};
  return (
    <Card style={{ width: '100%' }} shadows="hover">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Avatar alt="Card meta img" size="default" src={info?.face} />
          <span style={{ fontWeight: '500' }}>{info?.user_name}</span>
        </Space>
        <Popconfirm title="确定退出账号？" content="此修改将不可逆" onConfirm={onConfirm} onCancel={onCancel}>
          <Button icon={<IconExit />} style={{ color: 'red' }} aria-label="退出" />
        </Popconfirm>
      </div>
    </Card>
  );
}
