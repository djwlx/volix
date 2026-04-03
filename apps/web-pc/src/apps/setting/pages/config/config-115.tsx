import { Card, Empty, Skeleton, Space, Typography } from '@douyinfe/semi-ui';
import { useOutletContext } from 'react-router';
import { useEffect } from 'react';
import { UserRole } from '@volix/types';
import { Login } from '@/apps/115/login';
import { UserInfo } from '@/apps/115/user-info';
import { useUserInfo } from '@/apps/115/hooks/useUserInfo';
import type { SettingOutletContext } from '@/apps/setting/types';

function SettingConfig115App() {
  const { user, requestNavigate } = useOutletContext<SettingOutletContext>();
  const { data, loading } = useUserInfo();

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    if (!user) {
      return;
    }
    if (!isAdmin) {
      requestNavigate('/setting/info');
    }
  }, [user, isAdmin, requestNavigate]);

  if (!isAdmin) {
    return (
      <Card title="115" shadows="hover">
        <Empty title="暂无权限" description="仅管理员可访问 115" />
      </Card>
    );
  }

  return (
    <Card title="115" shadows="hover" style={{ width: '100%' }}>
      <Skeleton placeholder={<Skeleton.Paragraph rows={6} />} loading={loading}>
        {data ? (
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Typography.Text type="secondary">当前已绑定 115 账号</Typography.Text>
            <UserInfo info={data} />
          </Space>
        ) : (
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Typography.Text type="secondary">请先扫码登录 115 账号</Typography.Text>
            <Login />
          </Space>
        )}
      </Skeleton>
    </Card>
  );
}

export default SettingConfig115App;
