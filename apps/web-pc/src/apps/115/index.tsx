import { UserInfo } from './user-info';
import { PicSetting } from './pic-setting';
import { Space, Skeleton } from '@douyinfe/semi-ui';
import { FileTree } from './file-tree';
import { useUserInfo } from './hooks/useUserInfo';

function My115App() {
  const { data, loading } = useUserInfo();

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <Skeleton active>
          <Skeleton.Paragraph rows={6} />
        </Skeleton>
      </div>
    );
  }
  return (
    <div style={{ padding: 16 }}>
      {data ? (
        <Space spacing="medium" vertical style={{ width: '100%' }}>
          <UserInfo info={data} />
          <PicSetting />
          <FileTree />
        </Space>
      ) : null}
    </div>
  );
}
export default My115App;
