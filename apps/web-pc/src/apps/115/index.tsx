import { UserInfo } from './user-info';
import { PicSetting } from './pic-setting';
import { Space, Skeleton } from '@douyinfe/semi-ui';
import { FileTree } from './file-tree';
import { useUserInfo } from './hooks/useUserInfo';
import { Login } from './login';

function My115App() {
  const { data, loading } = useUserInfo();

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
          <Login />
        )}
      </Skeleton>
    </div>
  );
}
export default My115App;
