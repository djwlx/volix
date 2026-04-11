import { exit115 } from '@/services/115';
import { IconExit } from '@douyinfe/semi-icons';
import { Card, Avatar, Button, Popconfirm, Typography } from '@douyinfe/semi-ui';
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
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Avatar
            alt="Card meta img"
            size="40px"
            shape="circle"
            src={info?.face}
            imgAttr={{ style: { objectFit: 'cover' } }}
            style={{ flex: '0 0 40px' }}
          >
            {info?.user_name?.slice(0, 1) || 'U'}
          </Avatar>
          <Typography.Text ellipsis style={{ minWidth: 0, fontWeight: 500 }}>
            {info?.user_name}
          </Typography.Text>
        </div>
        <Popconfirm title="确定退出账号？" content="此修改将不可逆" onConfirm={onConfirm} onCancel={onCancel}>
          <Button icon={<IconExit />} style={{ color: 'red', flexShrink: 0 }} aria-label="退出" />
        </Popconfirm>
      </div>
    </Card>
  );
}
