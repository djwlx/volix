import { Card, Skeleton, Space, Typography } from '@douyinfe/semi-ui';
import { Login } from '@/apps/115/login';
import { UserInfo } from '@/apps/115/user-info';
import { PicSetting } from '@/apps/115/pic-setting';
import { FileTree } from '@/apps/115/file-tree';
import { useUserInfo } from '@/apps/115/hooks/useUserInfo';

function SettingConfig115App() {
  const { data, loading } = useUserInfo();

  return (
    <Card title="随机图片配置" shadows="hover" style={{ width: '100%' }}>
      <Skeleton placeholder={<Skeleton.Paragraph rows={6} />} loading={loading}>
        {data ? (
          <Space vertical spacing={12} style={{ width: '100%' }}>
            <Typography.Text type="secondary">当前已绑定 115 账号</Typography.Text>
            <UserInfo info={data} />
            <PicSetting />
            <FileTree />
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
