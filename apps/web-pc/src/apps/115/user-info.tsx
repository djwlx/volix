import { get115UserInfo } from '@/services/115';
import { IconExit } from '@douyinfe/semi-icons';
import { Card, Avatar, Space, Button } from '@douyinfe/semi-ui';
import type { Account115UserInfo } from '@volix/types';
import { useEffect, useState } from 'react';

export function UserInfo() {
  const [userInfo, setUserInfo] = useState<Account115UserInfo>();

  const loadUserInfo = async () => {
    const data = await get115UserInfo();
    console.log('115 user info:', data);
    setUserInfo(data.data);
  };

  useEffect(() => {
    loadUserInfo();
  }, []);

  return (
    <Card style={{ width: '100%' }} shadows="hover">
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Space>
          <Avatar alt="Card meta img" size="default" src={userInfo?.face} />
          <span style={{ fontWeight: '500' }}>{userInfo?.user_name}</span>
        </Space>
        <Button icon={<IconExit />} style={{ color: 'red' }} aria-label="退出" />
      </div>
    </Card>
  );
}
