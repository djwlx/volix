import { UserInfo } from './user-info';
import { PicSetting } from './pic-setting';
import { Button, Empty, Space, Skeleton } from '@douyinfe/semi-ui';
import { FileTree } from './file-tree';
import { useUserInfo } from './hooks/useUserInfo';
import { useNavigate } from 'react-router';

function My115App() {
  const { data, loading } = useUserInfo();
  const navigate = useNavigate();

  return (
    <div style={{ padding: 16 }}>
      <Skeleton placeholder={<Skeleton.Paragraph rows={6} />} loading={loading}>
        {data ? (
          <Space spacing="medium" vertical style={{ width: '100%' }}>
            <UserInfo info={data} />
            <PicSetting />
            <FileTree />
          </Space>
        ) : (
          <Empty
            title="尚未登录115账号"
            description="请先前往 设置 > 账号配置 > 115 完成登录"
            style={{ marginTop: 60 }}
          >
            <Button type="primary" onClick={() => navigate('/setting/config/115')}>
              前往115配置
            </Button>
          </Empty>
        )}
      </Skeleton>
    </div>
  );
}

export default My115App;
